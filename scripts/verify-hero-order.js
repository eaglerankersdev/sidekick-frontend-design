// Playwright callback: mobile hero actions follow product previews without clipping.
async page => {
  const base = 'http://127.0.0.1:3000';
  const routes = ['/features', '/features/ai-mcp', '/features/website-builder', '/features/quotes-proposals', '/features/jobs-scheduling', '/features/mobile-app', '/industries', '/industries/pressure-washing', '/industries/concrete-sealing', '/industries/towing', '/industries/junk-removal', '/industries/painting', '/white-label', '/about'];
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const width of [320, 375, 390, 600]) {
    await page.setViewportSize({width, height: width === 320 ? 568 : 667});
    for (const route of routes) {
      await page.goto(base + route);
      const text = await page.locator('[class*="_heroText"]').boundingBox();
      const visual = await page.locator('[class*="_heroVisual"]').first().boundingBox();
      const actions = page.locator('[class*="_heroActions"]');
      const bounds = await actions.boundingBox();
      if (text.y + text.height > visual.y || visual.y + visual.height > bounds.y) throw Error(`${route} ${width}: incorrect hero order`);
      const buttons = actions.locator('a');
      for (const button of await buttons.all()) {
        await button.scrollIntoViewIfNeeded();
        const rect = await button.boundingBox();
        if (rect.height < 44 || rect.x < 0 || rect.x + rect.width > width) throw Error(`${route} ${width}: clipped or undersized action`);
      }
    }
  }
}
