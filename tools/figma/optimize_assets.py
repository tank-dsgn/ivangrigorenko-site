#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Оптимизация картинок, выгруженных из Figma Sites.

Крупные PNG переводятся в WebP: вес падает в разы, визуально разницы нет.
Результат записывается в карту lib/asset-map.json — её читают и
генератор, и приложение, поэтому ссылки в коде остаются по хешу Figma.

    python3 tools/figma/optimize_assets.py [--quality 88] [--min-bytes 60000]

Скрипт идемпотентный: уже сконвертированное пропускается.
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
                # WebP держит прозрачность, поэтому палитру разворачиваем в RGBA
                im = im.convert("RGBA" if "A" in im.getbands() or im.mode == "P" else "RGB")
                im.save(webp, "WEBP", quality=args.quality, method=6)
        except Exception as exc:  # noqa: BLE001
            print(f"  пропуск {png.name}: {exc}")
            continue

        new_size = webp.stat().st_size
        # если WebP не выиграл — оставляем оригинал
        if new_size >= size * 0.9:
            webp.unlink()
            skipped += 1
            continue

        mapping[png.name] = webp.name
        png.unlink()
        saved += size - new_size
        converted += 1

    MAP_FILE.write_text(json.dumps(mapping, indent=2, sort_keys=True) + "\n")

    print(f"сконвертировано: {converted}, оставлено как есть: {skipped}")
    print(f"освобождено: {saved / 1024 / 1024:.0f} МБ")
    print(f"карта замен: {MAP_FILE.relative_to(ROOT)} ({len(mapping)} записей)")


if __name__ == "__main__":
    main()
