"""Run the service:  python -m studio.server [--port 8765] [--no-browser] [--dev]"""

from __future__ import annotations

import argparse
import threading
import webbrowser

import uvicorn

from .app import DEFAULT_PORT, create_app, default_data_dir


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=DEFAULT_PORT)
    ap.add_argument("--no-browser", action="store_true")
    ap.add_argument("--dev", action="store_true", help="also accept the Vite dev server (localhost:5173)")
    args = ap.parse_args()

    app = create_app(port=args.port, allow_dev_origin=args.dev)
    url = f"http://127.0.0.1:{args.port}/"
    print(f"Stats 132 Study Studio is running at {url}")
    print(f"Your data is stored in {default_data_dir()}")
    if not args.no_browser:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()
    uvicorn.run(app, host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
