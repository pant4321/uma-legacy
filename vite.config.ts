import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(rootDir, "src"),
  base: "/uma-legacy/",
  publicDir: path.join(rootDir, "public"),
  plugins: [react()],
  build: {
    outDir: path.join(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    fs: { allow: [rootDir] },
  },
  preview: {
    port: 4173,
  },
  test: {
    environment: "node",
    globals: true,
    root: rootDir,
    dir: path.join(rootDir, "src"),
  },
});
