import { open } from "@tauri-apps/plugin-dialog"
import { useEffect, useState } from "react"
import { Input } from "./ui/input"
import { Button } from "./ui/button"

export function FolderSelection() {
    const [isLoading, setIsLoading] = useState(false)
    const [selectedFolder, setSelectedFolder] = useState<string | undefined>()

    useEffect(() => {
        const savedFolder = localStorage.getItem('outputFolder')
        if (savedFolder) {
            setSelectedFolder(savedFolder)
        }
    }, [])

    async function handleSelectFolder() {
        try {
            setIsLoading(true)
            const selected = await open({
                directory: true,
                multiple: false,
                title: "Select a folder",
            })

            if (selected === null) return

            const folderPath = (selected as string).replace(/\\/g, '/')
            setSelectedFolder(folderPath)

            localStorage.setItem('outputFolder', folderPath)

        } catch (error) {
            console.error("Error selecting folder:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return <div className="flex gap-5">
        <Input
            readOnly
            value={selectedFolder || ''}
            placeholder="No folder selected"
        />
        <Button onClick={handleSelectFolder} disabled={isLoading} className="cursor-pointer">Choose</Button>
    </div>
}