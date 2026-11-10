/**
 * 点选批注桥（dev-only）
 *
 * 解决的问题：模型看不到「你在页面上点的那个东西」。
 * 这里补上中间那层翻译——浏览器里 Alt+点击元素 → 生成结构化批注
 * （选择器 / 源码位置 / 计算样式 / 尺寸）→ POST 到本地端点 → 追加进
 * `.annotations/annotations.jsonl`。模型读这个文件就能精确改代码。
 *
 * 只挂在 dev server 上（apply: 'serve'），构建产物不含任何这部分代码。
 */
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const NOTE_LIMIT = 2000
const TEXT_LIMIT = 500
const BODY_LIMIT = 64 * 1024

const CLIENT_URL = '/__annotator/client.js'
const INDEX_URL = '/__annotate/index'
const LIST_URL = '/__annotate/list'
const POST_URL = '/__annotate'
const STATUS_URL = '/__annotate/status'

const STATUS_PENDING = 'pending'
const STATUS_APPLIED = 'applied'
const STATUS_DISMISSED = 'dismissed'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const CLIENT_FILE = path.join(HERE, 'annotator-client.js')

const SOURCE_EXT = /\.(jsx?|tsx?|mjs)$/
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', '.annotations'])

// ------------------------------------------------------------------ 纯逻辑

/**
 * 从源码文本里抽取「组件名 → 文件:行号」。
 * 浏览器端只能拿到组件名（React fiber 上的 type.name），文件名和行号靠它反查。
 *
 * @param {{path: string, code: string}[]} files
 * @returns {Record<string, {file: string, line: number}>}
 */
export function buildComponentIndex(files) {
  const index = {}
  const FUNCTION_DECL = /^\s*(?:export\s+)?(?:default\s+)?function\s+([A-Z][\w$]*)\s*\(/
  const ASSIGNED = /^\s*(?:export\s+)?(?:default\s+)?(?:const|let|var)\s+([A-Z][\w$]*)\s*=\s*(.*)$/

  for (const { path: file, code } of files) {
    const lines = String(code ?? '').split(/\r?\n/)
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i]

      const decl = FUNCTION_DECL.exec(line)
      if (decl) {
        const name = decl[1]
        if (!index[name]) index[name] = { file, line: i + 1 }
        continue
      }

      const assigned = ASSIGNED.exec(line)
      if (assigned) {
        const name = assigned[1]
        const rhs = assigned[2] ?? ''
        const looksLikeComponent = rhs.includes('=>') || rhs.includes('function') || rhs.includes('forwardRef(') || rhs.includes('memo(')
        if (looksLikeComponent && !index[name]) index[name] = { file, line: i + 1 }
      }
    }
  }

  return index
}

/**
 * 校验并规整浏览器发来的批注；白名单字段，未知字段直接丢掉。
 * @returns {{ok: true, value: object} | {ok: false, error: string}}
 */
export function normalizeAnnotation(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: '批注必须是对象' }
  }

  const note = typeof input.note === 'string' ? input.note.trim().slice(0, NOTE_LIMIT) : ''
  if (!note) {
    return { ok: false, error: 'note 不能为空' }
  }

  const selector = typeof input.selector === 'string' ? input.selector.trim() : ''
  if (!selector) {
    return { ok: false, error: 'selector 不能为空' }
  }

  const value = { id: randomUUID(), ts: Date.now(), note, selector, status: STATUS_PENDING }

  for (const key of ['url', 'loc', 'component', 'tag', 'className', 'text']) {
    const raw = input[key]
    if (typeof raw === 'string' && raw.trim()) value[key] = raw.trim().slice(0, TEXT_LIMIT)
  }
  for (const key of ['styles', 'box']) {
    const raw = input[key]
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) value[key] = raw
  }

  return { ok: true, value }
}

/** 一行 jsonl；调用方负责补换行符。 */
export function formatAnnotationLine(annotation) {
  return JSON.stringify(annotation)
}

// -------------------------------------------------------------- 文件扫描

function collectSourceFiles(dir, out = []) {
  let entries
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue
      collectSourceFiles(full, out)
    } else if (SOURCE_EXT.test(entry.name)) {
      out.push(full)
    }
  }
  return out
}

function buildIndexFromDir(rootDir) {
  const files = collectSourceFiles(path.join(rootDir, 'src')).map((full) => ({
    path: path.relative(rootDir, full).split(path.sep).join('/'),
    code: fs.readFileSync(full, 'utf8'),
  }))
  return buildComponentIndex(files)
}

// ------------------------------------------------------------------- HTTP

function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks = []
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > BODY_LIMIT) {
        reject(new Error('批注太大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Cache-Control', 'no-store')
  res.end(body)
}

function appendAnnotation(rootDir, annotation) {
  const dir = path.join(rootDir, '.annotations')
  fs.mkdirSync(dir, { recursive: true })
  const file = path.join(dir, 'annotations.jsonl')
  fs.appendFileSync(file, `${formatAnnotationLine(annotation)}\n`, 'utf8')
  return file
}

// ------------------------------------------------------------ Vite 插件

export function annotateBridge() {
  let rootDir = process.cwd()

  return {
    name: 'dsh-annotate-bridge',
    apply: 'serve',

    configResolved(config) {
      rootDir = config.root ?? rootDir
    },

    // 页面里注入点选脚本
    transformIndexHtml(html) {
      return {
        html,
        tags: [{ tag: 'script', attrs: { type: 'module', src: CLIENT_URL }, injectTo: 'body' }],
      }
    },

    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0]

        if (req.method === 'GET' && url === CLIENT_URL) {
          try {
            const code = fs.readFileSync(CLIENT_FILE, 'utf8')
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/javascript; charset=utf-8')
            res.setHeader('Cache-Control', 'no-store')
            res.end(code)
          } catch (error) {
            sendJson(res, 500, { ok: false, error: String(error) })
          }
          return
        }

        if (req.method === 'GET' && url === INDEX_URL) {
          try {
            sendJson(res, 200, { ok: true, index: buildIndexFromDir(rootDir) })
          } catch (error) {
            sendJson(res, 500, { ok: false, error: String(error) })
          }
          return
        }

        if (req.method === 'GET' && url === LIST_URL) {
          const file = path.join(rootDir, '.annotations', 'annotations.jsonl')
          const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
          const items = text
            .split(/\r?\n/)
            .filter(Boolean)
            .map((line) => {
              try {
                return JSON.parse(line)
              } catch {
                return { parseError: line }
              }
            })
          const status = (req.url.split('?')[1] || '').split('&')
            .map((kv) => kv.split('='))
            .find(([k]) => k === 'status')?.[1]
          const filtered = status ? items.filter((i) => i.status === status) : items
          sendJson(res, 200, { ok: true, file, items: filtered, total: items.length })
          return
        }

        if (req.method === 'POST' && url === POST_URL) {
          let payload
          try {
            payload = JSON.parse(await readBody(req))
          } catch (error) {
            sendJson(res, 400, { ok: false, error: `请求体解析失败：${error.message}` })
            return
          }

          const result = normalizeAnnotation(payload)
          if (!result.ok) {
            sendJson(res, 400, { ok: false, error: result.error })
            return
          }

          try {
            const file = appendAnnotation(rootDir, result.value)
            server.config.logger.info(`[annotate] 收到批注 ${result.value.selector} → ${file}`)
            sendJson(res, 200, { ok: true, id: result.value.id })
          } catch (error) {
            sendJson(res, 500, { ok: false, error: String(error) })
          }
          return
        }

        if (req.method === 'POST' && url === STATUS_URL) {
          let payload
          try {
            payload = JSON.parse(await readBody(req))
          } catch (error) {
            sendJson(res, 400, { ok: false, error: `请求体解析失败：${error.message}` })
            return
          }

          const id = typeof payload.id === 'string' ? payload.id.trim() : ''
          const status = typeof payload.status === 'string' ? payload.status.trim() : ''
          if (!id) {
            sendJson(res, 400, { ok: false, error: 'id 不能为空' })
            return
          }
          if (status !== STATUS_APPLIED && status !== STATUS_DISMISSED && status !== STATUS_PENDING) {
            sendJson(res, 400, { ok: false, error: 'status 必须是 pending / applied / dismissed' })
            return
          }

          try {
            const file = path.join(rootDir, '.annotations', 'annotations.jsonl')
            const text = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : ''
            const lines = text.split(/\r?\n/).filter(Boolean)
            let updated = 0
            const nextLines = lines.map((line) => {
              let item
              try {
                item = JSON.parse(line)
              } catch {
                return line
              }
              if (item.id === id) {
                item.status = status
                updated += 1
              }
              return JSON.stringify(item)
            })
            if (updated === 0) {
              sendJson(res, 404, { ok: false, error: `未找到 id 为 ${id} 的批注` })
              return
            }
            fs.writeFileSync(file, nextLines.join('\n') + (nextLines.length ? '\n' : ''), 'utf8')
            sendJson(res, 200, { ok: true, id, status })
          } catch (error) {
            sendJson(res, 500, { ok: false, error: String(error) })
          }
          return
        }

        next()
      })
    },
  }
}

export default annotateBridge
