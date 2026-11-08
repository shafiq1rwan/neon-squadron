import { defineConfig } from "vite";

// Poki serves builds from a sub-path, so every asset URL must be relative.
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
  },
  server: { port: 5173 },
});
