import assert from 'node:assert/strict'

const textTags = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'A', 'BUTTON', 'LI', 'LABEL', 'TD', 'TH'])
const boxTags = new Set(['DIV', 'SECTION', 'ARTICLE', 'ASIDE', 'HEADER', 'FOOTER', 'NAV', 'MAIN', 'FORM'])
function applyElementDraft(el, next, base) {
  if (!el) return
  const changed = key => next[key] !== base[key]
  if (textTags.has(el.tagName) && changed('text')) el.textContent = next.text
  if (el instanceof HTMLImageElement) {
    if (changed('src') && next.src) el.setAttribute('src', next.src)
    if (changed('alt')) el.setAttribute('alt', next.alt)
  }
  if (textTags.has(el.tagName)) {
    if (changed('fontFamily')) el.style.fontFamily = next.fontFamily
    if (changed('fontSize')) el.style.fontSize = next.fontSize
    if (changed('fontWeight')) el.style.fontWeight = next.fontWeight
    if (changed('color')) el.style.color = next.color
    if (changed('textAlign')) el.style.textAlign = next.textAlign
  }
  if (boxTags.has(el.tagName) || el instanceof HTMLImageElement || textTags.has(el.tagName)) {
    if (changed('backgroundColor')) el.style.backgroundColor = next.backgroundColor || ''
    if (changed('borderRadius')) el.style.borderRadius = next.borderRadius
    if (changed('padding')) el.style.padding = next.padding
  }
  if (el instanceof HTMLImageElement && changed('width')) el.style.width = next.width
}

class Style { cssText() { return Object.entries(this).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`).join(';') } }
class El { constructor(tag) { this.tagName = tag; this.style = new Style(); this.attrs = {}; this.textContent = '' } setAttribute(k, v) { this.attrs[k] = v } getAttribute(k) { return this.attrs[k] } }
globalThis.HTMLImageElement = class HTMLImageElement extends El { constructor() { super('IMG') } }
const base = { text:'Hello', src:'a.png', alt:'A', fontFamily:'Inter', fontSize:'20px', fontWeight:'400', color:'#111111', backgroundColor:'', textAlign:'left', borderRadius:'0px', padding:'0px', width:'100px' }

const h1 = new El('H1'); h1.textContent = 'Hello'
applyElementDraft(h1, { ...base, text:'Hi', color:'#FF0000' }, base)
assert.equal(h1.textContent, 'Hi')
assert.equal(h1.style.color, '#FF0000')
assert.equal(h1.style.fontSize, undefined, 'unchanged computed fontSize must not be serialized')

const card = new El('SECTION')
applyElementDraft(card, { ...base, backgroundColor:'#FFFFFF', padding:'24px' }, base)
assert.equal(card.style.backgroundColor, '#FFFFFF')
assert.equal(card.style.padding, '24px')
assert.equal(card.style.color, undefined, 'box must not get text color')

const img = new HTMLImageElement(); img.setAttribute('src', 'a.png')
applyElementDraft(img, { ...base, src:'b.png', alt:'B', width:'240px' }, base)
assert.equal(img.getAttribute('src'), 'b.png')
assert.equal(img.getAttribute('alt'), 'B')
assert.equal(img.style.width, '240px')

console.log('canvasEditorCore ok')
