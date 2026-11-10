import { useEffect, useState } from 'react'

/**
 * 当前所在章节的 id（滚动高亮）。
 *
 * 顶部导航（Nav）和右侧页内目录（Toc）共用这一个实现。
 * 抽出来的原因不是「代码复用」这种好听的理由，而是：两份各自维护的滚动高亮
 * 迟早会打架 —— 阈值差一点、rAF 更新时机差一帧，就会出现导航高亮「关于我」
 * 而目录高亮「精选项目」这种自相矛盾的画面。共用一份状态从结构上杜绝它。
 *
 * 传入的 ids 必须按页面从上到下的顺序排列（取第一个命中即可推出「当前」）。
 *
 * @param {string[]} ids    章节 id，按文档顺序
 * @param {number}   offset 判定线：元素顶部越过视口这个位置就算「当前」。
 *                          取顶部栏高度再往下一点，滚动后标题正好落在栏下。
 */
export function useActiveSection(ids, offset = 140) {
  // ⚠️ 依赖数组身份陷阱：调用方每次渲染都可能传进一个新数组字面量，
  // 直接写 [ids] 会让 effect 每次渲染都重跑。所以用内容拼成的键做依赖。
  const key = ids.join('|')
  const [active, setActive] = useState(ids[0])

  useEffect(() => {
    const list = key.split('|').filter(Boolean)
    if (list.length === 0) return undefined

    let frame = 0

    const update = () => {
      frame = 0

      /**
       * 已滚到底 → 直接认最后一节。
       * 少了这一步，像「预约」这种排在末尾、又不算高的模块，它顶部可能
       * 永远越不过 offset，于是高亮会一直卡在它前面那一节 —— 用户看到的
       * 现象是「滚到页脚了，目录还高亮着『服务套餐』」。
       */
      const doc = document.documentElement
      const atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2
      if (atBottom) {
        setActive(list[list.length - 1])
        return
      }

      let current = list[0]
      for (const id of list) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= offset) current = id
      }
      setActive(current)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    // 视口高度变了，「是否滚到底」「哪些模块越过了判定线」都会变
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [key, offset])

  return active
}
