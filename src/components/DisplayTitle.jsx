import { useInView } from '../hooks/useInView.js'
import './DisplayTitle.css'

/**
 * 大标题：逐字 3D 翻起 + 金属渐变 + 流光 / 霓虹辉光。
 *
 * 逐字拆分会打断读屏（每个字会被当成独立文本），所以外层挂 aria-label 提供完整句子，
 * 内部的拆字节点对辅助技术隐藏。
 *
 * 动画由「进入视口」触发，而不是页面加载就播完 —— 否则滚到这一屏时动画早结束了。
 *
 * @param lines        标题的每一行
 * @param accentIndex  哪一行用青铜金属色（默认最后一行）
 * @param delay        整段动画的起始延迟，毫秒
 * @param stagger      每个字之间的间隔，毫秒
 */
export default function DisplayTitle({
  lines,
  className = '',
  as: Tag = 'h2',
  accentIndex = lines.length - 1,
  delay = 0,
  stagger = 52,
}) {
  const [ref, inView] = useInView({ threshold: 0.3 })
  let index = 0

  return (
    <Tag
      ref={ref}
      aria-label={lines.join('')}
      className={`dtitle ${inView ? 'is-in' : ''} ${className}`.trim()}
    >
      {lines.map((line, li) => (
        <span
          key={li}
          aria-hidden="true"
          className={`dtitle__line ${li === accentIndex ? 'is-accent' : ''}`}
        >
          {Array.from(line).map((char, ci) => (
            <span
              className="dtitle__char"
              key={ci}
              style={{
                '--i': index++,
                '--base': `${delay}ms`,
                '--stagger': `${stagger}ms`,
              }}
            >
              {char}
            </span>
          ))}
          {/* 强调行下面那条会自己画出来的辉光细线 */}
          {li === accentIndex && (
            <i
              className="dtitle__rule"
              style={{ '--rule-delay': `${delay + index * stagger + 420}ms` }}
            />
          )}
        </span>
      ))}
    </Tag>
  )
}
