import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildComponentIndex,
  normalizeAnnotation,
  formatAnnotationLine,
} from '../vite-plugins/annotate-bridge.mjs'

// ---------------------------------------------------------------- 组件索引

test('buildComponentIndex：识别 export default function 并给出文件与行号', () => {
  const code = ['export default function Works({ items }) {', '  return <div />', '}'].join('\n')

  const index = buildComponentIndex([{ path: 'src/components/Works.jsx', code }])

  assert.deepEqual(index.Works, { file: 'src/components/Works.jsx', line: 1 })
})

test('buildComponentIndex：多个组件各自记行号，import 行不产生条目', () => {
  const code = [
    "import x from 'y'",
    '',
    'export default function About() {',
    '  return null',
    '}',
    '',
    'function Helper() { return null }',
  ].join('\n')

  const index = buildComponentIndex([{ path: 'src/components/About.jsx', code }])

  assert.deepEqual(index.About, { file: 'src/components/About.jsx', line: 3 })
  assert.deepEqual(index.Helper, { file: 'src/components/About.jsx', line: 7 })
  assert.equal(index.x, undefined)
})

test('buildComponentIndex：const 箭头组件与 forwardRef 包装都识别', () => {
  const code = [
    'const Reveal = ({ children }) => {',
    '  return children',
    '}',
    'const Modal = forwardRef((props, ref) => null)',
  ].join('\n')

  const index = buildComponentIndex([{ path: 'src/components/Reveal.jsx', code }])

  assert.deepEqual(index.Reveal, { file: 'src/components/Reveal.jsx', line: 1 })
  assert.deepEqual(index.Modal, { file: 'src/components/Reveal.jsx', line: 4 })
})

test('buildComponentIndex：小写函数不算组件', () => {
  const code = ['function helper() {', '}', 'function useThing() {', '}'].join('\n')

  const index = buildComponentIndex([{ path: 'src/hooks/useThing.js', code }])

  assert.deepEqual(index, {})
})

test('buildComponentIndex：文件名带 posix 路径也原样保留', () => {
  const index = buildComponentIndex([
    { path: 'src/alt/AltStudio.jsx', code: 'export default function AltStudio() {}' },
  ])

  assert.equal(index.AltStudio.file, 'src/alt/AltStudio.jsx')
})

// ---------------------------------------------------------------- 批注规整

test('normalizeAnnotation：缺少 note 时拒绝', () => {
  const result = normalizeAnnotation({ selector: '.card', note: '   ' })

  assert.equal(result.ok, false)
  assert.match(result.error, /note/)
})

test('normalizeAnnotation：缺少 selector 时拒绝', () => {
  const result = normalizeAnnotation({ note: '太挤了' })

  assert.equal(result.ok, false)
  assert.match(result.error, /selector/)
})

test('normalizeAnnotation：合法输入产出带 id/ts 的规整对象', () => {
  const result = normalizeAnnotation({
    selector: '.work-card:nth-child(2)',
    note: '  这个间距太大  ',
    loc: 'src/components/Works.jsx:42',
    url: 'http://127.0.0.1:5273/',
  })

  assert.equal(result.ok, true)
  assert.equal(result.value.note, '这个间距太大')
  assert.equal(result.value.selector, '.work-card:nth-child(2)')
  assert.equal(result.value.loc, 'src/components/Works.jsx:42')
  assert.equal(typeof result.value.id, 'string')
  assert.ok(result.value.id.length > 0)
  assert.equal(typeof result.value.ts, 'number')
})

test('normalizeAnnotation：丢弃未知字段，note 超长截断到 2000 字', () => {
  const result = normalizeAnnotation({
    selector: '.card',
    note: 'x'.repeat(2500),
    evil: 'should be dropped',
  })

  assert.equal(result.ok, true)
  assert.equal(result.value.note.length, 2000)
  assert.equal(result.value.evil, undefined)
})

// ---------------------------------------------------------------- jsonl 行

test('formatAnnotationLine：产出的单行能被 JSON.parse 原样还原', () => {
  const note = {
    id: 'a1',
    ts: 1700000000000,
    selector: '.card',
    note: '换成深色',
  }

  const line = formatAnnotationLine(note)

  assert.equal(line.includes('\n'), false)
  assert.deepEqual(JSON.parse(line), note)
})
