//lowkey unused
import { join } from "@tauri-apps/api/path";
import { readFile, readDir, exists } from "@tauri-apps/plugin-fs";
import { minimatch } from "minimatch";
import { createCipheriv } from "crypto";
import JSZip from "jszip";

const ALGORITHM = "aes-256-cfb";

const MAGIC_BUFFER = Buffer.from([0xFC, 0xB9, 0xCF, 0x9B]);
const VERSION_BUFFER = Buffer.from([0x00, 0x00, 0x00, 0x00]);

const EXCLUDED_PATTERNS = [
    "pack_icon.{png,jpg,jpeg}",
    "manifest.json",
    "texts/**/*"
]

interface FileMeta {
    relativePath: string;
    fullPath: string;
    content: Buffer;
}

export interface PackEncryptionStatus {
    processedFiles: number;
    totalFiles: number;
    state: "encrypting" | "zipping" | "done"
}

export type PackEncryptionMessage = ({ messageType: "diagnostics" } & PackEncryptionStatus) |
{ messageType: "data", masterKey: string, zipContent: ArrayBuffer } |
{ messageType: "error", error: string }

async function traverseRecursive(path: string): Promise<FileMeta[]> {
    path = path.replace(/\\/g, "/");

    const files: FileMeta[] = [];
    const dirQueue: string[] = [path];

    while (dirQueue.length > 0) {
        const current = dirQueue.shift()!;
        const contents = await readDir(current);

        for (const item of contents) {
            if (item.isSymlink) throw new Error("Symlinks are not supported");
            const filePath = (await join(current, item.name)).replace(/\\/g, "/");

            if (item.isDirectory) {
                dirQueue.push(filePath);
            }

            if (item.isFile) {
                files.push({
                    relativePath: filePath.replace(path, "").substring(1),
                    fullPath: filePath,
                    content: Buffer.from(await readFile(filePath))
                });
            }
        }
    }

    return files;
}

function generateRandomKey(): Buffer {
    return Buffer.from(
        Array.from({ length: 32 }, () => {
            const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            return characters.charAt(Math.floor(Math.random() * characters.length));
        }).join("")
    );
}

export function getMasterKey(): Buffer {
    const preKey = localStorage.getItem("masterKey")
    if (preKey) return Buffer.from(preKey)
    return generateRandomKey()
}

export async function encryptPackFromPath(path: string) {
    if (!await exists(path)) {
        throw new Error("Path does not exist");
    }

    const contentsStorage: { content: { key: string | null, path: string }[] } = {
        content: [{ key: null, path: "manifest.json" }]
    }

    const masterKey = getMasterKey();
    const files = await traverseRecursive(path);
    const iv = masterKey.subarray(0, 16);

    const hasContents = files.some(file => file.relativePath === "contents.json");

    let totalFiles = files.length + Number(!hasContents);
    let processedFiles = 0;

    function encryptContentsFile(): Buffer {
        const manifestFile = files.find(file => file.relativePath === "manifest.json");
        if (!manifestFile) throw new Error("Manifest file not found");

        const manifest = JSON.parse(manifestFile.content.toString());
        const manifestUUID = manifest?.header?.uuid;

        if (!manifestUUID) throw new Error("Manifest UUID not found");

        const cipher = createCipheriv(ALGORITHM, masterKey, iv);
        const encryptedContent = cipher.update(Buffer.from(JSON.stringify(contentsStorage)));

        return Buffer.concat([
            VERSION_BUFFER,
            MAGIC_BUFFER,
            Buffer.alloc(0x08),
            Buffer.from([manifestUUID.length]),
            Buffer.from(manifestUUID),
            Buffer.alloc(0x0cb),
            encryptedContent
        ])
    }

    const zip = new JSZip();

    for (const file of files) {
        const shouldEncrypt = EXCLUDED_PATTERNS.every(pattern => !minimatch(file.relativePath, pattern));

        if (!shouldEncrypt) {
            contentsStorage.content.push({ key: null, path: file.relativePath });
            zip.file(file.relativePath, file.content);
            continue;
        }

        const subKey = generateRandomKey();
        const cfbCipher = createCipheriv(ALGORITHM, masterKey, iv);

        const encryptedContent = cfbCipher.update(file.content)

        zip.file(file.relativePath, encryptedContent);
        contentsStorage.content.push({ key: subKey.toString(), path: file.relativePath });
    }

    zip.file("contents.json", encryptContentsFile());
    processedFiles++;

    const zipContent = await zip.generateAsync({ type: "uint8array" });

    return {
        masterKey,
        zipContent
    };
}