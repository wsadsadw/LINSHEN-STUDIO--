import { useEffect } from 'react'

/**
 * 带锚点打开时，校正落点。
 *
 * 为什么必须做：浏览器在页面加载的那一刻就去执行锚点滚动，而此时 React 才刚渲染、
 * 懒加载图片（球面画廊 40 张、人物肖像等）还在继续把文档撑高 —— 滚动发生之后
 * 布局仍在变化，落点就漂掉了。
 *
 * 实测（1440x900，本机无头 Edge，浏览器自行导航到带锚点的地址）：
 *   /#about   -> 停在「精选项目」          （差一节）
 *   /#booking -> 停在「服务套餐」的插图段  （差一节）
 * 也就是说「复制带锚点的网址发出去」这个场景原本是坏的。
 *
 * 做法：在几个时间点重新滚一次到目标。用户一旦自己滚轮 / 触摸 / 点击 / 按键，
 * 立刻收手 —— 不能把正在看东西的人拽回原位。
 */
export function useHashLanding() {
  useEffect(() => {
    const raw = window.location.hash.slice(1)
    if (!raw) return undefined

    let id = raw
    try {
      id = decodeURIComponent(raw)
    } catch {
      // 非法转义序列就用原文试一次
    }
    if (!id) return undefined

    let stopped = false
    const timers = []

    const land = () => {
      if (stopped) return
      const el = document.getElementById(id)
      if (!el) return
      // block:'start' 会沿用元素上的 scroll-margin-top，
      // 所以校准之后顶部栏同样不会压住标题。
      el.scrollIntoView({ block: 'start', behavior: 'auto' })
    }

    const stop = () => {
      if (stopped) return
      stopped = true
      timers.forEach(clearTimeout)
      window.removeEventListener('load', land)
      window.removeEventListener('wheel', stop)
      window.removeEventListener('touchstart', stop)
      window.removeEventListener('pointerdown', stop)
      window.removeEventListener('keydown', stop)
    }

    // 布局是渐进稳定的，所以多打几个点；window.load 再补一次
    ;[250, 700, 1400, 2400].forEach((ms) => timers.push(window.setTimeout(land, ms)))
    window.addEventListener('load', land)

    window.addEventListener('wheel', stop, { passive: true, once: true })
    window.addEventListener('touchstart', stop, { passive: true, once: true })
    window.addEventListener('pointerdown', stop, { once: true })
    window.addEventListener('keydown', stop, { once: true })

    return stop
  }, [])
}
