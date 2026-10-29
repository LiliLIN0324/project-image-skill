"""shots/pNN.png -> fig/NN.jpg（4762x2678，近白区域加抖动，避免淡渐变出现同心环带）。

用法: python scripts/export.py shots fig
"""
import os
import sys

import numpy as np
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else "shots"
dst = sys.argv[2] if len(sys.argv) > 2 else "fig"
W, H = 4762, 2678
os.makedirs(dst, exist_ok=True)
rng = np.random.default_rng(7)

names = sorted(f for f in os.listdir(src) if f.endswith(".png"))
if not names:
    sys.exit(f"{src} 里没有 png")

for f in names:
    im = Image.open(os.path.join(src, f)).convert("RGB").resize((W, H), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    near_white = (255.0 - a.max(axis=2)) < 45
    noise = rng.normal(0, 0.85, a.shape).astype(np.float32)
    a = np.where(near_white[..., None], np.clip(a + noise, 0, 255), a)
    out = os.path.join(dst, os.path.splitext(f)[0] + ".jpg")
    Image.fromarray(np.rint(a).astype(np.uint8)).save(out, quality=91, subsampling=0, optimize=True)
    print(os.path.basename(out), Image.open(out).size, round(os.path.getsize(out) / 1e6, 2), "MB")
