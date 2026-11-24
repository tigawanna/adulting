import { fileURLToPath, URL } from "node:url";
import { serverFunctions } from "@solidjs/prerender/integration";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { prerender } from "prerender-crawler/vite";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    solid({ start: true, ssr: true, serverFunctions: true }),
    tailwindcss(),
    prerender({ mode: "static", integrations: [serverFunctions()] }),
  ],
  optimizeDeps: { exclude: ["@ui-sdk/core"] },
  build: { assetsInlineLimit: 0 },
  server: { port: 3060 },
  test: {
    environment: "jsdom",
    globals: false,
    setupFiles: ["./src/test/setup.ts"],
    css: false,
  },
});
