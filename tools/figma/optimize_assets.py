#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Optimises the images exported from Figma Sites.

Large PNGs are converted to WebP: the weight drops several times over with no
visible difference. The result is recorded in lib/asset-map.json, which both the
generator and the application read, so references in the code stay keyed by the
Figma hash.

    python3 tools/figma/optimize_assets.py [--quality 88] [--min-bytes 60000]

The script is idempotent: anything already converted is skipped.
"""

import argparse
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public" / "a"
MAP_FILE = ROOT / "lib" / "asset-map.json"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quality", type=int, default=88)
    ap.add_argument("--min-bytes", type=int, default=60_000)
    args = ap.parse_args()

    mapping = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {}

    saved = 0
    converted = 0
    skipped = 0

    for png in sorted(ASSETS.glob("*.png")):
        size = png.stat().st_size
        if size < args.min_bytes:
            skipped += 1
            continue

        webp = png.with_suffix(".webp")
        if webp.exists():
            mapping[png.name] = webp.name
            continue

        try:
            with Image.open(png) as im:
                # WebP keeps transparency, so a palette image is expanded to RGBA
                im = im.convert("RGBA" if "A" in im.getbands() or im.mode == "P" else "RGB")
                im.save(webp, "WEBP", quality=args.quality, method=6)
        except Exception as exc:  # noqa: BLE001
            print(f"  skipped {png.name}: {exc}")
            continue

        new_size = webp.stat().st_size
        # if WebP did not win, keep the original
        if new_size >= size * 0.9:
            webp.unlink()
            skipped += 1
            continue

        mapping[png.name] = webp.name
        png.unlink()
        saved += size - new_size
        converted += 1

    MAP_FILE.write_text(json.dumps(mapping, indent=2, sort_keys=True) + "\n")

    print(f"converted: {converted}, left as they were: {skipped}")
    print(f"freed: {saved / 1024 / 1024:.0f} MB")
    print(f"substitution map: {MAP_FILE.relative_to(ROOT)} ({len(mapping)} entries)")


if __name__ == "__main__":
    main()
