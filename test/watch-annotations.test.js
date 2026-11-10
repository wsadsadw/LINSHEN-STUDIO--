import { test } from 'node:test'
import assert from 'node:assert/strict'

import { extractNew } from '../tools/watch-annotations.mjs'

test('extractNew：空内容返回空结果', () => {
  assert.deepEqual(extractNew('', 0), { items: [], nextCursor: 0, errors: [] })
})

test('extractNew：两行完整批注全部返回，游标推到末尾', () => {
  const text = '{"a":1}\n{"a":2}\n'

  const result = extractNew(text, 0)

  assert.deepEqual(result.items, [{ a: 1 }, { a: 2 }])
  assert.equal(result.nextCursor, text.length)
})

test('extractNew：从游标处只取新增行', () => {
  const first = '{"a":1}\n'
  const text = `${first}{"a":2}\n`

  const result = extractNew(text, first.length)

  assert.deepEqual(result.items, [{ a: 2 }])
})

test('extractNew：末尾没有换行的半行不算数，游标停在它之前', () => {
  const complete = '{"a":1}\n'
  const text = `${complete}{"a":2}`

  const result = extractNew(text, 0)

  assert.deepEqual(result.items, [{ a: 1 }])
  assert.equal(result.nextCursor, complete.length)
})

test('extractNew：坏 JSON 记进 errors 并跳过，不影响其它行', () => {
  const text = '{"a":1}\nnot-json\n\n{"a":3}\n'

  const result = extractNew(text, 0)

  assert.deepEqual(result.items, [{ a: 1 }, { a: 3 }])
  assert.equal(result.errors.length, 1)
  assert.match(result.errors[0], /not-json/)
  assert.equal(result.nextCursor, text.length)
})

test('extractNew：文件被截短时游标失效，从头重读', () => {
  const text = '{"a":9}\n'

  const result = extractNew(text, 999)

  assert.deepEqual(result.items, [{ a: 9 }])
  assert.equal(result.nextCursor, text.length)
})
