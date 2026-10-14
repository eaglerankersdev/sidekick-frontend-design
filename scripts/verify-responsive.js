// Run against a production server with Playwright. Covers the responsive redesign.
async page => {
  const base = 'http://127.0.0.1:3000';
  const failures = [], errors = [];
  const check = (ok, message) => { if (!ok) failures.push(message); };
  page.on('pageerror', error => errors.push(error.message));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const width of [320, 375, 390, 600, 768, 900, 1024, 1079, 1080, 1440]) {
    const height = width === 320 ? 568 : width === 375 ? 667 : 900;
    await page.setViewportSize({ width, height });
    await page.goto(base);
    await page.evaluate(() => document.fonts.ready);
    const phone = page.locator('[class*="_heroPhone"]').first();
    check(await phone.isVisible() === (width >= 1080), `${width}: hero preview breakpoint`);
    const browser = await page.locator('[class*="_heroBrowser"]').first().boundingBox();
    const mascot = await page.locator('[class*="_heroBrowser"] [class*="_mascot"]').first().boundingBox();
    const copy = await page.locator(width <= 600 ? '[class*="_heroIntro"]' : '[class*="_heroCopy"]').first().boundingBox();
    check(mascot.y + mascot.height <= browser.y + 10, `${width}: mascot overlaps dashboard`);
    if (width <= 600) check(copy.y + copy.height <= mascot.y, `${width}: introduction must precede preview`);
    else if (width < 900) check(mascot.y >= copy.y + copy.height, `${width}: mascot overlaps hero copy`);
    check(browser.x >= 0 && browser.x + browser.width <= width, `${width}: preview clips horizontally`);
    if (width <= 600) {
      const controls = await page.locator('[class*="_heroControls"]').boundingBox();
      check(controls.y >= browser.y + browser.height, `${width}: actions must follow preview`);
      if (height <= 667) check(browser.y + browser.height <= height, `${width}: complete preview must fit initial screen`);
      const primary = await page.locator('[class*="_heroCopy"] a[href="/contact"]').boundingBox();
      check(primary.height >= 48 && primary.width >= copy.width - 1, `${width}: primary action is not comfortably tappable`);
    }
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const routes = ['/', '/features', '/features/ai-mcp', '/features/website-builder', '/features/quotes-proposals', '/features/jobs-scheduling', '/features/mobile-app', '/integrations', '/industries', '/industries/pressure-washing', '/industries/concrete-sealing', '/industries/towing', '/industries/junk-removal', '/industries/painting', '/pricing', '/white-label', '/about', '/contact', '/privacy', '/terms', '/cookies'];
  for (const width of [390, 768, 1024]) {
    await page.setViewportSize({width, height: 900});
    for (const route of routes) {
      await page.goto(base + route);
      await page.waitForFunction(() => document.documentElement.classList.contains('motion-ok'));
      for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += 700) {
        await page.evaluate(y => window.scrollTo(0, y), y);
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(500);
      const hidden = await page.locator('[data-reveal], [data-reveal-stagger] > *, [data-touch-reveal]').evaluateAll(els => els.filter(el => el.getBoundingClientRect().height > 0 && getComputedStyle(el).display !== 'none' && Number(getComputedStyle(el).opacity) < .99).length);
      check(hidden === 0, `${route} ${width}: ${hidden} unrevealed elements after scroll`);
      check(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), `${route} ${width}: horizontal overflow`);
    }
  }
  check(errors.length === 0, errors.join('; '));
  if (failures.length) throw new Error(failures.join('\n'));
}
