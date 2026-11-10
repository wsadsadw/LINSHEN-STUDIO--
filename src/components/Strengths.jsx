import Reveal from './Reveal.jsx'
import Icon from './Icon.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import SectionBackdrop from './SectionBackdrop.jsx'
import './Strengths.css'

export default function Strengths() {
  const { content, copy } = useLanguage()
  const { strengths } = content
  return (
    <section className="section section--line edge" id="strengths">
      <SectionBackdrop />
      <div className="container">
        <Reveal className="sec-head">
          <div className="sec-head__meta">
            <span className="sec-head__idx">{strengths.index}</span>
            <span>{strengths.latin}</span>
            <span className="sec-head__rule" />
            <span>{copy.strengthsSection}</span>
          </div>
          <div className="sec-head__body">
            <h2 className="sec-head__title">{strengths.title}</h2>
            <p className="sec-head__desc">{strengths.desc}</p>
          </div>
        </Reveal>

        <div className="edge__grid">
          {strengths.items.map((item, i) => (
            <Reveal as="article" className="edge__card" key={item.title} delay={(i % 3) * 90}>
              <span className="edge__sweep" />
              <span className="edge__ghost mono">{String(i + 1).padStart(2, '0')}</span>

              <span className="edge__icon">
                <Icon name={item.icon} />
              </span>

              <h3 className="edge__title">{item.title}</h3>
              <p className="edge__desc">{item.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
