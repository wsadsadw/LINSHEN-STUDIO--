"""
首屏线圈图的批量调色脚本（一次性工具，不需要构建期依赖）

背景：首屏是橙红 radial 渐变（#ff8a2b → #d01c00 → #330400），AI 生成的图
直接贴上去会显得「浮」在背景上。这个脚本做三件事把图压进背景：

  1. 降饱和 —— 冷调才有克制感，颜色越少越显贵
  2. 分离调色 —— 暗部烧暖（红+、蓝−），亮部压冷（蓝+、红−）
  3. 暗角 —— 边缘收到接近 #120300，和首屏自带的 radial 暗边衔接

用法（用 ComfyUI 那个环境跑，里面有 numpy + Pillow）：
  & 'D:\\dsh-env\\miniconda3\\envs\\comfyui\\python.exe' tools/grade-reel.py

默认读 ComfyUI 的 output/ 里 dsh-comfyui_00013_..00024_.png，
写到 public/images/reel/r-01..12.webp，并拼一张联系表到 .dsh-tmp/。
换素材时改 SRC_FILES 和输出即可。
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COMFY_OUTPUT = r"D:\dsh-env\ComfyUI-master\output"
DST_DIR = os.path.join(ROOT, "public", "images", "reel")
SHEET_PATH = os.path.join(ROOT, ".dsh-tmp", "reel-cool-contact.png")

SRC_FILES = [f"dsh-comfyui_{i:05d}_.png" for i in range(13, 25)]

# 调色参数（想更冷 / 更暖就动这里）
DESATURATE = 0.70      # 1.0 = 原色，0.0 = 全灰
SHADOW_TINT = (0.070, -0.012, -0.050)   # 暗部：偏暖棕红
HIGHLIGHT_TINT = (-0.035, 0.004, 0.055)  # 亮部：偏冷青蓝
CONTRAST = 1.12
EXPOSURE = 0.90
VIGNETTE = 0.62


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
    os.makedirs(DST_DIR, exist_ok=True)
    os.makedirs(os.path.dirname(SHEET_PATH), exist_ok=True)

    total = 0
    for idx, name in enumerate(SRC_FILES, start=1):
        src = os.path.join(COMFY_OUTPUT, name)
        if not os.path.exists(src):
            print("跳过（源文件不存在）:", name)
            continue
        image = grade(Image.open(src))
        out = os.path.join(DST_DIR, f"r-{idx:02d}.webp")
        image.save(out, "WEBP", quality=84, method=6)
        kb = os.path.getsize(out) // 1024
        total += kb
        print(f"r-{idx:02d}.webp  {image.size[0]}x{image.size[1]}  {kb} KB")
    print(f"合计 {total} KB")

    thumb, cols, rows, gap = 320, 4, 3, 12
    sheet = Image.new("RGB", (cols * thumb + (cols + 1) * gap, rows * thumb + (rows + 1) * gap), (10, 10, 12))
    for i in range(12):
        path = os.path.join(DST_DIR, f"r-{i + 1:02d}.webp")
        if not os.path.exists(path):
            continue
        im = Image.open(path).convert("RGB").resize((thumb, thumb), Image.LANCZOS)
        rr, cc = divmod(i, cols)
        sheet.paste(im, (gap + cc * (thumb + gap), gap + rr * (thumb + gap)))
    sheet.save(SHEET_PATH)
    print("联系表:", SHEET_PATH)


if __name__ == "__main__":
    main()
