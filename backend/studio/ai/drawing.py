"""A drawing from the app's pad, made ready for a model. The pad saves ink on a transparent PNG; a transparent
background reads as black to many models, so it is flattened onto white, and it is shrunk to a width a model reads
well without spending tokens on empty page."""

from __future__ import annotations

import base64
import binascii
import io
import re

from PIL import Image

MAX_BYTES = 4 * 1024 * 1024
MAX_WIDTH = 1200
_DATA_URL = re.compile(r"^data:image/[\w.+-]+;base64,", re.IGNORECASE)


class BadDrawing(ValueError):
    """The drawing is not an image the app can read (or is too big)."""


def decode_drawing(data: str) -> tuple[bytes, str]:
    """(PNG bytes, "image/png") from a data URL or bare base64: flattened onto white and at most MAX_WIDTH wide."""
    s = data.strip()
    m = _DATA_URL.match(s)
    if m:
        s = s[m.end() :]
    try:
        raw = base64.b64decode(s)
    except (binascii.Error, ValueError) as e:
        raise BadDrawing("not base64") from e
    if not raw:
        raise BadDrawing("empty")
    if len(raw) > MAX_BYTES:
        raise BadDrawing("too large")
    try:
        with Image.open(io.BytesIO(raw)) as im:
            im.load()
            rgba = im.convert("RGBA")
    except Exception as e:  # Pillow raises many kinds for a broken or oversized file
        raise BadDrawing("not an image") from e
    flat = Image.new("RGB", rgba.size, (255, 255, 255))
    flat.paste(rgba, mask=rgba.getchannel("A"))
    if flat.width > MAX_WIDTH:
        flat = flat.resize((MAX_WIDTH, max(1, round(flat.height * MAX_WIDTH / flat.width))), Image.LANCZOS)
    buf = io.BytesIO()
    flat.save(buf, "PNG", optimize=True)
    return buf.getvalue(), "image/png"
