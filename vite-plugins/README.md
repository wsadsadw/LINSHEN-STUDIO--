# 点选批注桥（dev-only）

补上 harness 缺的那层「翻译」：把「你在页面上指的那个东西」变成模型能直接执行的结构化描述。

## 为什么需要它

模型看不到你的点击。没有这层桥，一句「这个卡片间距太大」对模型是不可执行的——它不知道该改哪一行。
桥的作用是把批注翻译成：

```json
{
  "note": "这个间距太大",
  "selector": "div.work-card:nth-of-type(2)",
  "component": "Works",
  "loc": "src/components/Works.jsx:36",
  "styles": { "padding": "48px", "color": "rgb(232,232,234)" },
  "box": { "x": 120, "y": 880, "w": 520, "h": 640 }
}
```

`loc` 是关键——有了文件+行号，改代码就不用猜。

## 怎么用

1. `node node_modules/vite/bin/vite.js`（或 `npm.cmd run dev`）起 dev server
2. 打开 http://127.0.0.1:5273 ，左下角有提示 `Alt + 点击元素即可批注`
3. **按住 Alt**（Mac 是 Option）→ 鼠标划过元素会高亮并显示 `<组件名> tag#id`
4. 点击目标元素 → 弹框 → 写要求 → `Ctrl+Enter` 发送
5. 批注落到 `.annotations/annotations.jsonl`，让模型读它、改代码

## 实现分层

| 文件 | 职责 |
|---|---|
| `annotate-bridge.mjs` | Vite 插件：注入客户端脚本、提供三个端点、校验并落盘批注、扫 `src/` 建组件索引 |
| `annotator-client.js` | 浏览器端：Alt 拾取、高亮、批注面板、从 React fiber 取组件名、收集计算样式 |

组件名 → 文件行号的映射是**运行时**做的（Vite 8 用 oxc，没有 babel，所以不能编译期注入 `data-loc`）：
浏览器从 fiber 上取 `type.name` → 请求 `/__annotate/index` → 服务端正则扫 `src/` 得到 `{组件名: {file, line}}` → 反查。

## 端点

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/__annotator/client.js` | 浏览器端脚本 |
| GET | `/__annotate/index` | 组件名 → `{file, line}` |
| GET | `/__annotate/list` | 已收集的批注 |
| POST | `/__annotate` | 提交一条批注 |

POST 白名单字段：`note`(必填,≤2000) `selector`(必填) `url` `loc` `component` `tag` `className` `text`(≤500) `styles` `box`。未知字段直接丢弃。

## 测试

```powershell
node test/annotate-bridge.test.js
node test/annotator-client.test.js
```

纯逻辑（组件索引、批注校验、选择器构造、样式挑选）都有单测；DOM 交互和 HTTP 端到端靠实跑验证。
**别用 `node --test`** —— 它要派生子进程，受限沙箱下 EPERM。

## 自动模式：看门狗

桥本身只负责「把批注写到文件」。要让它自动触发修改，靠 `tools/watch-annotations.mjs`：

1. 后台挂上看门狗 → 它轮询 `annotations.jsonl`
2. 你点完批注 → 看门狗读到新行 → 打印内容 → **退出**
3. 退出通知唤醒模型 → 模型读批注、改源码、重启 dev server、重新挂看门狗

游标在 `.annotations/.cursor`，只消费完整行，不会重复报警。

**边界**：模型没有后台线程，只能被「用户消息」或「后台 job 结束」唤醒——看门狗就是后者的制造器。所以看门狗一退出，那个链路就断了，必须重挂。

## 边界

- `apply: 'serve'`：只在 dev 生效，`dist/` 不含这层代码
- 选择器不保证唯一，够定位即可；关键定位信息是 `loc`
- 一次只处理单个元素，多元素批注就多点几次
