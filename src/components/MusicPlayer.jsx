import { useCallback, useEffect, useRef, useState } from 'react'
import './MusicPlayer.css'

/**
 * 背景音乐（放在导航栏右上角，紧挨「中/EN」左边）。
 *
 * 播放策略 —— 「尽量自动播放」，分两步：
 *   ① 进页面立刻尝试 play()。浏览器判定该站可自动播放的访客会真的立刻出声。
 *   ② 被拦下的（绝大多数首访者）在用户第一次点击 / 按键 / 触摸时自动接上，
 *      不需要他去找这个按钮。
 *   实现细节见下方那个 useEffect。
 *
 * ⚠️ 为什么做不到「一打开就必响」：
 *   浏览器（Chrome / Edge / Safari / Firefox）一律拒绝带声音的自动播放，
 *   未交互时调用 play() 会抛
 *   `NotAllowedError: play() failed because the user didn't interact with
 *    the document first.`
 *   这是平台规则，不是代码问题 —— 已用真实页面在本机实测确认。
 *
 * 曲目：巴赫《哥德堡变奏曲》开篇 Aria，Kimiko Ishizaka 演奏。
 *   CC0 1.0（公共领域奉献）—— 商用免费、无需署名。
 *   出处：https://archive.org/details/OpenGoldbergVariations
 */

const STORE_KEY = 'linshen:music'
const FADE_MS = 900
const VOLUME = 0.35

function readPref() {
  try {
    return window.localStorage.getItem(STORE_KEY)
  } catch {
    // Safari 私密模式 / 禁用存储时会抛，降级成「没有偏好」即可
    return null
  }
}

function writePref(value) {
  try {
    window.localStorage.setItem(STORE_KEY, value)
  } catch {
    /* 存不下就算了，不影响播放本身 */
  }
}

export default function MusicPlayer() {
  const audioRef = useRef(null)
  const rafRef = useRef(0)
  /** 期望状态。用来防止「快速连点」时，上一次淡出的收尾把新播放又暂停掉 */
  const wantPlayRef = useRef(false)
  const [playing, setPlaying] = useState(false)

  /**
   * 手写音量渐变。
   * 原生 volume 是瞬变的，直接 0 → 0.35 会「啪」一声，很难听。
   * 用 easeOutCubic 而不是线性，收尾更软。
   */
  const fadeTo = useCallback((target, onDone) => {
    const audio = audioRef.current
    if (!audio) return
    cancelAnimationFrame(rafRef.current)
    const from = audio.volume
    const startAt = performance.now()

    const step = (now) => {
      const t = Math.min(1, (now - startAt) / FADE_MS)
      const eased = 1 - Math.pow(1 - t, 3)
      audio.volume = Math.min(1, Math.max(0, from + (target - from) * eased))
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else if (onDone) {
        onDone()
      }
    }
    rafRef.current = requestAnimationFrame(step)
  }, [])

  const start = useCallback(async (record) => {
    const audio = audioRef.current
    if (!audio) return false
    wantPlayRef.current = true
    audio.volume = 0
    try {
      await audio.play()
      setPlaying(true)
      // 只有用户主动点按钮才记偏好；自动尝试播放不算「用户的决定」，
      // 让它保持「未设置」状态，语义才干净。
      if (record) writePref('on')
      fadeTo(VOLUME)
      return true
    } catch {
      // 被自动播放策略拦下、或文件取不到：保持停止态，不假装成功
      wantPlayRef.current = false
      setPlaying(false)
      return false
    }
  }, [fadeTo])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    wantPlayRef.current = false
    writePref('off')
    setPlaying(false)
    fadeTo(0, () => {
      // 淡出过程中若用户又点了播放，就不要暂停了
      if (!wantPlayRef.current) audio.pause()
    })
  }, [fadeTo])

  const toggle = useCallback(() => {
    if (wantPlayRef.current) stop()
    else start(true)
  }, [start, stop])

  /**
   * 悬停 / 键盘聚焦时提前把音频抓下来。
   * 配合 preload="none"：不hover 的人一个字节都不下载，
   * hover 过的人点下去立刻出声，不用干等 3.4 MB。
   */
  const warm = useCallback(() => {
    const audio = audioRef.current
    if (!audio || audio.preload === 'auto') return
    audio.preload = 'auto'
    audio.load()
  }, [])

  /**
   * 进页面就尽量让音乐响起来 —— 分两步，因为第一步只对一部分访客能成功。
   *
   * 1) 先直接 play()。
   *    对「浏览器判定该站可以自动播放」的访客这一步会真的成功（例如之前跟本站
   *    交互过、或自己把浏览器设成允许自动播放）。成功即名副其实的自动播放。
   *
   * 2) 失败的（绝大多数首访者）会抛
   *    `NotAllowedError: play() failed because the user didn't interact with
   *    the document first.` —— 浏览器硬性规定，前端绕不过去（已用真实页面实测）。
   *    于是挂一次性监听：用户在页面任意处第一次点击 / 按键 / 触摸时立刻接上，
   *    不需要他去找右上角那个按钮。
   *
   * 只有「明确关过音乐」的人（偏好为 'off'）不会被自动开启。
   */
  useEffect(() => {
    if (readPref() === 'off') return undefined

    let cancelled = false
    const gestures = ['pointerdown', 'keydown', 'touchend']
    const detach = () => gestures.forEach((g) => window.removeEventListener(g, begin))
    function begin() {
      if (cancelled) return
      detach()
      start(false)
    }

    start(false).then((ok) => {
      if (ok) detach() // 已经响了，不必再等手势
    })
    gestures.forEach((g) => window.addEventListener(g, begin))

    return () => {
      cancelled = true
      detach()
    }
  }, [start])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return (
    <>
      <audio ref={audioRef} className="music-src" src="/media/aria.mp3" loop preload="none" />
      <button
        type="button"
        className={`music-btn${playing ? ' is-playing' : ''}`}
        onClick={toggle}
        onPointerEnter={warm}
        onFocus={warm}
        aria-pressed={playing}
        aria-label={playing ? '暂停背景音乐' : '播放背景音乐'}
        title={playing ? '暂停背景音乐' : '播放背景音乐'}
      >
        {playing ? (
          /* 播放中：两道暂停杠 */
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="7" y="5.5" width="3.4" height="13" rx="1" />
            <rect x="13.6" y="5.5" width="3.4" height="13" rx="1" />
          </svg>
        ) : (
          /* 停止：一个小三角 */
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5.5v13l11-6.5z" />
          </svg>
        )}
      </button>
    </>
  )
}
