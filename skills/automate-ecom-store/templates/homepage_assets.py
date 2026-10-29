#!/usr/bin/env python3
"""Homepage banners from a private style file. No network. No built-in shop data.

Uses the same cream, green, and accent language as listing_images.py unless
the style file gives colors or a logo to sample.

  python3 homepage_assets.py --style style.json --platform shopee --out <DIR>
  python3 homepage_assets.py --style style.json --platform shopee --out <DIR> --allow-placeholders
  python3 homepage_assets.py --list-sizes

The editor's crop size wins. Re-export with --size WxH when the panel disagrees
with sizes.md. Pillow is required.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    sys.exit("Pillow is required: pip install pillow")

# Draft sizes. See modules/homepage/sizes.md. The in-app panel wins.
SIZES = {
    "shopee": {
        "cover": (1200, 675, 2_000_000),
        "carousel-16x9": (2000, 1125, 2_000_000),
        "carousel-2x1": (2000, 1000, 2_000_000),
        "carousel-1x1": (2000, 2000, 2_000_000),
        "logo": (300, 300, 2_000_000),
    },
    "tiktokshop": {
        "hero-16x9": (1600, 900, 5_000_000),
        "multi-click": (1200, 675, 2_000_000),
        "tile": (800, 800, 2_000_000),
        "header": (780, 720, 2_000_000),
    },
    "lazada": {
        "header-pc": (1200, 128, 1_000_000),
        "header-mobile": (750, 180, 1_000_000),
        "logo": (600, 600, 1_000_000),
        "tile": (600, 300, 1_000_000),
    },
}

FALLBACK = {
    "background": (255, 248, 236),
    "ink": (36, 92, 48),
    "accent": (214, 84, 40),
}


def load_font(size: int, bold: bool = True):
    path = (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
        if bold
        else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
    )
    if Path(path).exists() and size >= 12:
        return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def hex_to_rgb(value: str) -> tuple[int, int, int] | None:
    text = value.strip().lstrip("#")
    if len(text) != 6 or not re.fullmatch(r"[0-9A-Fa-f]{6}", text):
        return None
    return tuple(int(text[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


def sample_logo(path: str) -> tuple[int, int, int] | None:
    file_path = Path(path)
    if not file_path.is_file():
        return None
    image = Image.open(file_path).convert("RGB").resize((24, 24))
    counts: dict[tuple[int, int, int], int] = {}
    for pixel in image.getdata():
        if pixel[0] > 245 and pixel[1] > 245 and pixel[2] > 245:
            continue
        counts[pixel] = counts.get(pixel, 0) + 1
    if not counts:
        return None
    return max(counts, key=counts.get)


def colors_from(style: dict) -> dict[str, tuple[int, int, int]]:
    raw = style.get("colors") or {}
    picked = {}
    for key in ("background", "ink", "accent"):
        parsed = hex_to_rgb(str(raw.get(key) or ""))
        if parsed:
            picked[key] = parsed
    if "accent" not in picked:
        sampled = sample_logo(str(style.get("logo") or ""))
        if sampled:
            picked["accent"] = sampled
    return {key: picked.get(key, FALLBACK[key]) for key in FALLBACK}


def has_placeholder(value) -> bool:
    if isinstance(value, str):
        return "<" in value and ">" in value
    if isinstance(value, dict):
        return any(has_placeholder(item) for item in value.values())
    if isinstance(value, list):
        return any(has_placeholder(item) for item in value)
    return False


def fit_text(draw, text: str, max_width: int, start: int) -> ImageFont.ImageFont:
    size = start
    while size >= 16:
        font = load_font(size)
        if draw.textlength(text, font=font) <= max_width:
            return font
        size -= 2
    return load_font(16)


def render(style: dict, size: tuple[int, int], kind: str) -> Image.Image:
    width, height = size
    palette = colors_from(style)
    image = Image.new("RGB", (width, height), palette["background"])
    draw = ImageDraw.Draw(image)
    bar = max(24, height // 8)
    draw.rectangle((0, 0, width, bar), fill=palette["ink"])
    brand = str(style.get("brand") or "")
    hero = str(style.get("hero_line") or "")
    brand_font = fit_text(draw, brand, width - 48, max(18, bar - 8))
    draw.text((24, max(4, (bar - 18) // 2)), brand[:40], font=brand_font, fill="white")
    if height > 160:
        hero_font = fit_text(draw, hero, width - 80, min(64, height // 6))
        draw.text((40, height // 2), hero[:60], font=hero_font, fill=palette["ink"])
        trust = str(style.get("trust_line") or "")
        if trust and kind in {"cover", "carousel-16x9", "hero-16x9", "header"}:
            draw.text((40, height - bar), trust[:50], font=load_font(max(16, height // 18), False), fill=palette["accent"])
    return image


def save_jpeg(image: Image.Image, path: Path, max_bytes: int) -> None:
    quality = 90
    while quality >= 50:
        image.convert("RGB").save(path, quality=quality, optimize=True)
        if path.stat().st_size <= max_bytes:
            return
        quality -= 5
    raise SystemExit(f"file_too_large: {path.name}")


def parse_size(text: str) -> tuple[int, int]:
    match = re.fullmatch(r"(\d+)x(\d+)", text.strip().lower())
    if not match:
        raise SystemExit("size must look like 1200x675")
    return int(match.group(1)), int(match.group(2))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--list-sizes", action="store_true")
    parser.add_argument("--style")
    parser.add_argument("--platform", choices=sorted(SIZES))
    parser.add_argument("--out")
    parser.add_argument("--size", help="One WxH file, for when the editor disagrees")
    parser.add_argument("--allow-placeholders", action="store_true")
    args = parser.parse_args()

    if args.list_sizes:
        for platform, assets in SIZES.items():
            for name, (width, height, limit) in assets.items():
                print(f"{platform} {name} {width}x{height} max_bytes={limit}")
        print("result: OK")
        return

    if not args.style or not args.platform or not args.out:
        parser.error("--style, --platform, and --out are required")
    style = json.loads(Path(args.style).read_text())
    if has_placeholder(style) and not args.allow_placeholders:
        sys.exit("style_error: placeholders remain")
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    jobs = []
    if args.size:
        width, height = parse_size(args.size)
        jobs.append((f"custom-{width}x{height}", width, height, 2_000_000))
    else:
        jobs.extend((name, width, height, limit) for name, (width, height, limit) in SIZES[args.platform].items())
    for name, width, height, limit in jobs:
        path = out / f"{args.platform}-{name}.jpg"
        image = render(style, (width, height), name)
        save_jpeg(image, path, limit)
        with Image.open(path) as saved:
            ok = saved.size == (width, height) and path.stat().st_size <= limit
        print(f"{path.name}: {width}x{height} {'OK' if ok else 'QC_FAIL'}")
        if not ok:
            sys.exit(1)
    print(f"count: {len(jobs)}")
    print("result: OK")


if __name__ == "__main__":
    main()
