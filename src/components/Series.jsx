import Reveal from './Reveal.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import SectionBackdrop from './SectionBackdrop.jsx'
import './Series.css'

/**
 * 01 · 拍摄系列
 *
 * 位置在首屏之后。这一节只回答一个问题：「你拍什么，我这种需求你能不能接」。
 * 具体案例交给下一节「精选项目」——所以这里的卡片是入口，不是作品详情。
 *
 * 历史：这块原来是 <About />（个人经历 / 自我介绍）。
 * 换成系列入口是因为高端摄影站的通行顺序是「形象 → 能力 → 案例 → 服务 → 约」，
 * 个人故事通常放在很后面甚至没有。About.jsx 与 about 数据都还在工程里，
 * 想换回去：App.jsx 里 <Series /> 改回 <About />，导航 id 也改回 'about'。
 */
export default function Series() {
  const { content, copy } = useLanguage()
  const { series } = content

  return (
    <section className="section section--line series" id="series">
      <SectionBackdrop />
      <div className="container">
        <Reveal className="sec-head">
          <div className="sec-head__meta">
            <span className="sec-head__idx">{series.index}</span>
            <span>{series.latin}</span>
            <span className="sec-head__rule" />
            <span>{copy.seriesSection}</span>
          </div>
          <div className="sec-head__body">
            <h2 className="sec-head__title">{series.title}</h2>
            <p className="sec-head__desc">{series.desc}</p>
          </div>
        </Reveal>

        <ul className="series__grid">
          {series.items.map((item, index) => (
            <Reveal as="li" className="series__item" key={item.id} delay={(index % 2) * 90}>
              <a className="series__card" href={item.href}>
                <span className="series__media">
                  <img
                    src={item.image}
                    alt={item.alt}
                    loading="lazy"
                    decoding="async"
                    width="900"
                    height="1125"
                  />
                  <span className="series__frame" aria-hidden="true" />
                </span>

                <span className="series__body">
                  <span className="series__row">
                    <span className="series__idx mono">{String(index + 1).padStart(2, '0')}</span>
                    <span className="series__tag mono">{item.tag}</span>
                  </span>
                  <h3 className="series__title">{item.title}</h3>
                  <p className="series__desc">{item.desc}</p>
                  <span className="series__meta mono">{item.meta}</span>
                </span>
              </a>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
