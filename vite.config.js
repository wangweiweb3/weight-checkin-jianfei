import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/weight-checkin/" : "./",
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true, // 如果端口被占用，不自动切换，直接报错
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
