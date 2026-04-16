import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/weight-checkin/" : "./",
  plugins: [react(), tailwindcss(), cloudflare()],
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});