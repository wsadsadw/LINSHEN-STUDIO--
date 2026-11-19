"""
穹顶画廊（DomeGallery）素材导入脚本。

把桌面「照片」文件夹里的真实作品铺进 public/images/dome/dome-01..NN.webp。

为什么不是固定 40 张：
  DomeGallery 的格位 = segments × 5。Works.jsx 里实际传的是 segments=35，
  也就是 175 个格位，图池按 `i % length` 循环铺满 —— 每张图本来就会重复
  出现约 4 次。所以「格位不够」不是问题，越多的真实照片进入图池，
  重复带来的单调感越弱。这里把文件夹里所有照片都放进去。

统一口径：
  - 3:4 竖幅（512×683），和原占位图尺寸一致，避免球面格子变形
  - 人像锚点偏上（0.38），横幅图居中（0.50）
  - 轻调色：不降饱和（球面是彩色氛围），只做轻微对比 + 暗角，
    让不同来源（相机 JPG / 微信 PNG）的对比度与边缘统一到近黑背景里

用法：
  & '<bundled python>' tools/import-dome-photos.py
"""
import os
import re
import sys

import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = r"C:\Users\Administrator\Desktop\照片"
DST_DIR = os.path.join(ROOT, "public", "images", "dome")

TARGET_W, TARGET_H = 512, 683          # 3:4，与原占位图一致
JPEG_Q, WEBP_Q = 80, 6                 # WEBP_Q 是 method，quality 见下面 save

# 轻调色参数（球面用彩色，不降饱和）
DESATURATE = 0.96
SHADOW_TINT = (0.030, 0.004, -0.014)
HIGHLIGHT_TINT = (-0.010, 0.000, 0.018)
CONTRAST = 1.06
EXPOSURE = 1.00
VIGNETTE = 0.28
VIGNETTE_TINT = (0.012, 0.004, 0.002)

EXTS = (".jpg", ".jpeg", ".png", ".webp")


def grade(im):
    arr = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    h, w, _ = arr.shape

    lum = 0.2126 * arr[..., 0] + 0.7152 * arr[..., 1] + 0.0722 * arr[..., 2]
    lum3 = lum[..., None]
    arr = lum3 + (arr - lum3) * DESATURATE

    shadow_w = np.clip(1.0 - lum, 0, 1) ** 1.6
    high_w = np.clip(lum, 0, 1) ** 1.6
    arr = arr + shadow_w[..., None] * np.array(SHADOW_TINT, dtype=np.float32)
    arr = arr + high_w[..., None] * np.array(HIGHLIGHT_TINT, dtype=np.float32)

    arr = (arr - 0.5) * CONTRAST + 0.5
    arr = arr * EXPOSURE

    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (w - 1) / 2.0, (h - 1) / 2.0
    r = np.sqrt(((xx - cx) / cx) ** 2 + ((yy - cy) / cy) ** 2) / np.sqrt(2.0)
    vig = 1.0 - VIGNETTE * np.clip(r, 0, 1) ** 2.1
    arr = arr * vig[..., None]
    arr = arr + (1.0 - vig)[..., None] * np.array(VIGNETTE_TINT, dtype=np.float32)

    arr = np.clip(arr, 0, 1)
    return Image.fromarray((arr * 255).round().astype(np.uint8))


def cover_crop(im, tw, th, anchor_y):
    """按 cover 语义缩放后居中裁切到目标比例。anchor_y 0=顶 1=底。"""
    sw, sh = im.size
    target_ratio = tw / th
    src_ratio = sw / sh
    if src_ratio > target_ratio:
        # 太宽 → 左右裁
        new_w = int(round(sh * target_ratio))
        left = (sw - new_w) // 2
        im = im.crop((left, 0, left + new_w, sh))
    else:
        # 太高 → 上下裁，按锚点
        new_h = int(round(sw / target_ratio))
        top = int(round((sh - new_h) * anchor_y))
        im = im.crop((0, top, sw, top + new_h))
    return im.resize((tw, th), Image.LANCZOS)


def order_files(paths):
    """按可用最小边分三档，轮流取，避免同档连排（球面上相邻重复单调）。"""
    def min_edge(p):
        with Image.open(p) as im:
            return min(im.size)

    ranked = sorted(paths, key=min_edge, reverse=True)
    third = max(1, len(ranked) // 3)
    buckets = [ranked[:third], ranked[third:2 * third], ranked[2 * third:]]
    out = []
    i = 0
    while len(out) < len(ranked):
        for b in buckets:
            if i < len(b):
                out.append(b[i])
        i += 1
    return out


def main():
    if not os.path.isdir(SRC_DIR):
        sys.exit(f"源目录不存在: {SRC_DIR}")
    names = [f for f in os.listdir(SRC_DIR) if os.path.splitext(f)[1].lower() in EXTS]
    if not names:
        sys.exit("源目录里没有图片")

    ordered = order_files([os.path.join(SRC_DIR, f) for f in names])
    os.makedirs(DST_DIR, exist_ok=True)

    total = 0
    for idx, src in enumerate(ordered, start=1):
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode in ("RGBA", "LA", "P"):
                im = im.convert("RGBA")
                bg = Image.new("RGB", im.size, (10, 8, 8))
                bg.paste(im, mask=im.split()[-1])
                im = bg
            else:
                im = im.convert("RGB")
            w, h = im.size
            anchor = 0.38 if h >= w else 0.50
            im = cover_crop(im, TARGET_W, TARGET_H, anchor)
            im = grade(im)

        out = os.path.join(DST_DIR, f"dome-{idx:02d}.webp")
        im.save(out, "WEBP", quality=JPEG_Q, method=WEBP_Q)
        kb = os.path.getsize(out) // 1024
        total += kb
        print(f"  dome-{idx:02d}.webp  <- {os.path.basename(src):46} {w:5}x{h:<5} {kb:4}KB")

    # 清掉多余的旧文件（旧版是 40 张）
    keep = {f"dome-{i:02d}.webp" for i in range(1, len(ordered) + 1)}
    for f in os.listdir(DST_DIR):
        if re.fullmatch(r"dome-\d{2,3}\.webp", f) and f not in keep:
            os.remove(os.path.join(DST_DIR, f))
            print("  删除多余:", f)

    print(f"\n共 {len(ordered)} 张，合计 {total} KB")

    # 生成 alt 片段，供 site.js / i18n.js 补丁步骤使用
    tmp = os.path.join(os.environ.get("TEMP", "."), "domeonly")
    os.makedirs(tmp, exist_ok=True)
    zh = "".join(
        f"    {{ src: '/images/dome/dome-{i:02d}.webp', alt: 'LINSHEN.STUDIO 摄影作品 · 穹顶 {i:02d}' }},\n"
        for i in range(1, len(ordered) + 1)
    )
    en = "".join(
        f"    {{ src: '/images/dome/dome-{i:02d}.webp', alt: 'LINSHEN.STUDIO photography · dome {i:02d}' }},\n"
        for i in range(1, len(ordered) + 1)
    )
    open(os.path.join(tmp, "gallery-zh.txt"), "w", encoding="utf-8").write(zh)
    open(os.path.join(tmp, "gallery-en.txt"), "w", encoding="utf-8").write(en)
    open(os.path.join(tmp, "count.txt"), "w", encoding="utf-8").write(str(len(ordered)))


if __name__ == "__main__":
    main()
