# LINSHEN.STUDIO · 摄影工作室官网（React + Vite）

暗色系单页官网，面向 PC 大屏展示，版心 1700px。整体走「高级、克制、有科技感」的方向，
刻意避开模板站的两个特征：满屏圆角卡片 + 一堆渐变色块。

> ⚠️ **站内的项目数据（860 场、96% 复购等）、作品图、微信号、备案号、工作室名仍是示例内容**，
> 上线前必须替换。电话与邮箱已经是真实信息。
> 图片是 Pexels 免费素材，只作占位，**请务必换成你自己的作品**（见第 4 节）。

---

## 1. 跑起来

```powershell
cd E:\deepcode\photo-studio-react
npm install          # 已装过就跳过
npm run dev          # 开发模式 → http://127.0.0.1:5273
```

构建与本地预览生产包：

```powershell
npm run build        # 产物在 dist\
npm run preview      # → http://127.0.0.1:4173
```

### 页面结构

首屏是 **agency 海报式首页**（`src/alt/AltStudio.jsx`）：橙红渐变 + 超大 YBL.STUDIO 字标穿过人物 + 左下服务、右下联系表单。

下面四个模块保持原样，一行没动：

| 模块 | 文件 |
|---|---|
| 个人经历 | `src/components/About.jsx` |
| 精选项目 | `src/components/Works.jsx` |
| 个人优势 | `src/components/Strengths.jsx` |
| 预约 | `src/components/Booking.jsx` |

> 原来那版视频首屏 `src/components/Hero.jsx` **没有删**，只是不再引用。
> 想换回去，把 `src/App.jsx` 里的 `<AltStudio />` 改回 `<Hero />` 即可。

> 工程里带了一个 `.npmrc`，默认走 npmmirror 镜像。本机直连 registry.npmjs.org 实测只有
> ~3KB/s，装一次依赖要好几个小时；换回官方源只需删掉这个文件。

---

## 2. 目录结构

```
photo-studio-react/
├─ index.html                  页面壳（title / description / favicon）
├─ vite.config.js              端口固定 5273(dev) / 4173(preview)
├─ src/
│  ├─ main.jsx                 入口：字体 + 全局样式 + 挂载
│  ├─ App.jsx                  页面骨架：进度条 → 导航 → 五个模块 → 颗粒层
│  ├─ data/site.js             ★ 全站内容总入口（改这一个文件就能换掉所有文案）
│  ├─ styles/base.css          设计系统：颜色 / 字体 / 版心 / 按钮 / 进场动画
│  ├─ hooks/
│  │  ├─ useInView.js          元素进入视口（滚动进场、数字滚动）
│  │  └─ useCountUp.js         数字缓动增长
│  └─ components/
│     ├─ Nav.jsx / .css            固定导航（滚过首屏后毛玻璃悬浮、略收窄、当前章节高亮）
│     ├─ Hero.jsx / .css           01 全屏首屏：视频背景 + 大标题 + HUD
│     ├─ About.jsx / .css          02 个人经历：人物图 + 简介 + 联系方式 + 数据 + 时间线
│     ├─ Works.jsx / .css          03 精选项目：7/5 交错的大卡片
│     ├─ Strengths.jsx / .css      04 个人优势：六宫格能力卡片
│     ├─ Contact.jsx / .css        05 整屏收尾：大标题 + 联系方式 + 页脚
│     ├─ Reveal.jsx                滚动进场包装器（带 stagger 延迟）
│     ├─ Icon.jsx                  极简描边图标集
│     ├─ ScrollProgress.jsx        顶部滚动进度线
│     └─ Grain.jsx                 全局胶片颗粒
├─ public/
│  ├─ images/                  站点实际加载的成品图（由脚本生成）
│  ├─ media/hero.mp4           首屏视频背景
│  └─ favicon.svg
├─ photos/                     原始照片放这里（不进版本库）
└─ tools/build-assets.ps1      图片与视频的生成脚本
```

---

## 3. 五个模块分别是什么

| # | 模块 | 说明 |
|---|---|---|
| 01 | **全屏首屏** | 100vh 视频背景（无视频时自动退回静态大图 + 缓慢推拉）、固定导航、超大字标题、预约/查看作品双按钮、右下角相机参数 HUD + 实时时钟、底部服务关键词走马灯 |
| 02 | **个人经历** | 左侧取景框风格人物图（滚动时吸顶）+ 右侧个人介绍与四格联系方式；下方四组项目数据（进入视口时数字滚动）；再下方四节点横向经历时间线 |
| 03 | **精选项目** | 12 栅格，两行 7/5、5/7 交错的大卡片。悬停时图片缓慢放大、压暗解除、底部滑出拍摄说明 |
| 04 | **个人优势** | 3×2 能力卡片，1px 细线分隔。悬停时左侧扫入一根青铜细线、右上的描边序号点亮 |
| 05 | **整屏收尾** | 100vh。超大标题 + 微信/电话双按钮 + 四格联系渠道 + 页脚（版权/备案/回到顶部），底部压着描边大字水印 |

---

## 4. 换照片、换视频

### 换成你自己的照片

**方式一（推荐，会自动裁切压缩）：**

1. 把原图（保留原始文件名）放进 `photos\`：

   | 文件名 | 用途 | 建议构图 |
   |---|---|---|
   | `hero.jpg` | 首屏背景 | 横构图，2400px 以上 |
   | `portrait-01.jpg` | 关于我的人物图 | 竖构图 |
   | `wedding-01.jpg` | 项目卡 1（宽卡） | 横构图 |
   | `wedding-02.jpg` | 项目卡 2（窄卡） | 竖构图 |
   | `wedding-03.jpg` | 项目卡 3（窄卡） | 竖构图 |
   | `wedding-04.jpg` | 项目卡 4（宽卡） | 横构图 |

2. 跑脚本：

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools\build-assets.ps1
   ```

   它会按 EXIF 方向摆正、按目标比例裁切、压缩，并把首屏视频一起重做。
   脚本需要 `ffmpeg` 在 PATH 里；没有的话可以显式指定：
   `-Ffmpeg "C:\path\to\ffmpeg.exe"`

   裁切偏置在脚本顶部的 `$jobs` 表里，`bias` 控制竖构图裁切时保留上部还是下部
   （`0` = 保留顶部，`0.5` = 居中）。

**方式二（只换图）：** 直接替换 `public\images\` 下的同名文件。目标尺寸见
`tools\build-assets.ps1` 的注释；比例不一致时 CSS 会用 `object-fit: cover` 自动裁掉多余部分，
每张图的取景位置可以在 `src\data\site.js` 的 `focal` 字段里调（例如 `'center 30%'`）。

**想加更多项目：** 往 `src\data\site.js` 的 `works.items` 里继续加对象即可，
`layout` 用 `'wide'`（占 7 格）或 `'narrow'`（占 5 格）。

### 换首屏视频

把任意 mp4 放到 `public\media\hero.mp4` 覆盖即可（建议 1920×1080、10 秒左右、无声、码率 2Mbps 以内）。
视频缺失或解码失败时，页面会自动退回 `hero-poster.jpg` 静态大图，不会黑屏。

> 现在这条视频是**用一张静态照片做缓慢推拉生成的**（正弦曲线，首尾衔接、循环无痕），
> 不是实拍素材。有真实拍摄的花絮/实录视频，直接替换掉效果会好得多。

---

## 5. 改文案

只改 `src\data\site.js` 一个文件：

```js
export const brand = { zh: 'LINSHEN.STUDIO', en: 'PHOTOGRAPHER · 人像 / 婚礼 / 商业', mark: 'L' }
export const hero = { titleLines: ['我拍的不是照片', '是时间'], /* ... */ }
export const about = { stats: [...], contacts: [...], timeline: [...] }
export const works = { items: [...] }        // 每张图的 alt 也在这里，请认真写
export const strengths = { items: [...] }
export const contact = { channels: [...], footer: {...} }
```

**写 alt 的时候请把「谁、在哪、在做什么」写清楚**，别写「客片」「婚纱照」这种废话——
它既是读屏软件用户的唯一信息来源，也是图片搜索的流量入口。

---

## 6. 设计系统约定

改样式时请尽量沿用这些变量（都在 `src\styles\base.css` 里），整个站才不会被改花：

| 变量 | 值 | 用途 |
|---|---|---|
| `--bg` / `--bg-soft` / `--bg-raise` | `#08090b` / `#0b0d10` / `#101318` | 三层底色，冷调近黑 |
| `--line` / `--line-2` / `--line-3` | 白 8% / 14% / 24% | 全站的分隔线只有这三档 |
| `--text` / `--text-2` / `--text-3` | `#edeff3` / `#99a1ad` / `#616874` | 三级文字 |
| `--accent` | `#c9a87c` | **唯一强调色（青铜）**，整屏占比控制在 2% 以内 |
| `--container` | `1700px` | 版心宽度（内容区，不含左右留白） |
| `--gutter` | `clamp(24px, 4.2vw, 76px)` | 左右留白 |
| `--section-y` | `clamp(104px, 11vw, 184px)` | 章节上下留白 |

字体是**自托管的可变字体**（Inter + Noto Sans SC），按 unicode-range 分片，
浏览器只会下载页面上真正用到的字，没有外链、没有 FOUT。

「科技感」主要不是靠颜色堆出来的，而是这几层：
1px 细线对齐 1700 版心、等宽字体的全大写小标签、`tabular-nums` 的数字、
全局胶片颗粒、以及全部 0.4–1.5s 的缓动（`--ease-out`）。

---

## 7. 已知取舍

| 事项 | 现状 | 建议 |
|---|---|---|
| 图片素材 | Pexels 免费占位图（可商用、无需署名） | **上线前必须换成自己的作品**；已确认这些图有自己的 EXIF/版权主体，标为「林深作品」是不合适的 |
| 首屏视频 | 静态图推拉生成，非实拍 | 有花絮/实录素材就替换 |
| 内容数据 | 全部为示例（860 场、96% 复购等） | 换成真实数字；数字站不住脚比没有数字更伤信任 |
| 表单 | 未做 | 摄影站真正需要的是「档期咨询」，建议接企业微信机器人 Webhook，比邮箱可靠 |
| 手机端 | 只做了不塌的兜底（断点 1080/860） | 主要面向 PC，手机端要精细打磨需要单独一轮 |
| SEO | 单页 SPA，只有一条 URL | 要图片搜索流量的话建议改多页或加预渲染 |
| 客户选片 | 未做 | 需密码相册 + 后端存储，是摄影工作室的刚需 |
