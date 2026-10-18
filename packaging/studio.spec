# PyInstaller recipe for the double-click package. Build with:  python packaging/build_windows.py
# One folder (not one file): starts faster, and is less likely to be flagged by antivirus.
from pathlib import Path

from PyInstaller.utils.hooks import collect_all, collect_submodules

ROOT = Path(SPECPATH).parent
BUILD = ROOT / "packaging" / "build"

datas, binaries, hiddenimports = [], [], []
for package in ("rapidocr", "fastembed", "onnxruntime", "pymupdf", "tokenizers", "docx", "rank_bm25", "multipart", "platformdirs", "huggingface_hub", "keyring", "httpx"):
    d, b, h = collect_all(package)
    datas += d
    binaries += b
    hiddenimports += h
hiddenimports += collect_submodules("studio") + collect_submodules("uvicorn") + collect_submodules("keyring.backends") + ["multipart", "python_multipart", "win32ctypes.core"]

datas += [
    (str(ROOT / "course-library"), "course-library"),  # the shared course library, so the app works offline
    (str(BUILD / "web"), "web"),  # the built web app
    (str(BUILD / "models"), "models"),  # the search model, so the first run needs no internet
    (str(ROOT / "backend" / "studio" / "channel.json"), "studio"),  # where course updates come from
]

a = Analysis(
    [str(ROOT / "backend" / "studio" / "launcher.py")],
    pathex=[str(ROOT / "backend")],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    excludes=["tkinter", "matplotlib", "pytest", "IPython", "notebook", "pandas", "scipy", "sympy"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="StatsStudio", console=True, upx=False)
coll = COLLECT(exe, a.binaries, a.datas, upx=False, name="StatsStudio")
