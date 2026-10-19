import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  brandFromHtmlTitle,
  cleanAndSanitizeTitle,
  cleanFallbackPrompt,
  decodeHtmlEntities,
  isUsableTitle,
  truncateToWordBoundary,
} from '../src/features/sessions/title-utils.js'

// 1. HTML entities
assert.equal(decodeHtmlEntities('Hearth &amp; Press'), 'Hearth & Press')
assert.equal(decodeHtmlEntities('&quot;Hello&quot; &amp; &lt;World&gt;'), '"Hello" & <World>')

// 2. Quotes / labels / trailing punctuation
assert.equal(cleanAndSanitizeTitle('"Kopi Senja"'), 'Kopi Senja')
assert.equal(cleanAndSanitizeTitle('“Studio Foto Randai”'), 'Studio Foto Randai')
assert.equal(cleanAndSanitizeTitle('Title: Toko Sepatu Berkah'), 'Toko Sepatu Berkah')
assert.equal(cleanAndSanitizeTitle('Judul: Klinik Gigi Sehat.'), 'Klinik Gigi Sehat')
assert.equal(cleanAndSanitizeTitle('Website Kafe Senja'), 'Kafe Senja')
assert.equal(cleanAndSanitizeTitle('Kedai Kopi Kenangan.'), 'Kedai Kopi Kenangan')
assert.equal(cleanAndSanitizeTitle('Portofolio Fotografi -'), 'Portofolio Fotografi')

// 3. Empty AI output stays empty (caller decides the fallback; no silent "Proyek Baru")
assert.equal(cleanAndSanitizeTitle(''), '')
assert.equal(cleanAndSanitizeTitle('\n\n'), '')

// 4. Word-boundary truncation
assert.equal(truncateToWordBoundary('Website Kafe Kekinian (Specialty Co', 35), 'Website Kafe Kekinian')
assert.equal(truncateToWordBoundary('Kopi Kenangan [Draft Only', 25), 'Kopi Kenangan')
const longTitle = 'Super Long Website Title For An Amazing Modern Architecture Portfolio In Jakarta'
assert.ok(cleanAndSanitizeTitle(longTitle).length <= 36)

// 5. Prompt fallbacks
assert.equal(cleanFallbackPrompt('Website Kafe Kekinian (Specialty Coffee Shop) bergaya industrial-minimalis yang aesthetic'), 'Kafe Kekinian')
assert.equal(cleanFallbackPrompt('buatkan website toko kue lezat'), 'Toko Kue Lezat')
assert.equal(cleanFallbackPrompt('bikin landing page untuk klinik hewan sahabat'), 'Klinik Hewan Sahabat')

// 6. Regression: the raw brief that used to become the project title
const badBrief = 'matcha=18rb, coklat=18rb, ig=superyaki.id , 0831-1887-0701, buatkan website fnb, ada juga tayaki'
assert.equal(isUsableTitle(cleanFallbackPrompt(badBrief)), false)
assert.equal(isUsableTitle('Matcha=18rb, Coklat=18rb'), false)
assert.equal(isUsableTitle('Matcha 18rb'), false)
assert.equal(isUsableTitle('0831-1887-0701'), false)
assert.equal(isUsableTitle('Superyaki'), true)
assert.equal(isUsableTitle('Kafe Kekinian'), true)
assert.equal(isUsableTitle('Website Baru'), false)

// 7. Brand extraction from generated HTML <title>
assert.equal(brandFromHtmlTitle('Superyaki — Ikan Tahu Yaki & Minuman'), 'Superyaki')
assert.equal(brandFromHtmlTitle('Kopi Senja | Specialty Coffee'), 'Kopi Senja')
assert.equal(brandFromHtmlTitle('Crust &amp; Co Bakery'), 'Crust & Co Bakery')
assert.equal(brandFromHtmlTitle('Website Baru'), '')
assert.equal(brandFromHtmlTitle(''), '')

// 8. Flow guards in the service (source-level: the service imports the DB layer, which node cannot load directly)
const service = readFileSync(new URL('../src/features/sessions/title.service.ts', import.meta.url), 'utf8')
assert.match(service, /TITLE_MAX_TOKENS = 1500/, 'reasoning model needs a large max_tokens budget')
assert.match(service, /completion_already_done/, 'completion stage must be one-shot')
assert.match(service, /title_already_generated/, 'initial stage must be one-shot')
assert.match(service, /no_site_content/, 'completion must not run without generated HTML')
assert.doesNotMatch(service, /prompt\s*\?\s*`User request/, 'completion must not use the latest follow-up prompt')

console.log('title.test: all assertions passed')
