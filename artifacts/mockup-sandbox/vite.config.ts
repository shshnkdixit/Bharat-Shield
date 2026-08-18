import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { mockupPreviewPlugin } from "./mockupPreviewPlugin";

// Read envs but do not throw during build. Only validate port when we need to start a dev/preview server.
const rawPort = process.env.PORT;
let port: number | undefined;
if (rawPort !== undefined && rawPort !== "") {
  const p = Number(rawPort);
  if (Number.isNaN(p) || p <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }
  port = p;
}

// For production builds on Vercel, BASE_PATH may not be provided.
// Use a sensible default (root) so builds don't fail.
const basePath = process.env.BASE_PATH ?? "/";

export default defineConfig({
  base: basePath,
  plugins: [
    mockupPreviewPlugin(),
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, ".."),
            }),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    ...(port ? { port } : {}),
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    ...(port ? { port } : {}),
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
