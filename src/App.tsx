import { useEffect, useState } from "react";
import { FolderSelector } from "./components/fileUploadArea";
import { Skeleton } from "./components/ui/skeleton";
import { Button } from "./components/ui/button";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

import { getMasterKey } from "./lib/encrypt";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { listen } from "@tauri-apps/api/event";
import { readFile } from "@tauri-apps/plugin-fs";
import { join } from "path";
import { requiredManifest } from "./lib/shemas";
import { asFormatedString } from "./components/zipNameTemplate";

type PackState = "none" | "idle" | "loading" | "encrypting"

export default function App() {
    const [packState, setPackState] = useState<PackState>("none")
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>()
    const [packImage, setPackImage] = useState<string | undefined>()

    let squareContent = null

    useEffect(() => {
        if (!selectedFolder) return
        setPackState("loading")
        invoke<ArrayBuffer>("get_pack_image", { selectedFolder }).then((imageBuffer) => {
            if (imageBuffer.byteLength === 0) {
                toast("No pack icon found in the selected folder")
                setPackState("none")

                return
            }

            const blob = new Blob([imageBuffer]);
            const imageUrl = URL.createObjectURL(blob);
            setPackImage(imageUrl);
            setPackState("idle")
        })
    }, [selectedFolder])

    useEffect(() => {
        const listener = listen<string>("error", (errorMsg) => {
            toast(errorMsg.payload)
        })

        return () => {
            listener.then(x => x())
        }
    }, [])

    switch (packState) {
        case "none":
            squareContent = <FolderSelector onFolderUpdate={(folder) => {
                setSelectedFolder(folder)
            }} />
            break
        case "loading":
            squareContent = <Skeleton className="min-w-full aspect-square rounded-lg" />
            break
        case "idle":
            squareContent = <img src={packImage} alt="Pack Image" className="min-w-full aspect-square rounded-lg" style={{ imageRendering: "pixelated" }} />
            break
        case "encrypting":
            squareContent = <>
                <img src={packImage} alt="Pack Image" className="min-w-full aspect-square rounded-lg" style={{ imageRendering: "pixelated" }} />
            </>

            break
    }

    async function handleEncrypt() {
        const outputFolder = localStorage.getItem('outputFolder')

        if (!outputFolder) {
            toast("No output folder selected. Please select an output folder in the settings")
            return
        }

        if (!selectedFolder) {
            toast("No pack selected")
            return
        }

        try {
            setPackState("encrypting")
            //const { masterKey, zipContent } = await encryptPackFromPath(selectedFolder)

            //writeFile(outputFolder + "/pack.js.zip", zipContent)
            //writeFile(outputFolder + "/pack.js.zip.key", Buffer.from(masterKey))

            const manifest = Buffer.from(await readFile(join(selectedFolder, "manifest.json"))).toString()

            if (!manifest) {
                toast("No manifest.json file found.")
                return
            }

            const { success, data, error } = requiredManifest.safeParse(JSON.parse(manifest))

            if (!success) {
                toast(error.message)
                return
            }

            const packName = data.header.name
            const formatedZipName = asFormatedString((localStorage.getItem("zipNameTemplate") || `${packName}_encrypted`), { packName })

            const didSucceed = await invoke("encrypt_from_path", {
                path: selectedFolder,
                destPath: outputFolder,
                formatedZipName,
                packUuid: data.header.uuid,
                masterKey: getMasterKey().toString()
            })

            if (didSucceed) {
                toast("Pack encrypted successfully", {
                    action: {
                        label: "Open Folder",
                        onClick: () => {
                            revealItemInDir(join(outputFolder, formatedZipName + ".zip"))
                        }
                    }
                })
            } else toast("Pack encrypted with errors!")

        } catch (error) {
            toast("Error encrypting pack: " + ((error as Error).message || error))
        } finally { setPackState("idle"); }
    }

    return (
        <div className="px-10 py-5 w-full h-full flex flex-col items-center justify-center gap-10">
            {squareContent}
            <div className="flex gap-5">
                <Button onClick={() => handleEncrypt()} className="w-32 cursor-pointer" disabled={packState !== "idle"}>
                    Encrypt
                </Button>
                <Button className="w-32 cursor-pointer" variant={"destructive"} disabled={packState !== "idle"} onClick={() => {
                    setSelectedFolder(undefined)
                    setPackImage(undefined)
                    setPackState("none")
                }}>
                    Eject
                </Button>
            </div>
        </div>
    );
}
