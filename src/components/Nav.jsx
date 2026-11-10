import { useEffect, useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useActiveSection } from '../hooks/useActiveSection.js'
import MusicPlayer from './MusicPlayer.jsx'
import './Nav.css'

export default function Nav() {
  const { lang, content, copy, toggleLanguage } = useLanguage()
  const { navLinks, brand } = content
  const [solid, setSolid] = useState(false)
  /* 当前章节高亮与右侧页内目录共用同一份状态（见 useActiveSection）。
     以前这里是各写一套：阈值、rAF 时机一旦不同，就会出现导航高亮「关于我」
     而目录高亮「精选项目」这种自相矛盾的画面。 */
  const active = useActiveSection(navLinks.map((link) => link.id))

  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0

      // 滚过 40px 就从「透明浮在首屏上」切成「带毛玻璃的悬浮条」
      // 注意：不做「下滚收起」，导航从第二屏起一直钉在顶部
      setSolid(window.scrollY > 40)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  return (
    <header className={`nav ${solid ? 'is-solid' : ''}`}>
      <div className="container nav__inner">
        <a className="nav__brand" href="#top" aria-label={`${brand.zh} ${lang === 'en' ? 'home' : '首页'}`}>
          <span className="nav__mark">{brand.mark}</span>
          <span className="nav__names">
            <b>{brand.zh}</b>
            <i>{brand.en}</i>
          </span>
        </a>

        <nav className="nav__links" aria-label={copy.navAria}>
          {navLinks.map((link) => (
            <a
              key={link.id}
              href={`#${link.id}`}
              className={`nav__link ${active === link.id ? 'is-active' : ''}`}
            >
              <span>{link.label}</span>
              <em>{link.en}</em>
            </a>
          ))}
        </nav>

        <div className="nav__actions">
          {/* 背景音乐开关。位置固定在「中/EN」左边：右上角已经被语言切换和
              预约按钮占住，只有插进这一行才不会和它们互相压住。 */}
          <MusicPlayer />
          <button
            type="button"
            className="nav__lang mono"
            onClick={toggleLanguage}
            aria-label={copy.languageLabel}
          >
            <span className={lang === 'zh' ? 'is-current' : ''}>中</span>
            <i>/</i>
            <span className={lang === 'en' ? 'is-current' : ''}>EN</span>
          </button>
          <a className="btn btn--primary btn--sm nav__cta" href="#booking">
            {copy.bookingCta}
          </a>
        </div>
      </div>
    </header>
  )
}
