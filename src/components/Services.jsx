import Reveal from './Reveal.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import SectionBackdrop from './SectionBackdrop.jsx'
import './Services.css'

/**
 * 服务套餐板块。
 *
 * 位置：个人优势（Strengths）与预约（Booking）之间。
 * 客户看完「我为什么值得托付」之后、决定要不要联系我之前，
 * 中间缺的正是「拍一次大概多少钱、包含什么」这一环。
 *
 * 内容全部来自 src/data/site.js 的 services 段与 i18n.js 的 enServices，
 * 改文案不用碰这个文件。
 */
export default function Services() {
  const { content, copy } = useLanguage()
  const { services } = content

  return (
    <section className="section section--line plans" id="services">
      <SectionBackdrop />
      <div className="container">
        <Reveal className="sec-head">
          <div className="sec-head__meta">
            <span className="sec-head__idx">{services.index}</span>
            <span>{services.latin}</span>
            <span className="sec-head__rule" />
            <span>{copy.servicesSection}</span>
          </div>
          <div className="sec-head__body">
            <h2 className="sec-head__title">{services.title}</h2>
            <p className="sec-head__desc">{services.desc}</p>
          </div>
        </Reveal>

        <div className="plans__grid">
          {services.items.map((item, i) => (
            <Reveal
              as="article"
              className={`plans__card${item.featured ? ' is-featured' : ''}`}
              key={item.id}
              delay={i * 90}
            >
              <span className="plans__sweep" />

              <header className="plans__head">
                <span className="plans__no mono">{String(i + 1).padStart(2, '0')}</span>
                {item.featured && <span className="plans__flag mono">{copy.servicesFeatured}</span>}
              </header>

              <h3 className="plans__name">{item.name}</h3>
              <p className="plans__tagline">{item.tagline}</p>

              <p className="plans__price">
                <span className="plans__amount">{item.price}</span>
                <span className="plans__unit">{item.priceNote}</span>
              </p>

              <p className="plans__lead">{item.lead}</p>

              <ul className="plans__list">
                {item.features.map((feature) => (
                  <li className="plans__item" key={feature}>
                    <span className="plans__tick" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>

              <a className="plans__cta" href="#booking">
                {copy.servicesCta}
                <span aria-hidden="true">→</span>
              </a>
            </Reveal>
          ))}
        </div>

        <Reveal className="plans__foot">
          <p className="plans__note">{services.footnote}</p>
        </Reveal>
      </div>
    </section>
  )
}
