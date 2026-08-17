import assert from 'node:assert/strict'

function getDomPath(el) {
  const path = []
  let cur = el
  while (cur?.parentElement && cur !== cur.ownerDocument.body) {
    path.unshift(Array.prototype.indexOf.call(cur.parentElement.children, cur))
    cur = cur.parentElement
  }
  return path.join('/')
}

function getElementByDomPath(doc, path) {
  let cur = doc.body
  for (const part of path.split('/').filter(Boolean)) cur = cur?.children[Number(part)] ?? null
  return cur
}

function rgbToHex(value) {
  if (!value || value === 'transparent' || value === 'rgba(0, 0, 0, 0)') return '#000000'
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  return match ? `#${[match[1], match[2], match[3]].map(v => Number(v).toString(16).padStart(2, '0')).join('')}`.toUpperCase() : value.toUpperCase()
}

class El {
  constructor(tag) { this.tagName = tag; this.children = []; this.parentElement = null; this.ownerDocument = null }
  append(...els) { els.forEach(el => { el.parentElement = this; el.ownerDocument = this.ownerDocument; this.children.push(el) }) }
}
const doc = { body: new El('BODY') }
doc.body.ownerDocument = doc
const a = new El('DIV'), b = new El('DIV'), c = new El('SPAN')
doc.body.append(a, b); b.append(c)
assert.equal(getDomPath(c), '1/0')
assert.equal(getElementByDomPath(doc, '1/0'), c)
assert.equal(rgbToHex('rgb(17, 24, 39)'), '#111827')
assert.equal(rgbToHex('rgba(0, 0, 0, 0)'), '#000000')
console.log('canvasEditorDom ok')
