#!/usr/bin/env python3
"""Generate an X-ready social image from an approved post without external image URLs."""
import json
import os
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def font(size):
    for path in ("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc",
                 "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if os.path.exists(path):
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()

def wrap(draw, value, f, width):
    lines, line = [], ""
    for ch in value:
        if draw.textbbox((0, 0), line + ch, font=f)[2] > width and line:
            lines.append(line)
            line = ch
        else:
            line += ch
    if line:
        lines.append(line)
    return lines

def main():
    if len(sys.argv) != 3:
        sys.exit("Usage: social/render_post.py approved.json output.png")
    post = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
    if post.get("approved") is not True:
        sys.exit("Post has not been approved.")
    headline = str(post.get("headline") or "ハンガリー留学").strip()
    subtitle = str(post.get("subtitle") or "現役留学生に相談できる ハンガリー留学ラボ").strip()
    im = Image.new("RGB", (1200, 675), "#102A43")
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, 1200, 16), fill="#D6A857")
    d.rounded_rectangle((65, 70, 1135, 605), radius=28, fill="#FFFFFF")
    d.text((110, 110), "HUNGARY STUDY LAB", font=font(34), fill="#23527C")
    y = 220
    for line in wrap(d, headline, font(68), 940)[:3]:
        d.text((110, y), line, font=font(68), fill="#102A43")
        y += 92
    y = max(470, y + 25)
    for line in wrap(d, subtitle, font(28), 960)[:2]:
        d.text((110, y), line, font=font(28), fill="#37556F")
        y += 40
    d.text((75, 631), "hungarystudy.org", font=font(23), fill="#FFFFFF")
    Path(sys.argv[2]).parent.mkdir(parents=True, exist_ok=True)
    im.save(sys.argv[2], optimize=True)
    print("Image generated:", sys.argv[2])

if __name__ == "__main__":
    main()
