import Reveal from './Reveal.jsx'
import { useInView } from '../hooks/useInView.js'
import { useCountUp } from '../hooks/useCountUp.js'
import { useLanguage } from '../context/LanguageContext.jsx'
import SectionBackdrop from './SectionBackdrop.jsx'
import './About.css'
// 必须排在 About.css 之后：参考站上 editorial.css 也是后加载的，
// 靠后加载才能复现那边的层叠结果（否则 5fr:7fr / 3:4 会把覆盖压回去）。
import '../styles/about-codex.css'

function Stat({ item, index }) {
  const [ref, inView] = useInView({ threshold: 0.5 })
  const value = useCountUp(item.value, inView)

  return (
    <div className="stat" ref={ref}>
      <span className="stat__num">
        {Math.round(value)}
        <em>{item.suffix}</em>
      </span>
      <span className="stat__label">
        {item.label.split('\n').map((line, i) => (
          <span key={`${line}-${i}`}>
            {i > 0 && <br />}
            {line}
          </span>
        ))}
      </span>
      <span className="stat__idx mono">0{index + 1}</span>
    </div>
  )
}

export default function About() {
  const { content, copy, lang } = useLanguage()
  const { about } = content
  return (
    <section className="section section--line about" id="about">
      <SectionBackdrop />
      <div className="container">
        <Reveal className="sec-head">
          <div className="sec-head__meta">
            <span className="sec-head__idx">{about.index}</span>
            <span>{about.latin}</span>
            <span className="sec-head__rule" />
            <span>{copy.aboutSection}</span>
          </div>
          <div className="sec-head__body">
            <h2 className="sec-head__title">{about.title}</h2>
            <p className="sec-head__desc">
              {about.lead}
              {about.paragraphs[0]}
            </p>
          </div>
        </Reveal>

        {/* ── 人物图 + 自我介绍 + 联系方式 ── */}
        <div className="about__main">
          <Reveal className="about__portrait" delay={60}>
            <div className="about__frame">
              <img
                src="/images/about-portrait.jpg"
                alt={copy.portraitAlt}
                loading="lazy"
                width="1200"
                height="1500"
              />
              <span className="about__corner about__corner--tl" />
              <span className="about__corner about__corner--br" />
            </div>
            <div className="about__caption">
              <span className="mono">{copy.portraitName}</span>
              <span className="mono">{copy.portraitLocation}</span>
            </div>
          </Reveal>

          <Reveal className="about__content" delay={140}>
            <p className="about__para">{about.paragraphs[1]}</p>
            <p className="about__para about__para--dim">
              {copy.aboutClosing}
            </p>

            <dl className="about__contacts">
              {about.contacts.map((c) => (
                <div className="about__contact" key={c.label}>
                  <dt className="mono">{c.label}</dt>
                  <dd>
                    {c.href ? <a href={c.href}>{c.value}</a> : <span>{c.value}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        {/* ── 项目数据 ── */}
        <Reveal className="about__stats" delay={40}>
          {about.stats.map((item, i) => (
            <Stat item={item} index={i} key={item.label} />
          ))}
        </Reveal>

        {/* ── 经历时间线 ── */}
        <div className="about__timeline">
          <Reveal className="about__timeline-head" delay={40}>
            <span className="mono">{copy.experience}</span>
            <span className="hairline" />
          </Reveal>
          <ol className="about__nodes">
            {about.timeline.map((node, i) => (
              <Reveal as="li" className="about__node" key={node.year} delay={i * 90}>
                <span className="about__dot" />
                <span className="about__year mono">{node.year}</span>
                <h3 className="about__node-title">{node.title}</h3>
                <p className="about__node-desc">{node.desc}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
