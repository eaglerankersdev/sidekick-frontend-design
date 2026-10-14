// Playwright callback: pointer focus stays clean; keyboard focus remains visible.
async page => {
  const base = 'http://127.0.0.1:3000';
  const outlined = locator => locator.evaluate(el => getComputedStyle(el).outlineStyle !== 'none' && parseFloat(getComputedStyle(el).outlineWidth) > 0);
  await page.setViewportSize({width: 375, height: 667});
  await page.goto(base);
  await page.getByRole('button', {name: 'Say hello to SideKick', exact: true}).waitFor();
  const burger = page.getByRole('button', {name: 'Open menu', exact: true});
  await burger.click();
  const close = page.getByRole('button', {name: 'Close menu', exact: true});
  if (await outlined(close)) throw Error('Automatically focused close button has pointer outline');
  const summary = page.getByRole('dialog').locator('summary').first();
  await summary.click();
  if (await outlined(summary)) throw Error('Tapped menu link has outline');
  await close.click();
  if (await outlined(burger)) throw Error('Restored menu trigger has pointer outline');
  await page.keyboard.press('Tab');
  await burger.focus();
  if (!await outlined(burger)) throw Error('Keyboard focus lost');
  await burger.press('Enter');
  if (!await outlined(close)) throw Error('Keyboard dialog focus lost');
  await page.keyboard.press('Escape');
  await page.setViewportSize({width: 1440, height: 900});
  const product = page.getByRole('button', {name: 'Product', exact: true});
  await product.click();
  if (await outlined(product)) throw Error('Clicked desktop navigation has outline');
  await page.keyboard.press('ArrowDown');
  const first = page.locator('#nav-product a').first();
  if (!await outlined(first)) throw Error('Keyboard submenu focus lost');
  await page.keyboard.press('Escape');
  const cta = page.locator('main a[href="/contact"]').first();
  await cta.dispatchEvent('pointerdown');
  await cta.focus();
  if (await outlined(cta)) throw Error('CTA has pointer outline');
}
