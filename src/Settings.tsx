import { useTheme } from "next-themes"

import { FolderSelection } from "./components/folderSelection"
import ThemeSwitcher from "./components/themeButtons"
import { EncryptionKeyInput } from "./components/encryptionKeyInput"
import { OutputZipName } from "./components/zipNameTemplate"

export function Settings() {
    const { setTheme, theme } = useTheme()

    return (
        <div className="flex flex-col gap-5 px-10">
            <div>
                <label className="text-sm">Theme</label>
                <ThemeSwitcher />
            </div>
            <div>
                <label className="text-sm">Output Path</label>
                <FolderSelection />
            </div>
            <div>
                <label className="text-sm">Key Preset</label>
                <EncryptionKeyInput />
            </div>
            <div>
                <label className="text-sm">Output Zip Name</label>
                <OutputZipName />
            </div>
        </div>
    )
}