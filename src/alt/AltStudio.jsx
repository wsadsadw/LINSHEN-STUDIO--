import { Fragment, useEffect, useRef, useState } from 'react'
import ParticleText from '../components/ParticleText.jsx'
import CircularCarousel from '../components/CircularCarousel.jsx'
import PatternWaves from '../components/PatternWaves.jsx'
import DisplayTitle from '../components/DisplayTitle.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import './AltStudio.css'

/** 把文案里的 \n 渲染成真正的换行 */
function Lines({ text }) {
  return (
    <>
      {text.split('\n').map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {line}
        </Fragment>
      ))}
    </>
  )
}

/**
 * agency 海报式首屏。
 *
 * 主视觉是一组「字标级排版」，不用照片：
 *   LINSHEN.STUDIO 由 ParticleText 用粒子采样生成 ——
 *   进场时从四周散开、逐粒归位，鼠标扫过会把粒子推开、离开时重新聚拢。
 *
 * 配色是照着橙红底调的：粒子从白（左）渐变到暖香槟（右），
 * 辉光也用同一个暖色，避免和背景撞在一起。
 */
export default function AltStudio() {
  const { content } = useLanguage()
  const { heroReel, studio } = content
  const [reelShift, setReelShift] = useState(0)
  const reelRef = useRef(null)

  /**
   * 照片环的垂直补偿。
   *
   * 组件内部用「投影包围盒」来居中，这套算法是给默认的平躺环写的。
   * 我们把俯角推到 -76° 让环立起来之后，包围盒中心就不再等于环的几何中心，
   * 整个环会往下掉约一个半径（实测 416px）。
   *
   * 这里不改组件源码，而是在外面量一次真实渲染位置，反推需要补多少。
   * 入场动画期间环的半径是渐变的，所以要等动画结束再量。
   */
  useEffect(() => {
    const wrap = reelRef.current
    if (!wrap) return undefined
    let raf = 0
    const timers = []

    const measure = () => {
      const cards = wrap.querySelectorAll('.circular-carousel__card')
      if (!cards.length) return

      let minX = Infinity
      let maxX = -Infinity
      let minY = Infinity
      let maxY = -Infinity

      cards.forEach((card) => {
        const tile = card.querySelector('.circular-carousel__tile')
        if (!tile) return
        const r = tile.getBoundingClientRect()
        if (!r.width && !r.height) return
        const cx = r.left + r.width / 2
        const cy = r.top + r.height / 2
        minX = Math.min(minX, cx)
        maxX = Math.max(maxX, cx)
        minY = Math.min(minY, cy)
        maxY = Math.max(maxY, cy)
      })

      if (!Number.isFinite(minY)) return

      const box = wrap.getBoundingClientRect()
      const desired = box.height / 2
      const actual = (minY + maxY) / 2 - box.top
      setReelShift(Math.round(desired - actual))
    }

    const schedule = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        measure()
      })
    }

    schedule()
    timers.push(window.setTimeout(schedule, 800), window.setTimeout(schedule, 2200))
    window.addEventListener('resize', schedule)

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      timers.forEach(window.clearTimeout)
      window.removeEventListener('resize', schedule)
    }
  }, [])

  // 首屏右下原本有一个快速咨询表单（早期走 mailto、中途改成微信二维码弹窗），
  // 现已整块移除：首屏只负责立住调性，转化交给底部的预约板块。
  // 表单的 state / onSubmit / nameRef 一并清掉，不留死引用。

  return (
    <section className="alt">
      {/* ── 背景层：橙红渐变 / 波纹质感 / 同心环 / 网格 / 扫描线 ── */}
      <div className="alt__bg" aria-hidden="true" />

      {/*
        背景质感层（PatternWaves）。
        底色不改：backgroundColor 传 transparent，让下面那层橙红渐变透出来，
        这里只叠一层纹理，所以整屏的色相和明度基本不变。
        color 用的是比底色更深的暖红 —— 组件会按亮度自动判定用「墨」模式，
        深色在亮橙上印出来才像同一块布料的褶皱，不是贴上去的花纹。
        fade="center" 让中间最淡、四周最重：字标那一带保持干净。
      */}
      <div className="alt__waves" aria-hidden="true">
        <PatternWaves
          preset="silk"
          color="#8c1a00"
          backgroundColor="transparent"
          fade="center"
          fadeSize={0.72}
          opacity={0.62}
          speed={0.3}
          interactive
          cursorSize={90}
          cursorStrength={0.45}
        />
      </div>

      <div className="alt__rings" aria-hidden="true" />
      <div className="alt__grid" aria-hidden="true" />
      <div className="alt__scan" aria-hidden="true" />
      <span className="alt__glow alt__glow--core" aria-hidden="true" />
      <span className="alt__glow alt__glow--rim" aria-hidden="true" />
      <div className="alt__vignette" aria-hidden="true" />

      <span className="alt__meta mono">{studio.meta}</span>

      {/* ── 环绕字标的一圈照片：竖立的环，名字像横轴一样从中间穿过去 ── */}
      <div
        className="alt__reel"
        ref={reelRef}
        style={{ '--reel-shift': `${reelShift}px` }}
      >
        <CircularCarousel
          items={heroReel}
          /*
           * preset="coil" 是本项目给组件加的新排布（原版只有 cylinder/orbit/wheel/panorama）。
           * 原版四种都是「一个圆环」，做不出「一圈圈盘着文字走」的螺旋。
           * coil = 卡片一边沿 x 推进、一边绕 x 旋转，就是滑动变阻器上绕的那种导线。
           */
          preset="coil"
          intro="assemble"
          cardWidth={150}
          aspectRatio={1}
          gap={0}
          /* 线圈半径：比字标高不少，线圈才张得开、上下盘得出去 */
          coilRadius={250}
          /* 盘 5 圈：每张卡转 360×5/12 = 150°。
             不能选 4 —— 4 圈时每张 120°，三张就回到原位（120×3=360），
             整圈实际只有 3 个角度位置，看着是「三排卡」而不是螺旋。
             5 和 12 互质，12 张刚好分布出 12 个不同角度。 */
          turns={5}
          speed={5}
          direction="left"
          /* 深度的表现交给 CSS 的透明度（见 AltStudio.css），这里给满量程 */
          depthFade={1}
          fadeColor="#b83c05"
          innerShade={1}
          cornerRadius={10}
          parallax={0.3}
          stretch={0.4}
        />
      </div>

      {/* ── 主视觉：粒子字标 ── */}
      <div className="alt__center">
        {/*
          这里原来垫了一层 backdrop-filter 虚化，用来把从字后面穿过的卡片糊掉。
          但那层东西同时把字和背景隔开了，看起来就是「贴上去的一块」。
          现在去掉，让照片线圈和字真正重合。
        */}

        {/* 语义与 SEO 交给这个隐形的 h1，视觉交给 canvas */}
        <h1 className="sr-only">{studio.wordmarkAlt}</h1>

        <div className="alt__mark">
          <ParticleText
            text={studio.wordmark}
            particleSize={2.2}
            density={4}
            /* 暖白 + 香槟金：纯白压在饱和橙红上会像贴上去的，暖色才融得进背景 */
            color="#ffefe0"
            highlightColor="#ffc989"
            scatter={200}
            gatherDuration={1700}
            stagger={460}
            pointerRepel={42}
            repelRadius={140}
            idleDrift={0.7}
            trigger="hover"
            fontSize="13.5vw"
            fontWeight={900}
            fontFamily="inherit"
            glow
          />
        </div>

        <div className="alt__rule" aria-hidden="true">
          <span className="alt__rule-line" />
          <span className="alt__rule-text mono">{studio.rule}</span>
          <span className="alt__rule-line" />
        </div>
      </div>

      {/* ── 左下：服务标题 + 简介 ── */}
      <div className="alt__bl">
        <span className="alt__kicker mono">
          <i />
          {studio.services.kicker}
        </span>
        {/* 标题交给 DisplayTitle 驱动：逐字 3D 翻起 + 金属渐变 + 强调行下方
            自动画出的辉光线。它自带 aria-label、拆开的字对读屏隐藏，
            所以拆字不会破坏无障碍。 */}
        <DisplayTitle
          as="h2"
          className="alt__title"
          lines={studio.services.title.split('\n')}
          delay={240}
          stagger={40}
        />
        <p className="alt__desc">
          <Lines text={studio.services.desc} />
        </p>
        <a className="alt__more" href="#booking">
          {studio.services.cta}
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>

    </section>
  )
}
