/**
 * 批注状态标记工具（dev-only 工具）
 *
 * 作用：模型改完对应代码后，用本工具把批注标记为 applied（已应用）或 dismissed（已忽略）。
 * 看门狗会跳过非 pending 的批注，避免重复上报。
 *
 * 用法：
 *   node tools/apply-annotation.mjs <id> applied|dismissed|pending
 *
 * 示例：
 *   node tools/apply-annotation.mjs 5ca006d5-2697-4f2a-9065-94d511a766bd applied
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = path.resolve(HERE, '..')

const STATUS_APPLIED = 'applied'
const STATUS_DISMISSED = 'dismissed'
const STATUS_PENDING = 'pending'

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, id: '', status: '' }
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key.startsWith('--')) {
      if (!args.id) args.id = key
      else if (!args.status) args.status = key
    }
  }
  return args
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.id) {
    console.error('用法：node tools/apply-annotation.mjs <id> applied|dismissed|pending')
    process.exit(1)
  }
  if (args.status !== STATUS_APPLIED && args.status !== STATUS_DISMISSED && args.status !== STATUS_PENDING) {
    console.error(`错误：status 必须是 ${STATUS_APPLIED} / ${STATUS_DISMISSED} / ${STATUS_PENDING}`)
    process.exit(1)
  }

  const file = path.join(args.root, '.annotations', 'annotations.jsonl')
  let text = ''
  try {
    text = fs.readFileSync(file, 'utf8')
  } catch {
    console.error(`未找到批注文件：${file}`)
    process.exit(1)
  }

  const lines = text.split(/\r?\n/).filter(Boolean)
  let updated = 0
  const nextLines = lines.map((line) => {
    let item
    try {
      item = JSON.parse(line)
    } catch {
      return line
    }
    if (item.id === args.id) {
      item.status = args.status
      updated += 1
    }
    return JSON.stringify(item)
  })

  if (updated === 0) {
    console.error(`未找到 id 为 ${args.id} 的批注`)
    process.exit(1)
  }

  fs.writeFileSync(file, nextLines.join('\n') + (nextLines.length ? '\n' : ''), 'utf8')
  console.log(`已标记批注 ${args.id} 为 ${args.status}`)
}

main()
