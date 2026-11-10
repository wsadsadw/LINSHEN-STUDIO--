import { useLanguage } from '../context/LanguageContext.jsx'
import { useActiveSection } from '../hooks/useActiveSection.js'
import './Toc.css'

/**
 * 右侧页内目录。
 *
 * ⚠️ 为什么是「磨砂浮层」而不是普通竖排文字：
 *   站点的版心上限是 1700px，左右 gutter 最大也只有 76px ——
 *   在 1440px 这种常见宽度下右边缘只剩 60px。一个带序号和文字的目录
 *   必然压到正文上，所以这里主动做成一层和顶部导航同族的浮层
 *   （同样的 --bg-glass + backdrop-filter），让它读起来是「界面」而不是「脏」。
 *   同时只在 ≥1400px 显示：再窄就真的没有余地了。
 *
 * 高亮状态与顶部导航共用 useActiveSection，两者不可能不一致。
 */
export default function Toc() {
  const { content, lang } = useLanguage()
  const { navLinks } = content
  const active = useActiveSection(navLinks.map((link) => link.id))

  /**
   * 首屏（AltStudio 首页）上不显示目录，滚进第二屏才开始出现。
   *
   * 显隐直接挂在共享的滚动高亮上 —— 「当前章节不再是首页」就等价于「已经
   * 离开首屏」。这样不必再挂一套独立的滚动监听，也不会出现「目录已经出现、
   * 但高亮还停在首页」这种两套状态打架的情况。
   */
  const visible = active !== navLinks[0].id

  return (
    <nav
      className={`toc${visible ? ' is-visible' : ''}`}
      aria-label={lang === 'en' ? 'On this page' : '页内目录'}
    >
      <ol className="toc__list">
        {navLinks.map((link, index) => {
          const isActive = active === link.id
          return (
            <li key={link.id}>
              <a
                className={`toc__link${isActive ? ' is-active' : ''}`}
                href={`#${link.id}`}
                aria-current={isActive ? 'true' : undefined}
              >
                <span className="toc__tick" aria-hidden="true" />
                <span className="toc__idx mono" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="toc__label">{link.label}</span>
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
