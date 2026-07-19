#!/usr/bin/env python3
"""
Estrae solo l'emoji centrale dalle icone puffy, rimuovendo:
  - sfondo bianco esterno
  - cornice arcobaleno (il "logo" rettangolo arrotondato)

Uso:
  python3 scripts/extract_icon_emoji.py
  python3 scripts/extract_icon_emoji.py --replace

Output default: app-mobile/assets/icone_emoji/
"""
from __future__ import annotations

import argparse
import shutil
import sys
from io import BytesIO
from pathlib import Path

import numpy as np
from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "app-mobile" / "assets" / "icone"
DEFAULT_OUTPUT = ROOT / "app-mobile" / "assets" / "icone_emoji"
DEFAULT_BACKUP = ROOT / "app-mobile" / "assets" / "icone_backup"

CROP_RATIO = 0.50
OUTPUT_SIZE = 512


def _is_mostly_neutral_subject(img: Image.Image) -> bool:
    """Latte, uovo, sesamo… — soggetto bianco/crema: non rimuovere il grigio interno."""
    arr = np.array(img)
    mask = arr[:, :, 3] > 12
    if not mask.any():
        return False
    rgb = arr[mask][:, :3].astype(np.float32)
    maxc = np.max(rgb, axis=1)
    minc = np.min(rgb, axis=1)
    sat = (maxc - minc) / (maxc + 1e-6)
    return float((sat < 0.14).mean()) > 0.52


def _post_clean(img: Image.Image) -> Image.Image:
    arr = np.array(img.convert("RGBA"), dtype=np.float32)
    h, w = arr.shape[:2]
    cy, cx = h / 2, w / 2
    y_idx, x_idx = np.ogrid[:h, :w]
    norm = np.sqrt((x_idx - cx) ** 2 + (y_idx - cy) ** 2) / (min(cx, cy) + 1e-6)

    r, g, b = arr[..., 0], arr[..., 1], arr[..., 2]
    maxc = np.maximum(np.maximum(r, g), b)
    minc = np.minimum(np.minimum(r, g), b)
    sat = (maxc - minc) / (maxc + 1e-6)
    val = maxc / 255.0

    # residui della cornice arcobaleno ai bordi del crop
    arr[(norm > 0.68) & (sat > 0.22), 3] = 0

    if not _is_mostly_neutral_subject(img):
        # piattino grigio/bianco della cornice (non il soggetto colorato)
        gray_well = (sat < 0.11) & (val > 0.52) & (val < 0.97)
        arr[gray_well, 3] = 0

    return Image.fromarray(arr.astype(np.uint8))


def _trim_square(img: Image.Image, size: int) -> Image.Image:
    arr = np.array(img)
    alpha = arr[:, :, 3]
    ys, xs = np.where(alpha > 12)
    if len(xs):
        img = img.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    rw, rh = img.size
    side = max(rw, rh)
    sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    sq.paste(img, ((side - rw) // 2, (side - rh) // 2))
    return sq.resize((size, size), Image.LANCZOS)


def extract_emoji(src: Path, dst: Path, crop_ratio: float = CROP_RATIO) -> None:
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    cw = ch = int(w * crop_ratio)
    left, top = (w - cw) // 2, (h - ch) // 2
    cropped = img.crop((left, top, left + cw, top + ch))

    buf = BytesIO()
    cropped.save(buf, format="PNG")
    result = Image.open(BytesIO(remove(buf.getvalue()))).convert("RGBA")
    result = _post_clean(result)
    result = _trim_square(result, OUTPUT_SIZE)

    dst.parent.mkdir(parents=True, exist_ok=True)
    result.save(dst, optimize=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Estrae emoji centrale dalle icone puffy")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--crop", type=float, default=CROP_RATIO, help="Ritaglio centro (0.50 = 50%%)")
    parser.add_argument("--replace", action="store_true", help="Sostituisce icone/ (con backup)")
    args = parser.parse_args()

    src_root = args.input.resolve()
    if not src_root.is_dir():
        print(f"Cartella non trovata: {src_root}", file=sys.stderr)
        return 1

    pngs = sorted(src_root.rglob("*.png"))
    if not pngs:
        print("Nessun PNG trovato.", file=sys.stderr)
        return 1

    if args.replace:
        if not DEFAULT_BACKUP.exists():
            print(f"Backup -> {DEFAULT_BACKUP}")
            shutil.copytree(src_root, DEFAULT_BACKUP)
        out_root = src_root
    else:
        out_root = args.output.resolve()

    print(f"Estrazione emoji centrale (crop {args.crop:.0%})")
    print(f"Input:  {src_root} ({len(pngs)} file)")
    print(f"Output: {out_root}\n")

    for i, src in enumerate(pngs, 1):
        rel = src.relative_to(src_root)
        dst = out_root / rel
        print(f"[{i}/{len(pngs)}] {rel}")
        extract_emoji(src, dst, args.crop)

    print(f"\nFatto — {len(pngs)} emoji estratte in {out_root.name}/")
    if not args.replace:
        print("Controlla il risultato, poi:  python3 scripts/extract_icon_emoji.py --replace")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
