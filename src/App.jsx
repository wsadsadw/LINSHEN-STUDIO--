import ScrollProgress from './components/ScrollProgress.jsx'
import SkipLink from './components/SkipLink.jsx'
import Grain from './components/Grain.jsx'
import Nav from './components/Nav.jsx'
import Toc from './components/Toc.jsx'
import AltStudio from './alt/AltStudio.jsx'
import Series from './components/Series.jsx'
import Works from './components/Works.jsx'
import Strengths from './components/Strengths.jsx'
import Services from './components/Services.jsx'
import Booking from './components/Booking.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { useHashLanding } from './hooks/useHashLanding.js'

/**
 * 页面结构。
 *
 * 首屏之后的第一块是 <Series />（拍摄系列），不再是 <About />（个人经历）。
 * 理由见 Series.jsx 顶部注释：高端摄影站是「形象 → 能力 → 案例 → 服务 → 约」，
 * 个人故事不该占第二屏。About.jsx 与 about 数据都保留，换回去只需把
 * <Series /> 改回 <About />，并把 navLinks 里 series 的 id 改回 'about'。
 *
 * 首屏是 agency 海报式的 AltStudio：粒子采样的 LINSHEN.STUDIO 字标 +
 * 环绕字标旋转的照片线圈，左下服务简介。
 *
 * 历史：CodeX 曾把这里换成 EditorialHero（杂志编辑风：左文案 + 右黑白照片）
 * 并加了 ./styles/editorial.css，用户反馈那版不好，已切回 AltStudio。
 * 想再试那版：把 <AltStudio /> 换成 <EditorialHero />，
 * 并加回 `import EditorialHero from './components/EditorialHero.jsx'`
 * 与 `import './styles/editorial.css'`（两个文件都还在工程里）。
 */
export default function App() {
  /* 带锚点打开时校正落点。原生锚点滚动发生在懒加载把布局撑高之前，
     实测 /#about 会停在「精选项目」、/#booking 会停在「服务套餐」，
     都差一节。详见 useHashLanding 的注释。 */
  useHashLanding()

  return (
    <LanguageProvider>
      {/* DOM 最前：键盘用户按下的第一个 Tab 就落到它上面 */}
      <SkipLink />
      <ScrollProgress />
      <Nav />
      {/* 右侧页内目录（≥1400px 显示）。和 <Nav> 一样是固定的界面层，
          放在 <main> 之前，读屏用户也在正文之前先拿到它。 */}
      <Toc />

      <main id="top">
        <AltStudio />
        <Series />
        <Works />
        <Strengths />
        <Services />
      </main>

      <Booking />

      {/* 全局胶片颗粒：一层极淡的噪点，压掉大面积纯色的「塑料感」 */}
      <Grain />
    </LanguageProvider>
  )
}
