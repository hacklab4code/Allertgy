#!/usr/bin/env python3
"""
Rimuove lo sfondo bianco dalle icone PNG puffy (batch).

Uso:
  python3 scripts/remove_icon_backgrounds.py
  python3 scripts/remove_icon_backgrounds.py --input app-mobile/assets/icone --output app-mobile/assets/icone_nobg
  python3 scripts/remove_icon_backgrounds.py --replace   # sovrascrive gli originali (backup in icone_backup/)

Richiede: pip install rembg onnxruntime pillow
"""
from __future__ import annotations

import argparse
import shutil
import sys
from io import BytesIO
from pathlib import Path

from PIL import Image
from rembg import remove

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = ROOT / "app-mobile" / "assets" / "icone"
DEFAULT_OUTPUT = ROOT / "app-mobile" / "assets" / "icone_nobg"
DEFAULT_BACKUP = ROOT / "app-mobile" / "assets" / "icone_backup"


def process_one(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    raw = src.read_bytes()
    out = remove(raw)
    img = Image.open(BytesIO(out)).convert("RGBA")
    img.save(dst, optimize=True)
    print(f"  ok  {src.relative_to(ROOT)}  ->  {dst.relative_to(ROOT)}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Rimuove sfondo dalle icone PNG")
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Sovrascrive gli originali (backup automatico in icone_backup/)",
    )
    args = parser.parse_args()

    src_root = args.input.resolve()
    if not src_root.is_dir():
        print(f"Cartella input non trovata: {src_root}", file=sys.stderr)
        return 1

    pngs = sorted(src_root.rglob("*.png"))
    if not pngs:
        print("Nessun PNG trovato.", file=sys.stderr)
        return 1

    if args.replace:
        backup = DEFAULT_BACKUP.resolve()
        if not backup.exists():
            print(f"Backup -> {backup}")
            shutil.copytree(src_root, backup)
        out_root = src_root
    else:
        out_root = args.output.resolve()

    print(f"Input:  {src_root}  ({len(pngs)} file)")
    print(f"Output: {out_root}\n")

    for i, src in enumerate(pngs, 1):
        rel = src.relative_to(src_root)
        dst = out_root / rel
        print(f"[{i}/{len(pngs)}]", end=" ")
        process_one(src, dst)

    print(f"\nFatto. {len(pngs)} icone processate.")
    if not args.replace:
        print("Controlla icone_nobg/, poi rinomina o sostituisci icone/ quando sei soddisfatto.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
