"""Build the downloadable package for the platform this runs on.

    python packaging/build.py

Windows -> packaging/dist/StatsStudio-windows.zip
macOS   -> packaging/dist/StatsStudio-macos-<arm64|x86_64>.zip
Linux   -> packaging/dist/StatsStudio-linux-<x86_64|...>.tar.gz

Needs the project venv (pip install -r backend/requirements.txt pyinstaller) and Node for the web app.
PyInstaller cannot cross-compile, so each platform is built on that platform (the GitHub workflow does all three).
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BUILD = ROOT / "packaging" / "build"
DIST = ROOT / "packaging" / "dist"
MODEL = "sentence-transformers/all-MiniLM-L6-v2"
SYSTEM = {"win32": "windows", "darwin": "macos"}.get(sys.platform, "linux")
ARCH = platform.machine().lower().replace("amd64", "x86_64")

COMMON = """YOUR PROGRESS AND FILES
  Everything is saved on this computer, in:  {data}
  Nothing is sent anywhere unless you choose to connect your own AI key in Settings (optional).
  You can export or delete it all from Settings inside the app.

NEW COURSE MATERIALS
  The app checks for new lecture notes and practice material when it starts (it needs the internet for that).
  When something new is available you will see a banner. Click "Update now". You can also go to
  Course materials > Check for updates.
"""

README_FIRST = {
    "windows": """STATS 132 STUDY STUDIO
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

"""
    + COMMON.format(data="%LOCALAPPDATA%\\StatsStudio")
    + """
IF SOMETHING GOES WRONG
  - The browser shows "Can't reach the study service": the black window was closed. Start StatsStudio.exe again.
  - Another copy is already running: starting it again just reopens your browser. That is fine.
  - To remove the app: delete this folder. To also remove your saved progress, delete the folder above.
""",
    "macos": """STATS 132 STUDY STUDIO
======================

TO START
  1. Unzip this folder somewhere you can find it (for example your Desktop or Documents).
  2. Open the folder and double-click "Start Stats Studio.command".
  3. A Terminal window opens and then your web browser shows the app. Leave the Terminal window open while you
     study. Closing it stops the app.

IF MACOS SAYS "PYTHON.FRAMEWORK IS DAMAGED", "CANNOT BE OPENED", OR "UNIDENTIFIED DEVELOPER"
  Nothing is damaged. macOS says this about any downloaded app that is not signed with an Apple developer
  certificate. Do this once:
  1. Right-click (or Control-click) "Start Stats Studio.command" and choose Open, then Open again in the dialog.
     The starter clears macOS's download flag from the whole folder and starts the app.
  2. If macOS still refuses, open Terminal, type the line below with a space after it, drag the StatsStudio folder
     into the window, and press Return. Then double-click the starter again.
      xattr -dr com.apple.quarantine
  (System Settings > Privacy & Security also shows an "Open Anyway" button after a blocked try.)

"""
    + COMMON.format(data="~/Library/Application Support/StatsStudio")
    + """
IF SOMETHING GOES WRONG
  - The browser shows "Can't reach the study service": the Terminal window was closed. Start it again.
  - Another copy is already running: starting it again just reopens your browser. That is fine.
  - To remove the app: delete this folder. To also remove your saved progress, delete the folder above.
""",
    "linux": """STATS 132 STUDY STUDIO
======================

TO START
  1. Extract the archive somewhere you can find it:   tar xzf StatsStudio-linux-*.tar.gz
  2. Open a terminal in the StatsStudio folder and run:   ./StatsStudio
     (or double-click "start-stats-studio.sh" in your file manager and choose "Run in terminal", if it offers that)
  3. Your web browser opens the app. Leave the terminal open while you study. Closing it stops the app.
     If no browser opens, go to http://127.0.0.1:8765 yourself.

IF IT WILL NOT START
  - "libGL.so.1: cannot open shared object file": install it (Debian/Ubuntu: sudo apt install libgl1;
    Fedora: sudo dnf install mesa-libGL).
  - "Permission denied": run  chmod +x StatsStudio start-stats-studio.sh  and try again.

"""
    + COMMON.format(data="~/.local/share/StatsStudio")
    + """
  An API key is kept in your desktop's keyring when there is one (GNOME Keyring or KWallet); otherwise in a private
  file in the folder above, and Settings says which.

IF SOMETHING GOES WRONG
  - The browser shows "Can't reach the study service": the terminal was closed. Start it again.
  - To remove the app: delete this folder. To also remove your saved progress, delete the folder above.
""",
}

START_COMMAND = (
    "#!/bin/bash\n"
    'cd "$(dirname "$0")"\n'
    # macOS marks everything downloaded from the internet as quarantined, and because this app is not signed with an
    # Apple developer certificate, Gatekeeper then refuses the bundled libraries as "damaged". Once the learner has opened
    # this starter (right-click > Open the first time), clear that flag from the whole folder so the program can load.
    "xattr -dr com.apple.quarantine . 2>/dev/null || true\n"
    "./StatsStudio\n"
)


def run(cmd: list[str], cwd: Path | None = None) -> None:
    print("+", " ".join(cmd))
    subprocess.run(cmd, cwd=cwd, check=True, shell=(sys.platform == "win32" and cmd[0] == "npm"))


def size_mb(path: Path) -> float:
    return sum(f.stat().st_size for f in path.rglob("*") if f.is_file()) / (1024 * 1024)


def main() -> None:
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
    out = DIST / "StatsStudio"

    # 4. Windows only: PyInstaller bundles whatever (sometimes old) Visual C++ runtime it finds, and onnxruntime crashes
    # on an old one, so replace them with the current ones from this machine. (Students then need no separate install.)
    if SYSTEM == "windows":
        system32 = Path(os.environ.get("SystemRoot", r"C:\Windows")) / "System32"
        for dll in ("msvcp140.dll", "msvcp140_1.dll", "msvcp140_2.dll", "vcruntime140.dll", "vcruntime140_1.dll", "concrt140.dll"):
            if (system32 / dll).exists() and (out / "_internal" / dll).exists():
                shutil.copy2(system32 / dll, out / "_internal" / dll)

    # 5. instructions, a double-click starter where the platform needs one, and the archive
    newline = "\r\n" if SYSTEM == "windows" else "\n"
    (out / "README-FIRST.txt").write_text(README_FIRST[SYSTEM], encoding="utf-8", newline=newline)
    if SYSTEM == "macos":
        starter = out / "Start Stats Studio.command"
        starter.write_text(START_COMMAND, encoding="utf-8", newline="\n")
        starter.chmod(0o755)
    elif SYSTEM == "linux":
        starter = out / "start-stats-studio.sh"
        starter.write_text(START_COMMAND, encoding="utf-8", newline="\n")
        starter.chmod(0o755)

    if SYSTEM == "windows":
        archive = Path(shutil.make_archive(str(DIST / "StatsStudio-windows"), "zip", DIST, "StatsStudio"))
    elif SYSTEM == "macos":
        archive = DIST / f"StatsStudio-macos-{ARCH}.zip"
        archive.unlink(missing_ok=True)
        # ditto keeps the executable bits and Mac metadata that a plain zip can lose
        run(["ditto", "-c", "-k", "--keepParent", str(out), str(archive)])
    else:
        archive = DIST / f"StatsStudio-linux-{ARCH}.tar.gz"
        with tarfile.open(archive, "w:gz") as tar:
            tar.add(out, arcname="StatsStudio")
    print(f"\nBuilt {out} ({size_mb(out):.0f} MB unpacked) and {archive} ({archive.stat().st_size / (1024 * 1024):.0f} MB)")


if __name__ == "__main__":
    main()
