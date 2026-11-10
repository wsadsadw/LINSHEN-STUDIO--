import { useEffect, useMemo, useState } from 'react'
import Reveal from './Reveal.jsx'
import DisplayTitle from './DisplayTitle.jsx'
import WeChatModal from './WeChatModal.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import SectionBackdrop from './SectionBackdrop.jsx'
import './Booking.css'

const EMPTY = { name: '', contact: '', type: '', date: '', city: '', brief: '' }

/** 把表单内容拼成一段可以直接发出去的文字 */
function buildSummary(v, lang, copy) {
  const isEnglish = lang === 'en'
  return [
    isEnglish ? '[SHOOT INQUIRY]' : '【拍摄预约】',
    `${copy.name}: ${v.name || (isEnglish ? '(not provided)' : '（未填）')}`,
    `${copy.contact}: ${v.contact || (isEnglish ? '(not provided)' : '（未填）')}`,
    `${copy.type}: ${v.type}`,
    `${copy.date}: ${v.date || (isEnglish ? 'TBD' : '待定')}`,
    `${copy.city}: ${v.city || (isEnglish ? 'TBD' : '待定')}`,
    `${copy.brief}: ${v.brief || (isEnglish ? 'To discuss' : '待沟通')}`,
  ].join('\n')
}

function validate(v, lang) {
  const errors = {}
  if (!v.name.trim()) errors.name = lang === 'en' ? 'Please leave your name' : '请留一个称呼'

  const contact = v.contact.trim()
  const digits = contact.replace(/[\s-]/g, '')
  if (!contact) errors.contact = lang === 'en' ? 'Please leave a phone number or WeChat ID' : '手机号或微信号，至少留一样'
  else if (!/^1[3-9]\d{9}$/.test(digits) && contact.length < 3) {
    errors.contact = lang === 'en' ? 'Use an 11-digit phone number or a WeChat ID' : '手机号请填 11 位，或直接写微信号'
  }

  return errors
}

/** 迷你二维码图标，放在微信卡片左侧 */
function QrGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.4" />
      <rect x="14" y="3" width="7" height="7" rx="1.4" />
      <rect x="3" y="14" width="7" height="7" rx="1.4" />
      <path d="M14 14h3v3h-3zM19.5 14v2M14 19.5h2M19.5 18.5v2.5h-2" strokeLinecap="round" />
    </svg>
  )
}

export default function Booking() {
  const { content, copy, lang } = useLanguage()
  const { booking } = content
  const emailAddress = booking.channels.find((c) => c.k === 'EMAIL')?.value ?? ''
  const [values, setValues] = useState(() => ({ ...EMPTY, type: booking.form.types[0] }))
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wxOpen, setWxOpen] = useState(false)

  useEffect(() => {
    setValues((previous) => ({ ...previous, type: booking.form.types[0] }))
  }, [booking.form.types])

  const set = (key) => (e) => {
    const value = e.target.value
    setValues((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev))
  }

  const summary = useMemo(() => buildSummary(values, lang, copy), [values, lang, copy])

  const onSubmit = (e) => {
    e.preventDefault()
    const found = validate(values, lang)
    setErrors(found)
    if (Object.keys(found).length) return

    const subject = `${lang === 'en' ? 'Shoot inquiry · ' : '预约咨询 · '}${values.name}`
    window.location.href =
      `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}` +
      `&body=${encodeURIComponent(summary)}`
    setSent(true)
  }

  const copyForWeChat = async () => {
    try {
      await navigator.clipboard.writeText(summary)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2600)
    } catch {
      // 非 HTTPS 或用户拒绝授权：不假装复制成功，直接弹二维码让人手动抄
      setCopied(false)
    }
    setWxOpen(true)
  }

  return (
    <section className="booking" id="booking">
      {/* 这一屏自己已经有 glow + 竖线两层装饰，像素层压更淡一些免得打架 */}
      <SectionBackdrop opacity={0.42} />
      <span className="booking__glow" aria-hidden="true" />
      <span className="booking__columns" aria-hidden="true" />

      <div className="container booking__inner">
        <Reveal className="booking__head">
          <div className="sec-head__meta">
            <span className="sec-head__idx">{booking.index}</span>
            <span>{booking.latin}</span>
            <span className="sec-head__rule" />
            <span>{copy.bookingSection}</span>
          </div>
        </Reveal>

        {/* ── 标题 + 微信入口 ── */}
        <div className="booking__main">
          <div className="booking__intro">
            <DisplayTitle as="h2" className="booking__title" lines={booking.titleLines} delay={80} />
            <p className="booking__desc">{booking.desc}</p>
          </div>

          <Reveal className="booking__aside" delay={140}>
            <button type="button" className="wxcard" onClick={() => setWxOpen(true)}>
              <span className="wxcard__icon">
                <QrGlyph />
              </span>
              <span className="wxcard__body">
                <b>{booking.wechat.label}</b>
                <i className="mono">{booking.wechat.cardHint}</i>
              </span>
              <span className="wxcard__action mono">
                {copy.viewQr}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </button>

            <p className="booking__hours mono">{booking.hours}</p>
          </Reveal>
        </div>

        {/* ── 预约表单 ── */}
        <Reveal className="booking__form" delay={60}>
          <form className="bform" onSubmit={onSubmit} noValidate>
            <div className="bform__grid">
              <label className={`field ${errors.name ? 'has-error' : ''}`}>
                <span className="field__label mono">
                  {copy.name} <em>*</em>
                </span>
                <input
                  type="text"
                  name="name"
                  value={values.name}
                  onChange={set('name')}
                  placeholder={copy.namePlaceholder}
                  autoComplete="name"
                />
                {errors.name && <span className="field__err">{errors.name}</span>}
              </label>

              <label className={`field ${errors.contact ? 'has-error' : ''}`}>
                <span className="field__label mono">
                  {copy.contact} <em>*</em>
                </span>
                <input
                  type="text"
                  name="contact"
                  value={values.contact}
                  onChange={set('contact')}
                  placeholder={copy.contactPlaceholder}
                  autoComplete="tel"
                />
                {errors.contact && <span className="field__err">{errors.contact}</span>}
              </label>

              <label className="field">
                <span className="field__label mono">{copy.type}</span>
                <select name="type" value={values.type} onChange={set('type')}>
                  {booking.form.types.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field__label mono">{copy.date}</span>
                <input type="date" name="date" value={values.date} onChange={set('date')} />
              </label>

              <label className="field">
                <span className="field__label mono">{copy.city}</span>
                <input
                  type="text"
                  name="city"
                  value={values.city}
                  onChange={set('city')}
                  placeholder={copy.cityPlaceholder}
                />
              </label>

              <p className="bform__aside">
                {copy.uncertain[0]}
                <br />
                {copy.uncertain[1]}
              </p>

              <label className="field field--wide">
                <span className="field__label mono">{copy.brief}</span>
                <textarea
                  name="brief"
                  value={values.brief}
                  onChange={set('brief')}
                  rows={3}
                  placeholder={copy.briefPlaceholder}
                />
              </label>
            </div>

            <div className="bform__actions">
              <button type="submit" className="btn btn--primary bform__submit">
                {booking.form.submit}
                <svg className="btn__arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>

              <button type="button" className="btn btn--ghost" onClick={copyForWeChat}>
                {copied ? booking.form.copied : booking.form.copy}
              </button>
            </div>

            <p className={`bform__note ${sent ? 'is-sent' : ''}`}>
              {sent
                ? copy.sentNote
                : booking.form.note}
            </p>
          </form>
        </Reveal>

        {/* ── 联系方式 ── */}
        <Reveal className="booking__channels" delay={80}>
          {booking.channels.map((c) => (
            <div className="channel" key={c.k}>
              <span className="channel__k mono">{c.k}</span>
              <span className="channel__label">{c.label}</span>
              {c.action === 'wechat' ? (
                /* 不公开微信号：点一下直接弹二维码 */
                <button className="channel__value channel__value--btn" onClick={() => setWxOpen(true)}>
                  {c.value}
                </button>
              ) : c.href ? (
                <a className="channel__value" href={c.href}>
                  {c.value}
                </a>
              ) : (
                <span className="channel__value">{c.value}</span>
              )}
            </div>
          ))}
        </Reveal>

        <footer className="booking__foot">
          <span className="hairline" />
          <div className="booking__foot-row">
            <span className="mono">{booking.footer.copyright}</span>
            <span className="mono">{booking.footer.icp}</span>
            <a className="booking__top mono" href="#top">
              {copy.backToTop}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            </a>
          </div>
          <p className="booking__disclaimer mono">{booking.footer.note}</p>
        </footer>
      </div>

      <span className="booking__watermark" aria-hidden="true">
        LIN SHEN
      </span>

      <WeChatModal open={wxOpen} onClose={() => setWxOpen(false)} />
    </section>
  )
}
