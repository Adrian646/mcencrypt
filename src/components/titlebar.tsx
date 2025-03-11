import { getCurrentWindow } from "@tauri-apps/api/window";
import { useState } from "react";
import { Button } from "./ui/button";
import { MinusIcon, PinIcon, SettingsIcon, XIcon } from "lucide-react";
import { motion } from "framer-motion";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { LogicalSize, Size } from "@tauri-apps/api/dpi";

export function Titlebar() {
    const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(false);
    const appWindow = getCurrentWindow();
    const isSettingsWindow = appWindow.label === "settings";

    function hadnleSetAlwaysOnTop() {
        appWindow.setAlwaysOnTop(!isAlwaysOnTop);
        setIsAlwaysOnTop(!isAlwaysOnTop);
    }

    async function handleSettings() {
        const prevWindow = await WebviewWindow.getByLabel("settings");

        if (prevWindow) {
            prevWindow.show()
            prevWindow.setFocus()
            return;
        }

        const settingsWindow = new WebviewWindow("settings", {
            url: 'src/index.html'
        });

        settingsWindow.once('tauri://created', async () => {
            settingsWindow.setDecorations(false)
            settingsWindow.show();
            settingsWindow.setFocus();
            settingsWindow.setMinSize(new LogicalSize(400, 500));
            settingsWindow.setTitle("MCEncrypt Settings");
        });

        settingsWindow.once('tauri://error', function (e) {
            throw new Error(JSON.stringify(e));
        });
    }

    const [hoverSettings, setHoverSettings] = useState(false);

    return (
        <div data-tauri-drag-region className="data-tauri-drag-region flex justify-between items-center h-10 w-full">
            <div className="ml-2">
                {!isSettingsWindow &&
                    <Button
                        className="w-8 h-8 cursor-pointer"
                        variant={"outline"}
                        onClick={handleSettings}
                        onMouseEnter={() => setHoverSettings(true)}
                        onMouseLeave={() => setHoverSettings(false)}
                    >
                        <motion.div animate={{ rotate: hoverSettings ? 45 : 0 }}>
                            <SettingsIcon />
                        </motion.div>
                    </Button>
                }
            </div>
            <div className="flex items-center space-x-2 mr-2">
                <Button
                    className="w-8 h-8 cursor-pointer"
                    variant={isAlwaysOnTop ? "secondary" : "outline"}
                    onClick={hadnleSetAlwaysOnTop}
                >
                    <motion.div animate={{ rotate: isAlwaysOnTop ? 45 : 0 }}>
                        <PinIcon />
                    </motion.div>
                </Button>

                <Button className="w-8 h-8 cursor-pointer" variant={"outline"} onClick={() => appWindow.minimize()}>
                    <MinusIcon />
                </Button>

                <Button className="w-8 h-8 cursor-pointer" variant={"outline"} onClick={() => appWindow.close()}>
                    <XIcon />
                </Button>
            </div>
        </div>
    );
}