import assert from 'node:assert/strict'
import { BUSINESS_PROMPT_TEMPLATES, PROMPT_CATEGORIES } from './promptTemplates.ts'

// Verify categories
assert.ok(PROMPT_CATEGORIES.length >= 8, 'Categories should contain at least 8 items')
assert.ok(PROMPT_CATEGORIES.includes('Semua'), 'Should include category Semua')

// Verify templates
assert.ok(BUSINESS_PROMPT_TEMPLATES.length >= 15, 'Should contain at least 15 business prompt templates')

for (const tpl of BUSINESS_PROMPT_TEMPLATES) {
  assert.ok(tpl.id, `Template must have id: ${JSON.stringify(tpl)}`)
  assert.ok(tpl.title && tpl.title.trim().length > 0, `Template ${tpl.id} must have title`)
  assert.ok(tpl.suitableFor && tpl.suitableFor.trim().length > 0, `Template ${tpl.id} must have suitableFor`)
  assert.ok(tpl.description && tpl.description.trim().length > 0, `Template ${tpl.id} must have description`)
  assert.ok(tpl.prompt && tpl.prompt.trim().length > 10, `Template ${tpl.id} must have substantial prompt`)
  assert.ok(
    PROMPT_CATEGORIES.includes(tpl.category),
    `Template ${tpl.id} has category ${tpl.category} which is not in PROMPT_CATEGORIES`
  )
}

console.log(`Prompt templates validation passed! Total templates: ${BUSINESS_PROMPT_TEMPLATES.length}`)
