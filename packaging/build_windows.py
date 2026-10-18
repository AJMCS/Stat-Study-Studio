"""Build the double-click Windows package: dist/StatsStudio/ and dist/StatsStudio-windows.zip

    python packaging/build_windows.py

Needs the project venv (pip install -r backend/requirements.txt pyinstaller) and Node for the web app.
Run it on Windows; Mac and Linux builds come later.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "packaging" / "build"
DIST = ROOT / "packaging" / "dist"
MODEL = "sentence-transformers/all-MiniLM-L6-v2"

README_FIRST = """STATS 132 STUDY STUDIO
======================

TO START
  1. Unzip this folder somewhere you can find it (for example your Desktop or Documents).
     Do not run it from inside the zip file.
  2. Open the folder and double-click StatsStudio.exe.
  3. A black window opens and then your web browser shows the app. Leave the black window open while you
     study. Closing it stops the app.

IF WINDOWS SAYS "WINDOWS PROTECTED YOUR PC"
  This is normal for apps that are not sold through the Microsoft Store. Click "More info", then "Run anyway".
  You only need to do this the first time.

YOUR PROGRESS AND FILES
  Everything is saved on this computer, in:  %LOCALAPPDATA%\\StatsStudio
  Nothing is sent anywhere unless you choose to connect an AI service (not available yet).
  You can export or delete it all from Settings inside the app.

NEW COURSE MATERIALS
  The app checks for new lecture notes and practice material when it starts (it needs the internet for that).
  When something new is available you will see a banner. Click "Update now". You can also go to
  Course materials > Check for updates.

IF SOMETHING GOES WRONG
  - The browser shows "Can't reach the study service": the black window was closed. Start StatsStudio.exe again.
  - Another copy is already running: starting it again just reopens your browser. That is fine.
  - To remove the app: delete this folder. To also remove your saved progress, delete the folder above.
"""


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True, shell=(sys.platform == "win32" and cmd[0] == "npm"))


def main() -> None:
    if sys.platform != "win32":
        print("Only the Windows package is set up so far.")
    shutil.rmtree(BUILD, ignore_errors=True)
    BUILD.mkdir(parents=True)

    # 1. the web app (the service serves the course library itself, so it is not copied into the web folder)
    run(["npm", "run", "build"], cwd=ROOT / "app")
    shutil.copytree(ROOT / "app" / "dist", BUILD / "web", ignore=shutil.ignore_patterns("course-library"))

    # 2. the search model, downloaded into exactly the layout the app reads it from
    from fastembed import TextEmbedding

    TextEmbedding(model_name=MODEL, cache_dir=str(BUILD / "models"))

    # 3. the program
    run([sys.executable, "-m", "PyInstaller", "--noconfirm", "--clean", "--distpath", str(DIST), "--workpath", str(BUILD / "work"), str(ROOT / "packaging" / "studio.spec")])

    # 4. PyInstaller bundles whatever (sometimes old) Visual C++ runtime it finds; onnxruntime crashes on an old one,
    # so replace them with the current ones from this machine. (Students then need no separate install.)
    out = DIST / "StatsStudio"
    system32 = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32"
    for dll in ("msvcp140.dll", "msvcp140_1.dll", "msvcp140_2.dll", "vcruntime140.dll", "vcruntime140_1.dll", "concrt140.dll"):
        if (system32 / dll).exists() and (out / "_internal" / dll).exists():
            shutil.copy2(system32 / dll, out / "_internal" / dll)

    # 5. instructions and the zip
    (out / "README-FIRST.txt").write_text(README_FIRST, encoding="utf-8", newline="\r\n")
    archive = shutil.make_archive(str(DIST / "StatsStudio-windows"), "zip", DIST, "StatsStudio")
    size = lambda p: sum(f.stat().st_size for f in Path(p).rglob("*") if f.is_file()) / (1024 * 1024)  # noqa: E731
    print(f"\nBuilt {out} ({size(out):.0f} MB unpacked) and {archive} ({Path(archive).stat().st_size / (1024 * 1024):.0f} MB)")


if __name__ == "__main__":
    main()
