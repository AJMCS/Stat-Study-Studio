// End-to-end check: starts the real service on a throwaway data folder, then drives the built web app in a browser.
//   npm run build && npm run e2e
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const python = process.env.PYTHON ?? join(root, "venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const port = process.env.E2E_PORT ?? "8765";
const origin = `http://127.0.0.1:${port}`;
const dataDir = mkdtempSync(join(tmpdir(), "studio-e2e-data-"));
const outDir = join(tmpdir(), "studio-e2e-out");
rmSync(outDir, { recursive: true, force: true }); // screenshots from earlier runs would be confusing
mkdirSync(outDir, { recursive: true });

// A stand-in for GitHub: serves a "newer" course library (Lecture 3's title changed) so the update flow can be driven.
const lectureRel = "transcripts/lecture-notes/lecture-03-the-posterior-distribution.md";
const manifest = JSON.parse(readFileSync(join(root, "course-library", "library.json"), "utf8"));
const remoteDir = mkdtempSync(join(tmpdir(), "studio-e2e-remote-"));
const revised = readFileSync(join(root, "course-library", lectureRel), "utf8")
  .replace(/\r\n/g, "\n")
  .replace("# Lecture 3: The Posterior Distribution", "# Lecture 3: The Posterior Distribution (revised)");
mkdirSync(dirname(join(remoteDir, lectureRel)), { recursive: true });
writeFileSync(join(remoteDir, lectureRel), revised);
manifest.version += 1;
manifest.files[lectureRel] = { sha256: createHash("sha256").update(revised).digest("hex"), size: Buffer.byteLength(revised) };
writeFileSync(join(remoteDir, "library.json"), JSON.stringify(manifest));
const updateServer = createServer((req, res) => {
  try {
    const body = readFileSync(join(remoteDir, decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "")));
    res.writeHead(200, { "Content-Length": body.length });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end();
  }
});
await new Promise((ready) => updateServer.listen(0, "127.0.0.1", ready));
const updateBase = `http://127.0.0.1:${updateServer.address().port}/`;

// STUDIO_EXE=path/to/StatsStudio.exe runs the tests against the packaged app instead of the source tree.
const exe = process.env.STUDIO_EXE;
const server = spawn(exe ?? python, exe ? ["--no-browser", "--port", port] : ["-m", "studio.server", "--no-browser", "--port", port], {
  cwd: exe ? undefined : join(root, "backend"),
  env: { ...process.env, STUDIO_DATA_DIR: dataDir, STUDIO_UPDATE_BASE: updateBase, STUDIO_AUTOCHECK: "1" },
  stdio: "inherit",
});

async function waitForService() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${origin}/api/health`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("The study service did not start.");
}

const run = (script) =>
  new Promise((done) => {
    const p = spawn(process.execPath, [join(import.meta.dirname, script), outDir], {
      env: { ...process.env, ORIGIN: origin, BASE: `${origin}/#` },
      stdio: "inherit",
    });
    p.on("exit", (code) => done(code ?? 1));
  });

let failed = false;
try {
  await waitForService();
  for (const script of ["app.mjs", "service.mjs"]) {
    console.log(`\n=== ${script} ===`);
    if ((await run(script)) !== 0) failed = true;
  }
} finally {
  server.kill();
  updateServer.close();
  rmSync(remoteDir, { recursive: true, force: true });
  await new Promise((done) => (server.exitCode === null ? server.once("exit", done) : done()));
  try {
    rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    console.log(`(could not remove the temporary data folder ${dataDir}; it is safe to delete)`);
  }
}
console.log(failed ? "\nE2E FAILED" : "\nE2E passed");
process.exit(failed ? 1 : 0);
