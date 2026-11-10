/**
 * 点选批注桥 · 浏览器端
 *
 * 用法：进入页面后按住 Alt（Mac 上是 Option），鼠标划过的地方会高亮，
 * 点一下就弹出批注框，写一句「这个间距太大」，Ctrl+Enter 发送。
 *
 * 发送出去的不是像素和坐标，而是结构化描述：
 *   选择器 / React 组件名 / 源码文件与行号 / 计算样式 / 尺寸 / 原文
 * 模型读到这些就能直接定位到源码那一行去改。
 *
 * 这个文件由 dev server 直接以 text/javascript 提供，不是构建产物的一部分。
 */

// ------------------------------------------------------------------ 纯逻辑

const MAX_CLASSES = 2
const DEFAULT_DEPTH = 5

/**
 * 生成一段够用的人类可读选择器（不保证严格唯一，够模型定位即可）。
 * @param {Element} el
 * @param {number} maxDepth 最多向上取几层祖先
 */
export function buildSelector(el, maxDepth = DEFAULT_DEPTH) {
  const parts = []
  let node = el
  let depth = 0

  while (node && depth < maxDepth) {
    const tag = String(node.tagName || '').toLowerCase()
    if (!tag || tag === 'body' || tag === 'html') break

    let part = tag
    const id = node.id

    if (id) {
      part += `#${id}`
    } else {
      const classAttr = typeof node.className === 'string'
        ? node.className
        : (node.getAttribute?.('class') ?? '')
      const classes = classAttr.split(/\s+/).filter(Boolean).slice(0, MAX_CLASSES)
      if (classes.length) part += `.${classes.join('.')}`

      const parent = node.parentElement
      const children = parent?.children
      if (children) {
        const sameTag = Array.from(children).filter((child) => child.tagName === node.tagName)
        if (sameTag.length > 1) part += `:nth-of-type(${sameTag.indexOf(node) + 1})`
      }
    }

    parts.unshift(part)
    node = node.parentElement
    depth += 1
  }

  return parts.join(' > ')
}

/**
 * 从 getComputedStyle 的结果里挑出关心的属性，空值丢掉。
 * @param {CSSStyleDeclaration | Record<string, string>} computed
 * @param {string[]} keys
 */
export function pickStyles(computed, keys) {
  const picked = {}
  for (const key of keys) {
    const value = computed?.[key]
    if (typeof value === 'string' && value) picked[key] = value
  }
  return picked
}

// -------------------------------------------------------------- 浏览器引导

if (typeof document !== 'undefined') {
  bootstrap()
}

function bootstrap() {
  const STYLE_KEYS = [
    'display', 'position', 'color', 'backgroundColor', 'backgroundImage',
    'fontSize', 'fontWeight', 'fontFamily', 'lineHeight', 'letterSpacing',
    'padding', 'margin', 'gap', 'border', 'borderRadius', 'boxShadow',
    'opacity', 'width', 'height', 'maxWidth', 'textAlign', 'transform',
    'zIndex', 'flexDirection', 'justifyContent', 'alignItems', 'gridTemplateColumns',
  ]

  const state = {
    picking: false,      // Alt 按住中
    hovered: null,
    selected: null,
    panelOpen: false,
    indexPromise: null,
  }

  const ui = buildUi()

  // ---- 监听 ----

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Alt' && !state.panelOpen) setPicking(true)
    if (event.key === 'Escape' && state.panelOpen) closePanel()
  })

  window.addEventListener('keyup', (event) => {
    if (event.key === 'Alt' && !state.panelOpen) setPicking(false)
  })

  window.addEventListener('blur', () => {
    if (!state.panelOpen) setPicking(false)
  })

  document.addEventListener('mousemove', (event) => {
    if (!state.picking || state.panelOpen) return
    const target = pickable(event.target)
    if (!target || target === state.hovered) return
    state.hovered = target
    highlight(target)
  }, true)

  document.addEventListener('click', (event) => {
    if (!state.picking || state.panelOpen) return
    const target = pickable(event.target)
    if (!target) return
    event.preventDefault()
    event.stopPropagation()
    state.selected = target
    openPanel(target)
  }, true)

  // ---- 拾取与高亮 ----

  function pickable(node) {
    if (!node || node.nodeType !== 1) return null
    if (node.closest?.('[data-annotator-ui]')) return null
    return node
  }

  function setPicking(on) {
    state.picking = on
    ui.hint.setAttribute('data-active', on ? 'true' : 'false')
    if (!on) {
      state.hovered = null
      ui.box.style.display = 'none'
      ui.label.style.display = 'none'
    }
  }

  function highlight(el) {
    const rect = el.getBoundingClientRect()
    Object.assign(ui.box.style, {
      display: 'block',
      top: `${rect.top}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
    })
    const component = reactComponentName(el)
    const name = component ? `<${component}> ` : ''
    Object.assign(ui.label.style, {
      display: 'block',
      top: `${Math.max(rect.top - 22, 2)}px`,
      left: `${rect.left}px`,
    })
    ui.label.textContent = `${name}${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''}`
  }

  // ---- 批注面板 ----

  function openPanel(el) {
    state.panelOpen = true
    setPicking(true)
    ui.box.style.display = 'block'
    ui.label.style.display = 'none'

    const rect = el.getBoundingClientRect()
    const width = 340
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
    const top = Math.min(rect.bottom + 10, window.innerHeight - 220)
    Object.assign(ui.panel.style, {
      display: 'flex',
      left: `${left}px`,
      top: `${Math.max(12, top)}px`,
      width: `${width}px`,
    })
    ui.panel.querySelector('textarea').value = ''
    ui.panel.querySelector('textarea').focus()
  }

  function closePanel() {
    state.panelOpen = false
    state.selected = null
    ui.panel.style.display = 'none'
    setPicking(false)
  }

  async function send() {
    const textarea = ui.panel.querySelector('textarea')
    const note = textarea.value.trim()
    if (!note) {
      textarea.focus()
      return
    }

    const el = state.selected
    if (!el) {
      closePanel()
      return
    }

    const component = reactComponentName(el)
    const payload = {
      note,
      selector: buildSelector(el),
      url: window.location.href,
      component: component ?? '',
      loc: (await resolveLoc(component)) ?? '',
      tag: el.tagName.toLowerCase(),
      className: typeof el.className === 'string' ? el.className : '',
      text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 160),
      styles: pickStyles(window.getComputedStyle(el), STYLE_KEYS),
      box: boxOf(el),
    }

    const button = ui.panel.querySelector('button[data-send]')
    button.disabled = true
    button.textContent = '发送中…'

    try {
      const response = await fetch('/__annotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => ({ ok: false, error: `HTTP ${response.status}` }))
      if (!result.ok) throw new Error(result.error || '发送失败')
      toast(`已记录：#${payload.selector}`)
      closePanel()
    } catch (error) {
      toast(`发送失败：${error.message}（已复制到剪贴板，可直接粘给我）`)
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      } catch {
        /* 剪贴板不可用就算了 */
      }
      ui.panel.querySelector('textarea').focus()
    } finally {
      button.disabled = false
      button.textContent = '发送'
    }
  }

  // ---- React 组件名与源码定位 ----

  function reactComponentName(el) {
    const key = Object.keys(el).find((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'))
    let fiber = key ? el[key] : null
    let guard = 0
    while (fiber && guard < 400) {
      const type = fiber.type
      const name = typeof type === 'function'
        ? (type.displayName || type.name)
        : (type && typeof type === 'object' ? type.displayName : null)
      if (name && /^[A-Z]/.test(name)) return name
      fiber = fiber.return
      guard += 1
    }
    return null
  }

  async function resolveLoc(component) {
    if (!component) return null
    state.indexPromise ??= fetch('/__annotate/index')
      .then((response) => response.json())
      .then((body) => body.index ?? {})
      .catch(() => ({}))
    const index = await state.indexPromise
    const hit = index[component]
    return hit ? `${hit.file}:${hit.line}` : null
  }

  function boxOf(el) {
    const rect = el.getBoundingClientRect()
    return {
      x: Math.round(rect.left),
      y: Math.round(rect.top),
      w: Math.round(rect.width),
      h: Math.round(rect.height),
    }
  }

  // ---- DOM 构建 ----

  function buildUi() {
    const box = document.createElement('div')
    box.dataset.annotatorUi = ''
    box.style.cssText = [
      'position:fixed', 'display:none', 'pointer-events:none', 'z-index:2147483646',
      'border:2px solid #ff5a3c', 'background:rgba(255,90,60,0.12)',
      'border-radius:2px', 'transition:all 60ms linear',
    ].join(';')

    const label = document.createElement('div')
    label.dataset.annotatorUi = ''
    label.style.cssText = [
      'position:fixed', 'display:none', 'pointer-events:none', 'z-index:2147483647',
      'font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace',
      'background:#ff5a3c', 'color:#111', 'padding:1px 6px', 'border-radius:2px',
      'white-space:nowrap', 'max-width:60vw', 'overflow:hidden', 'text-overflow:ellipsis',
    ].join(';')

    const hint = document.createElement('div')
    hint.dataset.annotatorUi = ''
    hint.dataset.active = 'false'
    hint.textContent = 'Alt + 点击元素即可批注'
    hint.style.cssText = [
      'position:fixed', 'left:14px', 'bottom:14px', 'z-index:2147483645',
      'font:11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace',
      'color:#9aa0a6', 'background:rgba(12,12,14,.78)', 'border:1px solid #2a2a30',
      'padding:4px 8px', 'border-radius:3px', 'pointer-events:none',
      'opacity:.6', 'transition:opacity 120ms,color 120ms',
    ].join(';')

    const panel = document.createElement('div')
    panel.dataset.annotatorUi = ''
    panel.style.cssText = [
      'position:fixed', 'display:none', 'flex-direction:column', 'gap:8px',
      'z-index:2147483647', 'padding:10px', 'background:rgba(14,14,16,.97)',
      'border:1px solid #34343c', 'border-radius:4px',
      'box-shadow:0 12px 40px rgba(0,0,0,.55)',
      'font:12px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace', 'color:#e8e8ea',
    ].join(';')

    const textarea = document.createElement('textarea')
    textarea.placeholder = '这个要改成什么？（Ctrl+Enter 发送，Esc 取消）'
    textarea.style.cssText = [
      'width:100%', 'height:84px', 'resize:vertical', 'box-sizing:border-box',
      'background:#0a0a0c', 'color:#e8e8ea', 'border:1px solid #34343c',
      'border-radius:3px', 'padding:7px 8px', 'font:inherit', 'outline:none',
    ].join(';')

    const actions = document.createElement('div')
    actions.style.cssText = 'display:flex;justify-content:flex-end;gap:8px'

    const cancel = document.createElement('button')
    cancel.textContent = '取消'
    cancel.style.cssText = buttonStyle('#232329', '#c9c9cf')

    const submit = document.createElement('button')
    submit.dataset.send = ''
    submit.textContent = '发送'
    submit.style.cssText = buttonStyle('#ff5a3c', '#141414')

    actions.append(cancel, submit)
    panel.append(textarea, actions)

    document.body.append(box, label, hint, panel)

    cancel.addEventListener('click', closePanel)
    submit.addEventListener('click', send)
    textarea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        send()
      }
      event.stopPropagation()
    })

    // 悬停提示条在高亮时更醒目
    const observer = new MutationObserver(() => {
      hint.style.opacity = box.style.display === 'block' ? '1' : '.6'
      hint.style.color = box.style.display === 'block' ? '#ff9a86' : '#9aa0a6'
    })
    observer.observe(box, { attributes: true, attributeFilter: ['style'] })

    return { box, label, hint, panel }
  }

  function buttonStyle(background, color) {
    return [
      'background:' + background, 'color:' + color, 'border:1px solid #34343c',
      'border-radius:3px', 'padding:4px 12px', 'font:inherit', 'cursor:pointer',
    ].join(';')
  }

  function toast(message) {
    const node = document.createElement('div')
    node.dataset.annotatorUi = ''
    node.textContent = message
    node.style.cssText = [
      'position:fixed', 'left:50%', 'transform:translateX(-50%)', 'bottom:48px',
      'z-index:2147483647', 'max-width:76vw', 'padding:7px 14px',
      'background:#ff5a3c', 'color:#141414', 'border-radius:3px',
      'font:12px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace',
    ].join(';')
    document.body.append(node)
    setTimeout(() => node.remove(), 2600)
  }
}
