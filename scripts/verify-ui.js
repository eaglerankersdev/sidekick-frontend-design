// Run with a local server: playwright-cli -s=sidekick run-code --filename=scripts/verify-ui.js
async (page) => {
  const base = 'http://127.0.0.1:3000';
  const widths = [320, 375, 390, 768, 1024, 1280, 1440, 1920];
  const routes = ['/', '/features', '/features/ai-mcp', '/features/website-builder', '/features/quotes-proposals', '/features/jobs-scheduling', '/features/mobile-app', '/integrations', '/industries', '/industries/pressure-washing', '/industries/concrete-sealing', '/industries/towing', '/industries/junk-removal', '/industries/painting', '/pricing', '/white-label', '/about', '/contact', '/privacy', '/terms', '/cookies'];
  const results = [];
  const errors = [];
  const failures = [];
  page.on('pageerror', e => errors.push(e.message));
  const check = (condition, message) => { if (!condition) failures.push(message); };
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const route of routes) {
    const response = await page.goto(base + route);
    check(response.status() === 200, route + ': HTTP ' + response.status());
    check(await page.getByRole('heading', {level: 1}).count() === 1, route + ': expected one H1');
    check(await page.locator('a[href="#login"]').count() === 0, route + ': placeholder login');
    for (const width of widths) {
      await page.setViewportSize({width, height: 900});
      const overflow = await page.evaluate(() => ({width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth}));
      check(overflow.scroll <= overflow.width + 1, route + ' at ' + width + ': horizontal overflow ' + JSON.stringify(overflow));
    }
    results.push({route, status: response.status(), widths: widths.length});
  }
  await page.goto(base);
  await page.setViewportSize({width: 1100, height: 900});
  const product = page.getByRole('button', {name: 'Product', exact: true});
  await product.click();
  await page.locator('#nav-product').waitFor({state: 'visible'});
  for (const name of ['Industries', 'Solutions', 'Product']) {
    await page.getByRole('button', {name, exact: true}).click();
    await page.locator('#nav-' + name.toLowerCase()).waitFor({state: 'visible'});
  }
  const bounds = await page.locator('#nav-product').boundingBox();
  check(bounds.x >= 0 && bounds.x + bounds.width <= 1100, 'Desktop dropdown is clipped');
  await page.locator('#nav-product a').first().focus();
  await page.keyboard.press('Escape');
  check(await product.evaluate(el => document.activeElement === el), 'Escape did not restore desktop trigger focus');
  await product.focus();
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => document.activeElement === document.querySelector('#nav-product a'));
  check(await page.locator('#nav-product a').first().evaluate(el => document.activeElement === el), 'ArrowDown did not enter menu');
  await page.keyboard.press('Escape');
  for (const viewport of [{width: 1100, height: 450}, {width: 1280, height: 400}]) {
    await page.setViewportSize(viewport);
    for (const name of ['Product', 'Industries', 'Solutions']) {
      await page.getByRole('button', {name, exact: true}).click();
      const panel = page.locator('#nav-' + name.toLowerCase() + ' > div');
      const panelBounds = await panel.boundingBox();
      check(panelBounds.y + panelBounds.height <= viewport.height, name + ': dropdown exceeds short viewport');
      await panel.locator('a').last().scrollIntoViewIfNeeded();
      const lastLink = await panel.locator('a').last().boundingBox();
      check(lastLink.y >= panelBounds.y && lastLink.y + lastLink.height <= viewport.height, name + ': final link unreachable in short viewport');
      await page.keyboard.press('Escape');
    }
  }
  await page.setViewportSize({width: 390, height: 844});
  await page.getByRole('button', {name: 'Open menu', exact: true}).click();
  const sheet = page.getByRole('dialog', {name: 'Navigation menu'});
  check(await sheet.isVisible(), 'Mobile dialog did not open');
  const sheetBounds = await sheet.boundingBox();
  check(Math.abs(sheetBounds.x) < 1 && Math.abs(sheetBounds.width - 390) < 1 && Math.abs(sheetBounds.height - 844) < 1, 'Mobile drawer does not fill viewport');
  const summary = sheet.locator('summary').first();
  await summary.focus();
  await page.keyboard.press('Tab');
  check(await sheet.locator('summary').nth(1).evaluate(el => document.activeElement === el), 'Collapsed mobile submenu leaked keyboard focus');
  await summary.click();
  await sheet.getByRole('link', {name: 'All Features', exact: false}).waitFor();
  await sheet.getByRole('link', {name: 'Book a Demo', exact: true}).scrollIntoViewIfNeeded();
  const closeBounds = await sheet.getByRole('button', {name: 'Close menu', exact: true}).boundingBox();
  check(closeBounds.y >= 0 && closeBounds.y + closeBounds.height <= 844, 'Expanded mobile menu scrolled its close button out of view');
  await page.keyboard.press('Escape');
  check(!await sheet.isVisible(), 'Escape did not dismiss mobile drawer');
  check(await page.getByRole('button', {name: 'Open menu', exact: true}).evaluate(el => document.activeElement === el), 'Mobile drawer did not restore focus');
  check(await page.evaluate(() => document.documentElement.style.overflow !== 'hidden'), 'Mobile drawer left scroll locked');
  await page.setViewportSize({width: 1440, height: 1000});
  check(!await page.locator('#workflow [class*=stage]').first().isVisible(), 'Reduced-motion workflow overlaps previews');
  const caption = await page.locator('[class*=heroLabel]').boundingBox();
  const card = await page.locator('[class*=heroState]').boundingBox();
  check(caption.y >= card.y + card.height || caption.x >= card.x + card.width, 'Hero status card overlaps preview caption');
  const mcp = page.locator('#mcp');
  await mcp.getByRole('button', {name: 'Your AI tool 1. Connect', exact: true}).focus();
  check(await mcp.getByText('Start with an MCP-compatible AI client.', {exact: false}).isVisible(), 'MCP keyboard explanation missing');
  await mcp.getByRole('button', {name: 'Your CRM 4. Use approved actions', exact: true}).click();
  check(await mcp.getByText('Only approved CRM services can respond.', {exact: false}).isVisible(), 'MCP click explanation missing');
  const industryTabs = page.getByRole('tablist', {name: 'Industries'});
  await industryTabs.getByRole('tab').first().focus();
  await page.keyboard.press('End');
  check(await industryTabs.getByRole('tab', {name: 'Painting', exact: true}).getAttribute('aria-selected') === 'true', 'Industry End key failed');
  await page.keyboard.press('Home');
  check(await industryTabs.getByRole('tab').first().getAttribute('aria-selected') === 'true', 'Industry Home key failed');
  await page.goto(base + '/white-label');
  const brands = page.getByRole('radiogroup', {name: 'Sample brand'}).first();
  await brands.getByRole('radio').first().focus();
  await page.keyboard.press('ArrowRight');
  check(await brands.getByRole('radio').nth(1).isChecked(), 'Sample brand keyboard selection failed');
  check(await page.locator('[class*=sideBrand]').first().innerText() === 'S\nSample brand A', 'Reseller brand not applied to CRM preview');
  await page.goto(base + '/contact');
  await page.waitForTimeout(2600); // Existing time-to-submit spam guard, not a page-readiness wait.
  await page.locator('form').getByRole('button', {name: 'Book a Demo', exact: true}).click();
  await page.getByText('Please fix the highlighted fields.').waitFor();
  check(await page.getByLabel('Your name', {exact: true}).getAttribute('aria-invalid') === 'true', 'Missing inline name error');
  check(await page.getByText('Please fix the highlighted fields.').evaluate(el => document.activeElement === el), 'Form error summary did not receive focus');
  check(errors.length === 0, 'Browser errors: ' + errors.join('; '));
  await page.evaluate(report => { window.__sidekickQA = report; }, {results, failures, errors, checks: '21 routes × 8 widths; navigation, MCP, industry tabs, brand radios, form errors, reduced motion'});
  if (failures.length) throw new Error(failures.join('\n'));
}
