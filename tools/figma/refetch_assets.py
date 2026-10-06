#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Картинки в полном размере.

При первой выгрузке картинки были скачаны уменьшенными (до 1600px по длинной
стороне) и на сайте выглядели мыльно: файл оказывался меньше, чем место под него.
Скрипт перекачивает оригиналы с Figma Sites и, если оригинал крупнее, заменяет файл.

    python3 tools/figma/refetch_assets.py [--max-side 3000] [--quality 88]

Оригинал крупнее `--max-side` уменьшается до этого размера: 3000px хватает
на двойную плотность экрана для самой широкой картинки. Результат — WebP,
подмена имён записывается в lib/asset-map.json.
Нужен доступ к ivangrigorenko.com, пока там лежит версия на Figma Sites.
"""

import argparse
import io
import json
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public" / "a"
MAP_FILE = ROOT / "lib" / "asset-map.json"
ORIGIN = "https://ivangrigorenko.com/_assets/v11/"

Image.MAX_IMAGE_PIXELS = None


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--max-side", type=int, default=3000)
    ap.add_argument("--quality", type=int, default=88)
    args = ap.parse_args()

    mapping = json.loads(MAP_FILE.read_text()) if MAP_FILE.exists() else {}
    # исходное имя из выгрузки → файл, который лежит сейчас
    current = {name: ASSETS / webp for name, webp in mapping.items()}
    for f in ASSETS.iterdir():
        if f.suffix.lower() in (".png", ".jpg", ".jpeg") and f.name not in current:
            current[f.name] = f

    def work(item):
        name, path = item
        if not path.exists():
            return name, "нет файла", 0
        try:
            with Image.open(path) as im:
                have = im.size
            req = urllib.request.Request(ORIGIN + name, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=60).read()
            im = Image.open(io.BytesIO(data))
            im.load()
        except Exception as exc:  # noqa: BLE001
            return name, f"ошибка: {exc}", 0

        full = im.size
        k = min(1.0, args.max_side / max(full))
        want = (round(full[0] * k), round(full[1] * k))
        if want[0] <= have[0] * 1.05:
            return name, "уже полный", 0

        im = im.convert("RGBA" if "A" in im.getbands() or im.mode == "P" else "RGB")
        if want != full:
            im = im.resize(want, Image.LANCZOS)
        out = ASSETS / (Path(name).stem + ".webp")
        before = path.stat().st_size
        im.save(out, "WEBP", quality=args.quality, method=6)
        if path != out:
            path.unlink()
        mapping[name] = out.name
        return name, f"{have[0]}×{have[1]} → {want[0]}×{want[1]}", out.stat().st_size - before

    grown = 0
    replaced = 0
    with ThreadPoolExecutor(6) as pool:
        for name, note, delta in pool.map(work, sorted(current.items())):
            if "→" in note:
                replaced += 1
                grown += delta
                print(f"  {name[:12]}  {note}")
            elif note.startswith("ошибка"):
                print(f"  {name[:12]}  {note}")

    MAP_FILE.write_text(json.dumps(mapping, indent=2, sort_keys=True) + "\n")
    print(f"заменено {replaced} из {len(current)}, прибавка {grown / 1e6:.1f} МБ")


if __name__ == "__main__":
    main()
