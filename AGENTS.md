# 摄影工作室官网 · 项目指令

> 全局工作方式（Superpowers 引导、例外清单）见 `~/.dsh/AGENTS.md`，此处只记**项目专有**的东西。

## 项目要点

- **技术栈**：React 19 + Vite 8，纯静态站，无后端。构建产物 `dist/`
- **内容总入口**：`src/data/site.js`（中文）、`src/data/i18n.js`（英文）。改文案基本只动这两个
- **启动**：项目根目录 `npm.cmd run dev` → http://127.0.0.1:5273
  - 若 `npm.cmd run dev` **无任何输出、退出码 0 就结束**（沙箱限制管道 stdio 时 npm 这层包装会静默失败），改用 `node node_modules/vite/bin/vite.js` 直接起，实测可用
  - Vite 在 Windows 上启动时会 `exec('net use')` 探测真实路径；受限沙箱下会报 `spawn EPERM`，需要放宽文件权限

## 点选批注桥（dev-only）

`vite-plugins/annotate-bridge.mjs` + `vite-plugins/annotator-client.js`，让「页面上指一下就能改」成立。

- **用法**：页面左下角会出现 `Alt + 点击元素即可批注`。按住 Alt 划过元素会高亮，点一下弹批注框，写一句要求，`Ctrl+Enter` 发送
- **落盘**：批注追加到 `.annotations/annotations.jsonl`（已被 `server.watch.ignored` 忽略，不会触发 EBUSY）
- **模型怎么用**：直接读 `.annotations/annotations.jsonl`，里面每条有 `selector` / `component` / `loc`（源码文件:行号）/ `styles`（计算样式）/ `box` / `note` → 精确改对应源码
- **端点**：`GET /__annotate/index`（组件名 → 文件:行号）、`GET /__annotate/list`、`POST /__annotate`
- **测试**：`node test/annotate-bridge.test.js && node test/annotator-client.test.js`（沙箱里别用 `node --test`，它要派生子进程会 EPERM）
- **只在 dev 生效**：插件 `apply: 'serve'`，`dist/` 里不含任何这部分代码（已验证）

### 自动修改：看门狗

`tools/watch-annotations.mjs` 把「点完批注」变成事件：它挂在后台盯 jsonl，一有新批注就打印并退出，**退出通知会唤醒模型**，于是不用用户再开口就能改代码。

```powershell
node tools/watch-annotations.mjs                  # 一直等，来批注就退出（改完要重新挂）
node tools/watch-annotations.mjs --timeout 600000 # 带超时，超时退出码 2
```

- 游标存 `.annotations/.cursor`，只消费以 `\n` 结尾的完整行（半行不会误读）
- 一次消费一批：把攒的批注一起报出来，改完一次重启
- **模型改完代码后必须重新挂看门狗 + 重启 dev server**，两件事都要做

## 踩过的坑（别再踩）

- **⚠️ 验证要用 `Content-Type`，不能只看状态码** —— Vite 对不存在的路径会回落到 `index.html` 并返回 200（`text/html`），只看 200 会把「模块根本没编译」误判成正常。真编译的模块返回 `text/javascript`
- **⚠️ 编辑文件会让 dev server 崩溃** —— 写入工具用「临时目录 + 原子重命名」，Vite 的文件监听抓到那个瞬时文件就抛 `EBUSY`。改完代码记得重启服务
- **⚠️ CSS 属性顺序** —— `-webkit-` 必须写在标准属性**前面**。lightningcss 去重时保留后者、删掉前者，写反会让 `backdrop-filter` / `mask-image` 在 Safari 上失效
- **无头截图别把 `--user-data-dir` 放进项目目录** —— Vite 会监听到 Edge 的缓存文件并崩溃（这个坑踩过一次）
- **⚠️ `--virtual-time-budget` 会让无头截图挂死** —— 首屏有常驻的 `requestAnimationFrame`（PixelBlast 粒子、DomeGallery 自转），虚拟时间永远推进不到「空闲」，截图会卡到超时。去掉这个参数就能正常出图
- **⚠️ HEAD 请求在 Vite 下不可信** —— 对 `public/` 下的文件发 HEAD 会拿到 `text/html` 的 SPA 回落页，看起来像「文件不存在」。验证静态资源一律用 GET 看 `Content-Type`
- **⚠️ `public/media/` 下新增文件必须重启 dev server** —— `vite.config.js` 里给 `server.watch.ignored` 加了 `**/public/media/**`：音频/视频被占用时（正在播放、或刚复制完句柄没释放）Vite 的监听器会抛 `EBUSY` 并直接让 dev server 退出，实测踩到两次。副作用是 Vite 靠监听器登记 public 文件，**被忽略目录里「服务器运行期间新增」的文件不会生效**，重启才认。已实测确认：`public/` 根目录新增文件立即生效，`public/media/` 下不生效。**只影响本地 dev；`npm run build` 是整包复制 `public/`，线上不受影响。**

## 上线前必须补完

见 `进度记录.md` 第五节 —— 真实照片替换、~~品牌名统一~~（✅ 2026-10-05 已统一为 `LINSHEN.STUDIO`）、编造的统计数据、ICP 备案号、客户肖像授权。
