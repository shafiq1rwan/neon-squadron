import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Relative base so the static build works from any sub-path (required for Poki hosting).
  base: './',
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsInlineLimit: 4096,
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
