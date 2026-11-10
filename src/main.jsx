import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// 字体：拉丁文用 Inter，中文用 Noto Sans SC，都是本地自带的可变字体
// （按 unicode-range 分片，浏览器只会下载页面上真正用到的字，无外链、无 FOUT）
import '@fontsource-variable/inter'
import '@fontsource-variable/noto-sans-sc'
// 首屏字标用的展示衬线体：粗细对比强、斜体很讲究，是「高级感」的主要来源
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'

import './styles/base.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
