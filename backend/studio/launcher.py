"""What runs when a student double-clicks StatsStudio.exe (and `python -m studio.launcher` during development).

It starts the local service, opens the app in the default browser, and keeps running until the window is closed.
If a copy is already running it just opens the browser to it, and if the usual port is busy it picks the next one.
"""

from __future__ import annotations

import argparse
import json
import os
import socket
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

DEFAULT_PORT = 8765
PORT_TRIES = 10


def bundle_root() -> Path | None:
    """The folder PyInstaller unpacked the app into, or None when running from source."""
    return Path(getattr(sys, "_MEIPASS")) if getattr(sys, "frozen", False) else None


def _preload_bundled_onnxruntime(root: Path) -> None:
    """Windows 11 ships its own onnxruntime.dll in System32; load ours first so Python does not pick that one up (it crashes)."""
    dll = root / "onnxruntime" / "capi" / "onnxruntime.dll"
    if os.name == "nt" and dll.exists():
        import ctypes

        os.add_dll_directory(str(dll.parent))
        ctypes.WinDLL(str(dll))


def _port_free(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 0)
        return s.connect_ex(("127.0.0.1", port)) != 0


def _is_our_service(port: int) -> bool:
    try:
        with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=1.5) as r:  # noqa: S310
            data = json.loads(r.read(4096))
        return bool(data.get("ok")) and "version" in data
    except Exception:
        return False


def choose_port(preferred: int) -> tuple[int, bool]:
    """(port, already_running). Reuses a running copy of this app, otherwise the first free port from `preferred`."""
    for port in range(preferred, preferred + PORT_TRIES):
        if _is_our_service(port):
            return port, True
        if _port_free(port):
            return port, False
    raise SystemExit(f"Ports {preferred} to {preferred + PORT_TRIES - 1} are all in use. Close other programs and try again.")


def _set_title(title: str) -> None:
    if os.name == "nt":
        try:
            import ctypes

            ctypes.windll.kernel32.SetConsoleTitleW(title)
        except Exception:
            pass


def _open_when_ready(url: str, port: int) -> None:
    for _ in range(100):
        if _is_our_service(port):
            break
        time.sleep(0.15)
    if not webbrowser.open(url):
        print(f"Could not open a browser automatically. Open this address yourself: {url}")


def selftest() -> int:
    """Used to check a freshly built package on a machine: each step prints before it runs, so a crash shows where."""
    steps = []

    def step(name):
        def wrap(fn):
            steps.append((name, fn))
            return fn

        return wrap

    @step("onnx runtime")
    def _():
        import onnxruntime

        print(onnxruntime.__version__, end=" ", flush=True)

    @step("tokenizer")
    def _():
        import tokenizers  # noqa: F401

    @step("search model")
    def _():
        from studio.embedder import Embedder

        model = Embedder(cache_dir=Path(os.environ["STUDIO_MODEL_CACHE"]) if os.environ.get("STUDIO_MODEL_CACHE") else None).ensure()
        assert model is not None, "model did not load"
        assert len(list(model.embed(["posterior distribution"]))[0]) == 384

    @step("pdf reader")
    def _():
        import pymupdf

        pymupdf.open().new_page()

    @step("text recognition")
    def _():
        from rapidocr import RapidOCR

        RapidOCR()

    for name, fn in steps:
        print(f"  {name} ...", end=" ", flush=True)
        try:
            fn()
        except Exception as e:
            print(f"FAILED: {e}")
            return 1
        print("ok")
    return 0


def main(argv: list[str] | None = None) -> None:
    ap = argparse.ArgumentParser(description="Stats 132 Study Studio")
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--no-browser", action="store_true", help="do not open a browser window")
    ap.add_argument("--selftest", action="store_true", help="check that the search model and parsers load, then exit")
    args = ap.parse_args(argv)

    root = bundle_root()
    if root is not None:
        # Packaged app: everything it needs is next to the program, so it works with no internet.
        _preload_bundled_onnxruntime(root)
        models = root / "models"
        if models.exists():
            os.environ.setdefault("STUDIO_MODEL_CACHE", str(models))
            os.environ.setdefault("HF_HUB_OFFLINE", "1")

    if args.selftest:
        raise SystemExit(selftest())

    port, running = choose_port(args.port)
    url = f"http://127.0.0.1:{port}/"
    if running:
        print(f"Stats 132 Study Studio is already running. Opening {url}")
        if not args.no_browser:
            webbrowser.open(url)
        return

    import uvicorn

    from studio.app import create_app, default_data_dir

    kwargs = {}
    if root is not None:
        kwargs = {"library_dir": root / "course-library", "static_dir": root / "web"}
    app = create_app(port=port, **kwargs)

    _set_title("Stats 132 Study Studio (leave this window open while you study)")
    print("Stats 132 Study Studio")
    print(f"  Open in your browser: {url}")
    print(f"  Your progress is saved on this computer in: {default_data_dir()}")
    print("  Leave this window open while you study. Close it to stop the app.")
    if not args.no_browser:
        threading.Thread(target=_open_when_ready, args=(url, port), daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning", log_config=None)


if __name__ == "__main__":
    main()
