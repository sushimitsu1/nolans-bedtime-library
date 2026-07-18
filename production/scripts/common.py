from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path


FINAL_SIZE = (1448, 1086)
PAGE_NAMES = [f"page-{number:02d}.webp" for number in range(1, 16)]
FINAL_NAMES = ["cover.webp", *PAGE_NAMES]


def load_json(path: str | Path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def write_json(path: str | Path, value) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def normalized(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.casefold()))


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def difference_hash(image) -> str:
    from PIL import ImageOps

    sample = ImageOps.grayscale(image).resize((17, 16))
    pixels = list(sample.getdata())
    bits = []
    for row in range(16):
        offset = row * 17
        bits.extend(pixels[offset + column] > pixels[offset + column + 1] for column in range(16))
    value = sum(bit << index for index, bit in enumerate(bits))
    return f"{value:064x}"


def hamming_distance(left: str, right: str) -> int:
    return (int(left, 16) ^ int(right, 16)).bit_count()
