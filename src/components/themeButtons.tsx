import { useTheme } from "next-themes"
import { Sun, Moon, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

export default function ThemeSwitcher() {
    const { setTheme, theme } = useTheme()

    return (
        <div className="flex h-10 w-full overflow-hidden rounded-lg border">
            <Button
                variant="ghost"
                className={`cursor-pointer relative h-full flex-1 rounded-none rounded-l-lg ${theme === "light" ? "bg-secondary" : ""}`}
                onClick={() => setTheme("light")}
            >
                <Sun className="h-5 w-5 mr-2" />
                <span>Light</span>
            </Button>

            <Separator orientation="vertical" />

            <Button
                variant="ghost"
                className={`cursor-pointer relative h-full flex-1 rounded-none ${theme === "dark" ? "bg-secondary" : ""}`}
                onClick={() => setTheme("dark")}
            >
                <Moon className="h-5 w-5 mr-2" />
                <span>Dark</span>
            </Button>

            <Separator orientation="vertical" />

            <Button
                variant="ghost"
                className={`cursor-pointer relative h-full flex-1 rounded-none rounded-r-lg ${theme === "system" ? "bg-secondary" : ""}`}
                onClick={() => setTheme("system")}
            >
                <Monitor className="h-5 w-5 mr-2" />
                <span>System</span>
            </Button>
        </div>
    )
}