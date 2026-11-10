import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLanguage } from '../context/LanguageContext.jsx'
import './WeChatModal.css'

/* 占位用的二维码图形：一眼能看出「这里要放二维码」，但不会像真的能扫 */
const CELL = 9
const OFFSET = 5.5
const MODULES = (() => {
  const out = []
  let seed = 20261001
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648
    return seed / 2147483648
  }
  for (let y = 0; y < 13; y++) {
    for (let x = 0; x < 13; x++) {
      const inFinder = (x < 5 && y < 5) || (x > 7 && y < 5) || (x < 5 && y > 7)
      if (!inFinder && rnd() > 0.5) out.push([x, y])
    }
  }
  return out
})()

function QrPlaceholder({ copy }) {
  return (
    <div className="wq__ph">
      <svg viewBox="0 0 128 128" aria-hidden="true" className="wq__ph-svg">
        <g>
          {/* 三个定位角 */}
          <path d="M5.5 5.5h40v40h-40z M14.5 14.5v22h22v-22z" fillRule="evenodd" />
          <path d="M82.5 5.5h40v40h-40z M91.5 14.5v22h22v-22z" fillRule="evenodd" />
          <path d="M5.5 82.5h40v40h-40z M14.5 91.5v22h22v-22z" fillRule="evenodd" />
          {MODULES.map(([x, y]) => (
            <rect key={`${x}-${y}`} x={OFFSET + x * CELL} y={OFFSET + y * CELL} width={CELL} height={CELL} />
          ))}
        </g>
      </svg>
      <p className="wq__ph-text">
        {copy.qrPlaceholder[0]}
        <code>{copy.qrPlaceholder[1]}</code>
      </p>
    </div>
  )
}

export default function WeChatModal({ open, onClose }) {
  const { content, copy } = useLanguage()
  const { booking } = content
  const [qrMissing, setQrMissing] = useState(false)
  const closeRef = useRef(null)

  // 打开时：锁滚动、Esc 关闭、把焦点移到关闭键
  useEffect(() => {
    if (!open) return

    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    closeRef.current?.focus()

    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="wq" role="dialog" aria-modal="true" aria-labelledby="wq-title" onClick={onClose}>
      <div className="wq__card" onClick={(e) => e.stopPropagation()}>
        <button ref={closeRef} className="wq__close" onClick={onClose} aria-label={copy.close}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <span className="wq__k mono">WECHAT</span>
        <h3 className="wq__title" id="wq-title">
          {booking.wechat.modalTitle}
        </h3>

        <div className="wq__qr">
          {qrMissing ? (
            <QrPlaceholder copy={copy} />
          ) : (
            <img src={booking.wechat.qr} alt={copy.qrAlt} onError={() => setQrMissing(true)} />
          )}
        </div>

        <p className="wq__hint">{booking.wechat.hint}</p>
      </div>
    </div>,
    document.body,
  )
}
