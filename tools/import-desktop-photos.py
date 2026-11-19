"""
把桌面「照片」文件夹里的真实作品导入站点（一次性工具）。

产出：
  public/images/work-01..04.jpg   —— 精选项目 4 个格位（真正在页面上独占大块的图）
  public/images/reel/r-01..12.webp —— 首屏环绕字标的 12 张线圈图

口径：
  1. 作品位按实际显示的格位比例预裁，避免 CSS cover 随机裁到脸。
  2. 线圈图沿用 tools/grade-reel.py 的同一套调色（降饱和 + 分离调色 + 暗角），
     否则真实照片直接贴上去会「浮」在橙红 radial 背景上。
  3. 输出体积压住：作品位 JPEG q82，线圈图 WebP q84。

用法：
  & '<bundled python>' tools/import-desktop-photos.py
"""
import os
import sys

import numpy as np
from PIL import Image, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = r"C:\Users\Administrator\Desktop\照片"
IMG_DIR = os.path.join(ROOT, "public", "images")
REEL_DIR = os.path.join(IMG_DIR, "reel")

# ── 作品位：目标尺寸与裁切锚点（anchor: 0=顶部, 0.5=居中, 1=底部）────────
WORKS = [
    # (源文件, 输出, 目标宽, 目标高, 纵向锚点)
    ("1 (4).jpg", "work-01.jpg", 1900, 1280, 0.50),   # 原生横幅，居中
    ("1 (5).jpg", "work-02.jpg", 1300, 1240, 0.34),   # 竖幅裁近方形，取偏上
    ("1 (7).jpg", "work-03.jpg", 1300, 1240, 0.34),
    ("1 (9).jpg", "work-04.jpg", 1900, 1280, 0.30),   # 竖幅裁横幅，取偏上保头
]

# ── 线圈图：12 张，按可用最小边从大到小挑，交错排列 ────────────────────
REEL = [
    "1 (4)(1).jpg",
    "微信图片_20261119203517_155_2.png",
    "6.jpg",
    "微信图片_20261119203250_153_2.png",
    "微信图片_20261119200641_134_2.png",
    "微信图片_20261119203308_154_2.png",
    "微信图片_20261119201913_150_2.png",
    "微信图片_20261119203227_152_2.png",
    "微信图片_20261119200232_128_2.png",
    "微信图片_20261119201323_144_2.png",
    "微信图片_20261119195306_121_2.png",
    "微信图片_20261119201820_149_2.png",
]
REEL_SIDE = 768

# 与 grade-reel.py 保持一致的调色参数
DESATURATE = 0.70
SHADOW_TINT = (0.070, -0.012, -0.050)
HIGHLIGHT_TINT = (-0.035, 0.004, 0.055)
CONTRAST = 1.12
EXPOSURE = 0.90
VIGNETTE = 0.62


def load(src_name):
    path = os.path.join(SRC, src_name)
    if not os.path.exists(path):
        raise SystemExit(f"源文件不存在: {path}")
    im = Image.open(path)
    im = ImageOps.exif_transpose(im)          # 按 EXIF 摆正，否则手机竖拍会躺倒
    if im.mode in ("RGBA", "LA", "P"):
        im = im.convert("RGBA")
        bg = Image.new("RGB", im.size, (10, 8, 8))
        bg.paste(im, mask=im.split()[-1])
        im = bg
    return im.convert("RGB")


def crop_to(im, tw, th, anchor=0.5):
    """按目标比例裁切（不放大），再缩放到目标尺寸。"""
    w, h = im.size
    target = tw / th
    if w / h > target:                        # 原图更宽 → 裁左右
        new_w = int(round(h * target))
        left = (w - new_w) // 2
        box = (left, 0, left + new_w, h)
    else:                                     # 原图更高 → 裁上下
        new_h = int(round(w / target))
        top = int(round((h - new_h) * anchor))
        top = max(0, min(h - new_h, top))
        box = (0, top, w, top + new_h)
    cropped = im.crop(box)
    return cropped.resize((tw, th), Image.LANCZOS)


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
    arr = arr + (1.0 - vig)[..., None] * np.array([0.020, 0.004, 0.001], dtype=np.float32)

    arr = np.clip(arr, 0, 1)
    return Image.fromarray((arr * 255).round().astype(np.uint8))


def main():
    os.makedirs(REEL_DIR, exist_ok=True)
    total_w = total_r = 0

    for src_name, out_name, tw, th, anchor in WORKS:
        im = load(src_name)
        before = im.size
        out = crop_to(im, tw, th, anchor)
        dst = os.path.join(IMG_DIR, out_name)
        out.save(dst, "JPEG", quality=82, optimize=True, progressive=True)
        kb = os.path.getsize(dst) // 1024
        total_w += kb
        print(f"{out_name:14} {before[0]}x{before[1]} -> {tw}x{th}  {kb:5} KB   <- {src_name}")

    side = REEL_SIDE
    for idx, src_name in enumerate(REEL, start=1):
        im = load(src_name)
        before = im.size
        # 先取正方形（居中），再缩放；小图允许适度放大，卡片实际显示很小
        s = min(im.size)
        left = (im.size[0] - s) // 2
        top = int((im.size[1] - s) * 0.40)
        sq = im.crop((left, top, left + s, top + s)).resize((side, side), Image.LANCZOS)
        out = grade(sq)
        dst = os.path.join(REEL_DIR, f"r-{idx:02d}.webp")
        out.save(dst, "WEBP", quality=84, method=6)
        kb = os.path.getsize(dst) // 1024
        total_r += kb
        print(f"r-{idx:02d}.webp      {before[0]}x{before[1]} -> {side}x{side}  {kb:5} KB   <- {src_name}")

    print(f"\n作品位合计 {total_w} KB，线圈图合计 {total_r} KB")


if __name__ == "__main__":
    main()