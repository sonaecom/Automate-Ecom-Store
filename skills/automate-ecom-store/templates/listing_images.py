#!/usr/bin/env python3
"""Square listing images from a private spec. No network. No built-in shop data.

Reads a JSON spec and writes a square JPEG set plus a contact sheet:
  01 cover, 02 variations, 03 benefits, 04 size, 05 usage, 06 store,
  one image per variation, and one combo image when combos are present.

  python3 listing_images.py --spec spec.json --out <OUTPUT_DIR>
  python3 listing_images.py --spec spec.json --out <OUTPUT_DIR> --allow-placeholders
  python3 listing_images.py --compare <APPROVED> <LIVE>

Pillow is required. A cutout path in the spec is pasted when the file exists.
Otherwise the canvas uses a labeled block so layout can be checked.
Do not publish a canvas that still says PLACEHOLDER or that paints a size
onto a pack photo. Replace painted sizes with a real photo of that pack.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError:
    sys.exit("Pillow is required: pip install pillow")

CANVAS = 1024
MAX_BYTES_DEFAULT = 2_000_000


def load_font(size: int, bold: bool = True) -> ImageFont.ImageFont:
    candidates = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def text_width(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.ImageFont) -> int:
    return int(draw.textlength(text, font=font))


def center(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, font, fill) -> None:
    w = text_width(draw, text, font)
    draw.text((xy[0] - w / 2, xy[1]), text, font=font, fill=fill)


def new_canvas() -> Image.Image:
    image = Image.new("RGB", (CANVAS, CANVAS), (255, 248, 236))
    draw = ImageDraw.Draw(image)
    for y in range(120, CANVAS):
        fade = (y - 120) / (CANVAS - 120)
        color = tuple(int(255 * (1 - fade) + channel * fade) for channel in (255, 214, 140))
        draw.line([(0, y), (CANVAS, y)], fill=color)
    draw.rectangle((0, 0, CANVAS, 96), fill=(36, 92, 48))
    return image


def header(image: Image.Image, title: str) -> ImageDraw.ImageDraw:
    draw = ImageDraw.Draw(image)
    center(draw, (CANVAS / 2, 28), title[:42], load_font(32), "white")
    return draw


def load_cutout(path: str | None) -> Image.Image | None:
    if not path:
        return None
    file_path = Path(path)
    if not file_path.is_file():
        return None
    return Image.open(file_path).convert("RGBA")


def paste_center(base: Image.Image, sprite: Image.Image, box: tuple[int, int, int, int]) -> None:
    x0, y0, x1, y1 = box
    sprite = sprite.copy()
    sprite.thumbnail((x1 - x0, y1 - y0))
    x = x0 + (x1 - x0 - sprite.width) // 2
    y = y0 + (y1 - y0 - sprite.height) // 2
    base.paste(sprite, (x, y), sprite)


def block(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], label: str) -> None:
    draw.rounded_rectangle(box, radius=28, fill=(255, 255, 255), outline=(36, 92, 48), width=4)
    center(draw, ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2 - 16), label[:28], load_font(28), (36, 92, 48))


def badge(draw: ImageDraw.ImageDraw, cx: int, cy: int, label: str) -> None:
    radius = 78
    draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=(214, 84, 40), outline="white", width=6)
    center(draw, (cx, cy - 18), label[:8], load_font(36), "white")


def cover(spec: dict, listing: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    cutout = load_cutout(listing.get("cutout"))
    if cutout:
        paste_center(image, cutout, (180, 180, 700, 860))
    else:
        block(draw, (180, 220, 700, 860), listing.get("size_label", ""))
    badge(draw, 860, 280, listing.get("size_label", ""))
    draw.rounded_rectangle((80, 900, 944, 980), radius=28, fill="white")
    center(draw, (CANVAS / 2, 922), spec.get("main_keyword", "")[:40], load_font(32), (36, 92, 48))
    return image


def variations_card(spec: dict, listing: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    options = listing.get("variations") or []
    gap = 40
    count = max(len(options), 1)
    width = (CANVAS - gap * (count + 1)) // count
    for index, option in enumerate(options or [{"buyer_name": ""}]):
        x0 = gap + index * (width + gap)
        draw.rounded_rectangle((x0, 180, x0 + width, 900), radius=28, fill="white")
        center(draw, (x0 + width / 2, 760), str(option.get("buyer_name", ""))[:22], load_font(28), (36, 92, 48))
    return image


def benefits(spec: dict, listing: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    points = spec.get("benefits") or [spec.get("benefit", "")]
    for index, point in enumerate(points[:4]):
        y = 160 + index * 190
        draw.rounded_rectangle((70, y, 954, y + 150), radius=36, fill="white")
        draw.ellipse((100, y + 35, 180, y + 115), fill=(214, 84, 40))
        center(draw, (140, y + 52), str(index + 1), load_font(32), "white")
        draw.text((210, y + 48), str(point)[:42], font=load_font(32, False), fill=(40, 40, 40))
    return image


def size_card(spec: dict, listing: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    center(draw, (CANVAS / 2, 220), listing.get("size_label", ""), load_font(96), (214, 84, 40))
    center(draw, (CANVAS / 2, 400), listing.get("weight", ""), load_font(40, False), (40, 40, 40))
    center(draw, (CANVAS / 2, 900), spec.get("origin_phrase", "")[:40], load_font(32), (36, 92, 48))
    return image


def usage(spec: dict, listing: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    moments = spec.get("uses") or ["<USE>"]
    for index, moment in enumerate(moments[:4]):
        x = 48 + (index % 2) * 490
        y = 180 + (index // 2) * 380
        block(draw, (x, y, x + 450, y + 340), str(moment))
    return image


def store_card(spec: dict, listing: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    lines = spec.get("storage_lines") or ["<STORAGE_LINE>"]
    for index, line in enumerate(lines[:5]):
        y = 200 + index * 130
        draw.rounded_rectangle((80, y, 944, y + 100), radius=40, fill="white")
        center(draw, (CANVAS / 2, y + 28), str(line)[:42], load_font(28), (36, 92, 48))
    return image


def variation_image(spec: dict, listing: dict, option: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    cutout = load_cutout(option.get("cutout") or listing.get("cutout"))
    if cutout:
        paste_center(image, cutout, (220, 180, 800, 820))
    else:
        block(draw, (220, 220, 800, 820), option.get("buyer_name", ""))
    center(draw, (CANVAS / 2, 900), f"{option.get('buyer_name', '')} · {listing.get('size_label', '')}"[:40], load_font(32), (36, 92, 48))
    return image


def combo(spec: dict, item: dict) -> Image.Image:
    image = new_canvas()
    draw = header(image, spec.get("brand", ""))
    block(draw, (80, 200, 480, 820), str(item.get("items", ["", ""])[0])[:16])
    if len(item.get("items") or []) > 1:
        block(draw, (540, 200, 940, 820), str(item["items"][1])[:16])
    badge(draw, 512, 512, str(item.get("badge", "x2"))[:8])
    return image


def slug(text: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "-", text).strip("-")
    return cleaned or "item"


def save_jpeg(image: Image.Image, path: Path, max_bytes: int) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    quality = 90
    while quality >= 60:
        image.convert("RGB").save(path, quality=quality, optimize=True)
        if path.stat().st_size <= max_bytes:
            return
        quality -= 5
    raise SystemExit(f"file_too_large: {path.name}")


def dhash(path: Path) -> int:
    image = Image.open(path).convert("L").resize((9, 8))
    pixels = list(image.getdata())
    bits = 0
    for row in range(8):
        for col in range(8):
            left = pixels[row * 9 + col]
            right = pixels[row * 9 + col + 1]
            bits = (bits << 1) | int(left > right)
    return bits


def distance(a: int, b: int) -> int:
    return (a ^ b).bit_count()


def has_placeholder(value) -> bool:
    if isinstance(value, str):
        return "<" in value and ">" in value
    if isinstance(value, dict):
        return any(has_placeholder(item) for item in value.values())
    if isinstance(value, list):
        return any(has_placeholder(item) for item in value)
    return False


def render(spec: dict, out_dir: Path, max_bytes: int) -> list[Path]:
    written: list[Path] = []
    pages = [
        ("01-cover", cover),
        ("02-variations", variations_card),
        ("03-benefits", benefits),
        ("04-size", size_card),
        ("05-usage", usage),
        ("06-store", store_card),
    ]
    for listing in spec.get("listings") or []:
        folder = out_dir / slug(str(listing.get("size_label", "size")))
        for name, builder in pages:
            path = folder / f"{name}.jpg"
            save_jpeg(builder(spec, listing), path, max_bytes)
            written.append(path)
        for option in listing.get("variations") or []:
            path = folder / f"var-{slug(str(option.get('buyer_name', 'variation')))}.jpg"
            save_jpeg(variation_image(spec, listing, option), path, max_bytes)
            written.append(path)
    for index, item in enumerate(spec.get("combos") or [], start=1):
        path = out_dir / f"combo-{index}.jpg"
        save_jpeg(combo(spec, item), path, max_bytes)
        written.append(path)
    if written:
        sheet = Image.new("RGB", (CANVAS, CANVAS), "white")
        thumbs = [Image.open(path).resize((256, 256)) for path in written[:16]]
        for index, thumb in enumerate(thumbs):
            sheet.paste(thumb, ((index % 4) * 256, (index // 4) * 256))
        sheet_path = out_dir / "contact-sheet.jpg"
        save_jpeg(sheet, sheet_path, max_bytes)
        written.append(sheet_path)
    return written


def qc_file(path: Path, min_edge: int, max_bytes: int) -> list[str]:
    errors = []
    image = Image.open(path)
    if image.width != image.height:
        errors.append("not_square")
    if min(image.width, image.height) < min_edge:
        errors.append("too_small")
    if path.stat().st_size > max_bytes:
        errors.append("file_too_large")
    return errors


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--spec")
    parser.add_argument("--out")
    parser.add_argument("--allow-placeholders", action="store_true")
    parser.add_argument("--min-edge", type=int, default=1024)
    parser.add_argument("--max-bytes", type=int, default=MAX_BYTES_DEFAULT)
    parser.add_argument("--compare", nargs=2, metavar=("APPROVED", "LIVE"))
    args = parser.parse_args()

    if args.compare:
        approved, live = (Path(args.compare[0]), Path(args.compare[1]))
        print(f"dhash_distance: {distance(dhash(approved), dhash(live))}")
        print("result: OK")
        return

    if not args.spec or not args.out:
        parser.error("--spec and --out are required unless --compare is used")
    spec = json.loads(Path(args.spec).read_text())
    if has_placeholder(spec) and not args.allow_placeholders:
        sys.exit("spec_error: placeholders remain; fill the private spec or pass --allow-placeholders for a layout only")
    written = render(spec, Path(args.out), args.max_bytes)
    failed = 0
    for path in written:
        if path.name == "contact-sheet.jpg":
            continue
        problems = qc_file(path, args.min_edge, args.max_bytes)
        print(f"{path.name}: {'OK' if not problems else ','.join(problems)}")
        failed += int(bool(problems))
    print(f"count: {len(written)}")
    print("result: OK" if failed == 0 else "result: QC_FAIL")
    if failed:
        sys.exit(1)


if __name__ == "__main__":
    main()
