// End-to-end check: starts the real service on a throwaway data folder, then drives the built web app in a browser.
//   npm run build && npm run e2e
import { spawn } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../..");
const python = process.env.PYTHON ?? join(root, "venv", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
const port = process.env.E2E_PORT ?? "8765";
const origin = `http://127.0.0.1:${port}`;
const dataDir = mkdtempSync(join(tmpdir(), "studio-e2e-data-"));
const outDir = join(tmpdir(), "studio-e2e-out");
rmSync(outDir, { recursive: true, force: true }); // screenshots from earlier runs would be confusing
mkdirSync(outDir, { recursive: true });

const server = spawn(python, ["-m", "studio.server", "--no-browser", "--port", port], {
  cwd: join(root, "backend"),
  env: { ...process.env, STUDIO_DATA_DIR: dataDir },
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
  await new Promise((done) => (server.exitCode === null ? server.once("exit", done) : done()));
  try {
    rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {
    console.log(`(could not remove the temporary data folder ${dataDir}; it is safe to delete)`);
  }
}
console.log(failed ? "\nE2E FAILED" : "\nE2E passed");
process.exit(failed ? 1 : 0);
