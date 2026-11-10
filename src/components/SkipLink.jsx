import { useLanguage } from '../context/LanguageContext.jsx'

/**
 * 「跳到主要内容」链接。
 *
 * 键盘用户按下的第一个 Tab 就落到它上面；没有它，用键盘/读屏的人
 * 每次进站都得先穿过整个导航栏才能碰到正文。
 *
 * 目标是最外层 <main>（id="top"，见 App.jsx）。
 * 视觉隐藏不能用 display:none / visibility:hidden —— 那样它无法被聚焦，
 * 等于没装。所以用 transform 移出视口，聚焦时再滑回来。
 */
export default function SkipLink() {
  const { copy } = useLanguage()

  return (
    <a className="skip-link" href="#top">
      {copy.skipToContent}
    </a>
  )
}
