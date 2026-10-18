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

export default defineConfig({ plugins: [react(), courseLibrary()], test: { environment: "node" } });
