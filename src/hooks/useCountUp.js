import { useEffect, useRef, useState } from 'react'

/**
 * 数字滚动：active 变为 true 时，从 0 缓动到 target。
 * 用 requestAnimationFrame + easeOutCubic，不用定时器堆砌。
 */
export function useCountUp(target, active, duration = 1500) {
  const [value, setValue] = useState(0)
  const frame = useRef(0)

  useEffect(() => {
    if (!active) return

    const start = performance.now()
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(target * eased)
      if (p < 1) frame.current = requestAnimationFrame(tick)
      else setValue(target)
    }

    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, active, duration])

  return value
}
