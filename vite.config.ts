import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { resolve } from "path";

const host = process.env.TAURI_DEV_HOST;

// https://vitejs.dev/config/
export default defineConfig(async () => ({
    plugins: [react(), tailwindcss(), nodePolyfills({ include: ["crypto", "buffer", "util", "stream", "path", "vm"] })],

    clearScreen: false,
    resolve: {
        alias: {
            "@": resolve(__dirname, "./src"),
        },
    },
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: "ws",
                host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell vite to ignore watching `src-tauri`
            ignored: ["**/src-tauri/**"],
        },
    },
}));
