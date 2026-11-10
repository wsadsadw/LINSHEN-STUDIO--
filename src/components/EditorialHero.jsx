import { useLanguage } from '../context/LanguageContext.jsx'
import ParticleText from './ParticleText.jsx'
import './EditorialHero.css'

export default function EditorialHero() {
  const { content, lang } = useLanguage()
  const { studio, works, navLinks } = content
  const feature = works.items[2]
  const chapters = navLinks.filter((link) => ['about', 'works', 'services', 'booking'].includes(link.id))

  return (
    <section className="editorial-hero" aria-labelledby="hero-title">
      <div className="editorial-hero__halo" aria-hidden="true" />
      <div className="container editorial-hero__inner">
        <div className="editorial-hero__topline mono">
          <span><i /> {studio.meta}</span>
          <span>INDEPENDENT PHOTOGRAPHER</span>
        </div>

        <div className="editorial-hero__wordmark">
          <ParticleText
            text={studio.wordmark}
            particleSize={2.2}
            density={4}
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

        <div className="editorial-hero__stage">
          <div className="editorial-hero__copy">
            <p className="editorial-hero__eyebrow mono">{studio.rule}</p>
            <h1 id="hero-title">{studio.editorial.title.split('\n').map((line, index) => <span key={line} className={index ? 'is-soft' : ''}>{line}</span>)}</h1>
            <p className="editorial-hero__description">{studio.services.desc.replaceAll('\n', lang === 'en' ? ' ' : '')}</p>
            <div className="editorial-hero__actions">
              <a className="editorial-hero__link" href="#works">{studio.editorial.viewWork}<span aria-hidden="true">↗</span></a>
              <a className="editorial-hero__availability" href="#booking">{studio.services.cta} <span aria-hidden="true">→</span></a>
            </div>
            <p className="editorial-hero__signature">Lin Shen<span>{lang === 'en' ? 'LIGHT / PEOPLE / TIME' : '光线 / 人物 / 时间'}</span></p>
          </div>

          <a className="editorial-hero__visual" href="#works" aria-label={studio.editorial.viewWork}>
            <div className="editorial-hero__image">
              <img src={feature.image} alt={feature.alt} width="1300" height="1240" fetchPriority="high" />
              <span className="editorial-hero__image-no mono">SELECTED FRAME — 03</span>
              <span className="editorial-hero__image-arrow" aria-hidden="true">↗</span>
              <span className="editorial-hero__image-title">{feature.title}</span>
            </div>
            <div className="editorial-hero__caption mono"><span>{feature.category} / {feature.place}</span><span>{feature.year}</span></div>
          </a>
          <span className="editorial-hero__side mono" aria-hidden="true">A MOMENT, FOREVER.</span>
        </div>

        <div className="editorial-hero__footer">
          <nav className="editorial-hero__chapters" aria-label={studio.editorial.chapterNav}>
            {chapters.map((chapter, index) => <a href={`#${chapter.id}`} key={chapter.id}><span className="mono">0{index + 1}</span><b>{chapter.label}</b><em className="mono">{chapter.en}</em><i aria-hidden="true">↗</i></a>)}
          </nav>
        </div>
      </div>
    </section>
  )
}
