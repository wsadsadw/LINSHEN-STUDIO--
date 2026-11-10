/**
 * 批注看门狗（dev-only 工具）
 *
 * 作用：把「你点完批注」变成一次事件，并把新批注结构化地交给模型，
 * 让「标注即修改」闭环成立。
 * 它挂在后台盯 .annotations/annotations.jsonl，一有 status 为 pending 的新批注
 * 就以结构化 JSON 打印并退出——退出本身会唤醒模型，模型读取后改代码。
 *
 * 用法：
 *   node tools/watch-annotations.mjs                 # 一直等，来批注就退出
 *   node tools/watch-annotations.mjs --timeout 600000 # 最多等 10 分钟，超时退出码 2
 *
 * 游标存在 .annotations/.cursor，只消费「完整行」（以 \n 结尾），
 * 所以半行写入不会被误读。
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = path.resolve(HERE, '..')

// ------------------------------------------------------------------ 纯逻辑

/**
 * 从 jsonl 全文中取出 cursor 之后的新批注。
 * @param {string} text 文件全文
 * @param {number} cursor 上次消费到的字节（字符）位置
 * @returns {{items: object[], nextCursor: number, errors: string[]}}
 */
export function extractNew(text, cursor) {
  const safeCursor = Number.isFinite(cursor) && cursor >= 0 && cursor <= text.length ? cursor : 0
  const rest = text.slice(safeCursor)

  const lastNewline = rest.lastIndexOf('\n')
  if (lastNewline === -1) {
    return { items: [], nextCursor: safeCursor, errors: [] }
  }

  const complete = rest.slice(0, lastNewline + 1)
  const lines = complete.split('\n').filter((line) => line.trim())

  const items = []
  const errors = []
  for (const line of lines) {
    try {
      items.push(JSON.parse(line))
    } catch (error) {
      errors.push(`坏行：${line.slice(0, 120)} —— ${error.message}`)
    }
  }

  return { items, nextCursor: safeCursor + complete.length, errors }
}

// --------------------------------------------------------------------- CLI

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, interval: 800, timeout: 0 }
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    const value = argv[i + 1]
    if (key === '--root') { args.root = path.resolve(value); i += 1 }
    else if (key === '--interval') { args.interval = Number(value); i += 1 }
    else if (key === '--timeout') { args.timeout = Number(value); i += 1 }
  }
  return args
}

function readCursor(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).cursor ?? 0
  } catch {
    return 0
  }
}

function writeCursor(file, cursor) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify({ cursor, updatedAt: new Date().toISOString() }), 'utf8')
}

function report(items, errors) {
  const pending = items.filter((item) => item.status !== 'applied' && item.status !== 'dismissed')
  console.log(JSON.stringify({
    kind: 'annotation-report',
    count: pending.length,
    items: pending.map((item, index) => ({
      index: index + 1,
      id: item.id,
      note: item.note ?? '(无 note)',
      loc: item.loc ?? null,
      component: item.component ?? null,
      selector: item.selector ?? null,
      tag: item.tag ?? null,
      className: item.className ?? null,
      text: item.text ?? null,
      styles: item.styles ?? null,
      box: item.box ?? null,
      status: item.status ?? 'pending',
      url: item.url ?? null,
    })),
    errors,
    message: '看门狗已退出，改完代码后请用 tools/apply-annotation.mjs 把已改批注标记为 applied，然后重挂看门狗。',
  }, null, 2))
  console.log('---')
  console.log('（看门狗已退出，改完代码后需要重新挂上）')
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const annotations = path.join(args.root, '.annotations', 'annotations.jsonl')
  const cursorFile = path.join(args.root, '.annotations', '.cursor')
  const startedAt = Date.now()

  console.log(`看门狗已就位，盯住 ${annotations}`)
  console.log(`游标 ${readCursor(cursorFile)} · 间隔 ${args.interval}ms · 超时 ${args.timeout ? `${args.timeout}ms` : '无'}`)

  for (;;) {
    let text = ''
    try {
      text = fs.readFileSync(annotations, 'utf8')
    } catch {
      text = ''
    }

    const cursor = readCursor(cursorFile)
    const { items, nextCursor, errors } = extractNew(text, cursor)

    const pending = items.filter((item) => item.status !== 'applied' && item.status !== 'dismissed')

    if (nextCursor !== cursor) writeCursor(cursorFile, nextCursor)

    if (pending.length) {
      report(items, errors)
      process.exit(0)
    }

    if (args.timeout && Date.now() - startedAt > args.timeout) {
      console.log('超时，没有新批注，退出。')
      process.exit(2)
    }

    await new Promise((resolve) => setTimeout(resolve, args.interval))
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) main()
