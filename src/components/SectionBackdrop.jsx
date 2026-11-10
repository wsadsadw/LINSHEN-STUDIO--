import { useEffect, useRef, useState } from 'react'
import PixelBlast from './PixelBlast.jsx'
import './SectionBackdrop.css'

/**
 * 模块背景层：一层很淡的像素流光（PixelBlast）。
 *
 * 为什么不直接在 section 里写 <PixelBlast />：
 *
 * 1. **按需挂载**。PixelBlast 的 `autoPauseOffscreen` 依赖内部的
 *    `visibilityRef.current.visible`，但组件里没有任何地方去改它（恒为 true），
 *    所以那个开关实际不生效——画布会一直空转。五个模块同时常驻渲染会明显拖慢滚动，
 *    这里用 IntersectionObserver 做到「接近视口才建，滚远就销毁」。
 *    同时这也把同时存在的 WebGL 上下文压到 1–2 个，避开浏览器 8–16 个的上限。
 *
 * 2. **环境降级**。窄屏（≤860px）和系统开启了「减少动态效果」时不渲染：
 *    手机上挂五个 WebGL 画布既烫又费电，而这类装饰对移动端体验没有收益。
 *
 * 3. **统一调参**。颜色、密度、透明度集中在这里，改一处全站一致。
 */

export default function SectionBackdrop({
  color = '#e0c39c', // 比 --accent（#c9a87c）提亮一档的香槟金：暗底上更跳，又不脱离青铜色系
  opacity = 0.55,
  density = 0.92,
  scale = 2.2,
  speed = 0.32
}) {
  const hostRef = useRef(null)
  const [enabled, setEnabled] = useState(false)
  const [nearView, setNearView] = useState(false)

  // 只在宽屏且用户未要求「减少动态效果」时启用
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 861px)')
    const still = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setEnabled(wide.matches && !still.matches)
    sync()
    wide.addEventListener('change', sync)
    still.addEventListener('change', sync)
    return () => {
      wide.removeEventListener('change', sync)
      still.removeEventListener('change', sync)
    }
  }, [])

  // 接近视口才创建画布；滚远即销毁，释放 WebGL 上下文
  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setNearView(entry.isIntersecting),
      { rootMargin: '240px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={hostRef}
      className="sec-blast"
      aria-hidden="true"
      style={{ '--sec-blast-opacity': opacity }}
    >
      {enabled && nearView ? (
        <PixelBlast
          variant="circle"
          pixelSize={3.2}
          color={color}
          patternScale={scale}
          patternDensity={density}
          pixelSizeJitter={0.4}
          enableRipples={false}
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          speed={speed}
          edgeFade={0.55}
          transparent
        />
      ) : null}
    </div>
  )
}
