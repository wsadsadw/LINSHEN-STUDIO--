import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { siteByLang, ui } from '../data/i18n.js'

const LanguageContext = createContext(null)

function getInitialLanguage() {
  if (typeof window === 'undefined') return 'zh'
  const saved = window.localStorage.getItem('linshen-language')
  if (saved === 'zh' || saved === 'en') return saved
  return navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'zh'
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(getInitialLanguage)

  useEffect(() => {
    window.localStorage.setItem('linshen-language', lang)
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN'
    document.title = lang === 'en'
      ? 'LINSHEN.STUDIO | Documentary Wedding, Portrait & Commercial Photography'
      : 'LINSHEN.STUDIO · 独立摄影师 | 人像 · 婚礼 · 商业摄影'
  }, [lang])

  const value = useMemo(() => ({
    lang,
    setLang,
    toggleLanguage: () => setLang((current) => (current === 'zh' ? 'en' : 'zh')),
    content: siteByLang[lang],
    copy: ui[lang],
  }), [lang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const value = useContext(LanguageContext)
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider')
  return value
}

