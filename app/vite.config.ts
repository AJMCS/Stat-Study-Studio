import { cpSync, existsSync, statSync, createReadStream } from "node:fs";
import { resolve, normalize, join } from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const LIBRARY = resolve(__dirname, "../course-library");

/** Serves the shared course library (repo root) at /course-library/ in dev and copies it into dist on build. */
function courseLibrary(): Plugin {
  return {
    name: "course-library",
    configureServer(server) {
      server.middlewares.use("/course-library", (req, res, next) => {
        const rel = decodeURIComponent((req.url ?? "").split("?")[0]);
        const file = normalize(join(LIBRARY, rel));
        if (!file.startsWith(LIBRARY) || !existsSync(file) || !statSync(file).isFile()) return next();
        res.setHeader("Content-Type", file.endsWith(".pdf") ? "application/pdf" : "application/octet-stream");
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      if (existsSync(LIBRARY)) cpSync(LIBRARY, resolve(__dirname, "dist/course-library"), { recursive: true });
    },
  };
}

// In development the web app runs on :5173 and talks to the local service (python -m studio.server --dev).
export default defineConfig({
  plugins: [react(), courseLibrary()],
  server: { proxy: { "/api": "http://127.0.0.1:8765" } },
  test: { environment: "node" },
});
