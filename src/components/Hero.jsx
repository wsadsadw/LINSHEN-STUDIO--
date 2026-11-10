import { useEffect, useState } from 'react'
import DisplayTitle from './DisplayTitle.jsx'
import { hero } from '../data/site.js'
import './Hero.css'

/** 首屏局部时间：让 HUD 读起来像真的在取景 */
function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

export default function Hero() {
  const clock = useClock()
  // 视频缺失/解码失败时自动退回静态大图，页面不会出现黑屏
  const [videoOk, setVideoOk] = useState(true)

  return (
    <section className="hero" id="hero">
      <div className="hero__media" aria-hidden="true">
        <img className="hero__fallback" src="/images/hero-poster.jpg" alt="" />
        {videoOk && (
          <video
            className="hero__video"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/images/hero-poster.jpg"
            onError={() => setVideoOk(false)}
          >
            <source src="/media/hero.mp4" type="video/mp4" />
          </video>
        )}
        <div className="hero__scrim" />
        <div className="hero__columns" />
      </div>

      <div className="container hero__inner">
        <div className="hero__head">
          <span className="eyebrow">{hero.eyebrow}</span>
        </div>

        <div className="hero__main">
          <DisplayTitle as="h1" className="hero__title" lines={hero.titleLines} delay={240} />

          <p className="hero__latin mono">{hero.latin}</p>
          <p className="hero__desc">{hero.desc}</p>

          <div className="hero__cta">
            <a className="btn btn--primary" href={hero.primary.href}>
              {hero.primary.label}
              <svg
                className="btn__arrow"
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
            <a className="btn btn--ghost" href={hero.secondary.href}>
              {hero.secondary.label}
            </a>
          </div>
        </div>

        <div className="hero__foot">
          <a className="hero__scroll" href="#about">
            <span className="mono">SCROLL</span>
            <i />
          </a>

          <div className="hero__hud">
            <div className="hero__hud-row">
              {hero.hud.map((item) => (
                <span className="hero__hud-item" key={item.k}>
                  <em>{item.k}</em>
                  <b>{item.v}</b>
                </span>
              ))}
            </div>
            <span className="hero__clock">
              <i className="hero__dot" />
              <span className="mono">LOCAL {clock}</span>
            </span>
          </div>
        </div>
      </div>

      {/* 首屏底部的服务关键词走马灯，把「这是做什么的」一句话说完 */}
      <div className="hero-ticker">
        <div className="hero-ticker__track">
          {[0, 1].map((dup) => (
            <div className="hero-ticker__group" key={dup} aria-hidden={dup === 1}>
              {hero.ticker.map((word) => (
                <span className="hero-ticker__item" key={`${dup}-${word}`}>
                  {word}
                  <i />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
