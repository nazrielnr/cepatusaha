import assert from 'node:assert/strict'

let seq = 0
let applied = []
async function refreshPreview(fetchFiles, onPreviewRefresh) {
  const current = ++seq
  const files = await fetchFiles()
  if (current === seq) onPreviewRefresh(files)
}

const slow = refreshPreview(() => new Promise((r) => setTimeout(() => r(['old']), 20)), (files) => applied.push(files))
const fast = refreshPreview(() => Promise.resolve(['new']), (files) => applied.push(files))
await Promise.all([slow, fast])

assert.deepEqual(applied, [['new']])
console.log('preview refresh race ok')
