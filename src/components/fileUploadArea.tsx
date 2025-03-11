import { useEffect, useState } from "react"
import { FolderOpen, X } from "lucide-react"
import { open } from '@tauri-apps/plugin-dialog';

interface FileUploadAreaProps {
    onFolderUpdate: (filePath: string | undefined) => void
}

export function FolderSelector({ onFolderUpdate }: FileUploadAreaProps) {
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        onFolderUpdate(selectedFolder)
    }, [selectedFolder])

    async function handleSelectFolder() {
        try {
            setLoading(true)
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select a folder",
            })

            if (selected === null) return

            const folderPath = selected as string
            setSelectedFolder(folderPath)

        } catch (error) {
            console.error("Error selecting folder:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className="flex flex-col items-center w-full justify-center p-6 aspect-square border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 dark:bg-zinc-950 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            onClick={handleSelectFolder}
        >
            <FolderOpen className="h-12 w-12 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? "Selecting folder..." : "Click to select a folder"}
            </p>
        </div>
    )
}

