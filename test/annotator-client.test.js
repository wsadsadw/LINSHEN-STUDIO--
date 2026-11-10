import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildSelector, pickStyles } from '../vite-plugins/annotator-client.js'

/** 造一个最小的元素树；只实现 buildSelector 需要的形状。 */
function el(tagName, { id = '', classes = [], children = [] } = {}) {
  const node = { tagName: tagName.toUpperCase(), id, className: classes.join(' '), children: [], parentElement: null }
  for (const child of children) {
    child.parentElement = node
    node.children.push(child)
  }
  return node
}

test('buildSelector：单层元素给出 标签+类名', () => {
  const card = el('div', { classes: ['work-card'] })
  el('body', { children: [card] })

  assert.equal(buildSelector(card), 'div.work-card')
})

test('buildSelector：有 id 时用 id，且不再叠加类名', () => {
  const hero = el('section', { id: 'hero', classes: ['a', 'b'] })
  el('body', { children: [hero] })

  assert.equal(buildSelector(hero), 'section#hero')
})

test('buildSelector：同类兄弟多于一个时补 :nth-of-type', () => {
  const first = el('div', { classes: ['card'] })
  const second = el('div', { classes: ['card'] })
  const lone = el('p')
  el('body', { children: [first, second, lone] })

  assert.equal(buildSelector(second), 'div.card:nth-of-type(2)')
  assert.equal(buildSelector(lone), 'p')
})

test('buildSelector：只在 maxDepth 内向上取祖先', () => {
  const target = el('span', { classes: ['target'] })
  const e = el('div', { classes: ['e'], children: [target] })
  const d = el('div', { classes: ['d'], children: [e] })
  const c = el('div', { classes: ['c'], children: [d] })
  el('body', { children: [c] })

  assert.equal(buildSelector(target, 3), 'div.d > div.e > span.target')
})

test('buildSelector：类名最多取前两个', () => {
  const node = el('div', { classes: ['a', 'b', 'c', 'd'] })
  el('body', { children: [node] })

  assert.equal(buildSelector(node), 'div.a.b')
})

test('pickStyles：只取指定属性，空值丢弃', () => {
  const computed = { color: 'rgb(255, 0, 0)', padding: '', fontSize: '16px', gap: '0px' }

  assert.deepEqual(pickStyles(computed, ['color', 'padding', 'fontSize', 'opacity']), {
    color: 'rgb(255, 0, 0)',
    fontSize: '16px',
  })
})
