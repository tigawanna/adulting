import { fileURLToPath, URL } from "node:url";
import { serverFunctions } from "@solidjs/prerender/integration";
import solid from "@solidjs/vite-plugin";
import { prerender } from "prerender-crawler/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    solid({ start: true, ssr: true, serverFunctions: true }),
    prerender({ mode: "static", integrations: [serverFunctions()] }),
  ],
  build: { assetsInlineLimit: 0 },
  server: {
    port: 3061,
    proxy: {
      "/api": {
        target: process.env.API_ORIGIN ?? "http://localhost:3161",
        changeOrigin: true,
      },
    },
  },
});
