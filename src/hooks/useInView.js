import { useEffect, useRef, useState } from 'react'

/**
 * 元素进入视口时返回 true（用于滚动进场动画 / 数字滚动）。
 * 默认只触发一次；不支持 IntersectionObserver 时直接判定为可见，
 * 保证内容永远不是「因为动画没跑而空白」。
 */
export function useInView({ threshold = 0.15, rootMargin = '0px 0px -8% 0px', once = true } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            if (once) io.unobserve(entry.target)
          } else if (!once) {
            setInView(false)
          }
        }
      },
      { threshold, rootMargin },
    )

    io.observe(el)
    return () => io.disconnect()
  }, [threshold, rootMargin, once])

  return [ref, inView]
}
