import Reveal from './Reveal.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import SectionBackdrop from './SectionBackdrop.jsx'
import DomeGallery from './DomeGallery.jsx'
import './Works.css'

function Arrow() {
  return (
    <svg
      width="14"
      height="14"
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
  )
}

/**
 * 精选项目。
 *
 * 展示方式从「4 张卡片的 7/5 交错网格」换成了 DomeGallery 的 3D 球面画廊：
 * 照片贴在一个可拖拽旋转的球面上，点任意一张会放大成独立视图。
 * 卡片时代的文案（标题/分类/年份/拍摄备注）保留在 site.js 的 works.items 里没删，
 * 只是不再渲染——球面靠画面本身说话。
 *
 * ⚠️ segments 与照片数量必须一起看：segments=8 → 8 列 × 5 行 = 40 格，
 *    照片少于 40 张就会被循环复用（源码里的 i % length），也就是会出现重复。
 */
export default function Works() {
  const { content, copy } = useLanguage()
  const { works } = content

  return (
    <section className="section section--line works" id="works">


      <div className="container">
        <Reveal className="sec-head">
          <div className="sec-head__meta">
            <span className="sec-head__idx">{works.index}</span>
            <span>{works.latin}</span>
            <span className="sec-head__rule" />
            <span>{copy.worksSection}</span>
          </div>
          <div className="sec-head__body">
            <h2 className="sec-head__title">{works.title}</h2>
            <p className="sec-head__desc">{works.desc}</p>
          </div>
        </Reveal>
      </div>

      {/* 球面画廊。刻意放在 .container 之外：球体要铺满整个视口宽度才够沉浸，
          套进 1700px 版心会显得局促。 */}
      <div className="works__dome">
        <DomeGallery
          images={works.gallery}
          /* 官方默认 35 → 35×5 = 175 格。
             之前为了满足「40 张不重复」把它压到 8（40 格），结果球面又大又稀疏，
             完全不是官方那种密集铺满的效果——这正是「不重复」和「官方排版」
             不能兼得的地方：官方 demo 自己只用 7 张图铺 175 格，重复了 25 次。 */
          segments={35}
          /* 保留彩色：要的是「氛围感」，灰度会把暖色调抹掉 */
          grayscale={false}
          /* = 全站 --bg，让球体边缘和页面无缝 */
          overlayBlurColor="#08090b"
          /* = 全站 --r-md（官方默认是 30px，太圆，和网站调性不搭） */
          imageBorderRadius="6px"
          openedImageBorderRadius="8px"
          openedImageWidth="min(520px, 62vw)"
          openedImageHeight="min(680px, 74vh)"
          /* 以下三项对齐官方默认值 */
          fit={0.5}
          minRadius={600}
          padFactor={0.25}
          dragSensitivity={20}
          maxVerticalRotationDeg={5}
          dragDampening={2}
          /* 自动旋转（本项目的扩展，上游没有）：让球面自己慢慢转，
             而不是等着用户去拖。speed 单位是度/秒，5 ≈ 72 秒一圈。
             组件内置了四个暂停条件：拖拽中 / 大图已放大 / 鼠标悬停 / 页面在后台。 */
          autoRotate
          autoRotateSpeed={5}
        />
      </div>

      <div className="container">
        <Reveal className="works__foot" delay={60}>
          <span className="hairline" />
          <p className="works__foot-text">
            {copy.fullPortfolio[0]}
            <a className="works__foot-link" href="#booking">
              {copy.fullPortfolio[1]}
              <Arrow />
            </a>
            {copy.fullPortfolio[2]}
          </p>
        </Reveal>
      </div>
    </section>
  )
}
