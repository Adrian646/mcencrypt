import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Titlebar } from "./components/titlebar";
import { Toaster } from "./components/ui/sonner";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Settings } from "./Settings";
import { ThemeProvider } from "next-themes";

const window = getCurrentWindow()

let mainScreenContent = null;

switch (window.label) {
    case "settings":
        mainScreenContent = <Settings />;
        break;
    default:
        mainScreenContent = <App />;
        break;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <Titlebar />
            <Toaster />
            <main>
                {mainScreenContent}
            </main>
        </ThemeProvider>
    </React.StrictMode>,
);
