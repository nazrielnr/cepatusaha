import { expect, test } from '@playwright/test'

const realHtml = `<!DOCTYPE html>
<html>
<head>
<style>
  body { margin: 0; font-family: Inter, system-ui, sans-serif; color: rgb(17,24,39); }
  .hero { padding: 48px; background: rgb(249,250,251); }
  .title { font-size: 40px; font-weight: 700; text-align: left; }
  .card { padding: 24px; border-radius: 16px; background: white; }
  img.hero-img { width: 320px; border-radius: 12px; }
</style>
</head>
<body>
  <main class="hero">
    <h1 class="title">Original Headline</h1>
    <p class="copy">Original paragraph</p>
    <section class="card"><button>Buy Now</button></section>
    <img class="hero-img" src="/old.png" alt="Old alt">
    <h1 class="title">Duplicate Headline</h1>
  </main>
</body>
</html>`

async function mount(page) {
  await page.goto('/empty.html').catch(async () => page.setContent('<div id="root"></div>'))
  await page.setContent(`<iframe id="preview" sandbox="allow-same-origin allow-scripts" style="width:900px;height:700px;border:0"></iframe>`)
  await page.locator('#preview').evaluate((iframe: HTMLIFrameElement, html) => { iframe.srcdoc = html as string }, realHtml)
  const frame = page.frameLocator('#preview')
  await expect(frame.locator('h1').first()).toBeVisible()
  await page.addScriptTag({ path: 'src/utils/canvasEditorBridge.ts' }).catch(() => {})
}

test('bridge scans real iframe computed style + edits text/style/image + serializes clean', async ({ page }) => {
  await mount(page)
  const result = await page.locator('#preview').evaluate(async (iframe: HTMLIFrameElement) => {
    const mod = await import('/src/utils/canvasEditorBridge.ts')
    const doc = iframe.contentDocument!
    const events: any[] = []
    const bridge = mod.installCanvasEditorBridge(doc, { onSelect: s => events.push(['select', s?.tag, s?.text]) })

    const h1 = doc.querySelector('h1') as HTMLElement
    h1.click()
    const selected = bridge.getSelected()!
    bridge.applyPatch(selected.id, { text: 'Edited Headline', style: { color: '#FF0000', fontSize: '52px' } })
    const h1After = doc.querySelector('h1') as HTMLElement

    const section = doc.querySelector('section.card') as HTMLElement
    section.click()
    const card = bridge.getSelected()!
    bridge.applyPatch(card.id, { style: { backgroundColor: '#0000FF', padding: '32px' } })

    const img = doc.querySelector('img') as HTMLImageElement
    img.click()
    const image = bridge.getSelected()!
    bridge.applyPatch(image.id, { src: '/new.png', alt: 'New alt', style: { width: '240px' } })

    const duplicate = doc.querySelectorAll('h1')[1] as HTMLElement
    duplicate.click()
    const dup = bridge.getSelected()!
    bridge.applyPatch(dup.id, { text: 'Edited Duplicate' })

    const html = bridge.serialize()
    return {
      selected,
      h1Text: h1After.textContent,
      h1Color: getComputedStyle(h1After).color,
      h1Size: getComputedStyle(h1After).fontSize,
      cardBg: getComputedStyle(section).backgroundColor,
      cardPadding: getComputedStyle(section).padding,
      imgSrc: img.getAttribute('src'),
      imgAlt: img.getAttribute('alt'),
      imgWidth: getComputedStyle(img).width,
      dupText: duplicate.textContent,
      firstStill: h1After.textContent,
      clean: !html.includes('data-cu-editor-id') && !html.includes('__cu-editor') && !html.includes('cu-editor-style'),
      html,
      events,
    }
  })

  expect(result.selected.tag).toBe('H1')
  expect(result.selected.style.fontSize).toBe('40px')
  expect(result.h1Text).toBe('Edited Headline')
  expect(result.h1Color).toBe('rgb(255, 0, 0)')
  expect(result.h1Size).toBe('52px')
  expect(result.cardBg).toBe('rgb(0, 0, 255)')
  expect(result.cardPadding).toBe('32px')
  expect(result.imgSrc).toBe('/new.png')
  expect(result.imgAlt).toBe('New alt')
  expect(result.imgWidth).toBe('240px')
  expect(result.dupText).toBe('Edited Duplicate')
  expect(result.firstStill).toBe('Edited Headline')
  expect(result.clean).toBe(true)
})
