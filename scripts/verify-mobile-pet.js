// Playwright callback; run against the local production server.
async page => {
  const base = 'http://127.0.0.1:3000';
  const overlap = (a, b) => a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
  for (const width of [320, 375, 390, 440, 600, 768, 1440]) {
    await page.setViewportSize({width, height: width === 320 ? 568 : 667});
    await page.goto(base);
    const pet = page.getByRole('button', {name: 'Say hello to SideKick', exact: true});
    await pet.waitFor();
    const bounds = await pet.boundingBox();
    if (width <= 600) {
      const header = await page.locator('header').boundingBox();
      const menu = await page.getByRole('button', {name: 'Open menu', exact: true}).boundingBox();
      const logo = await page.locator('header a').first().boundingBox();
      if (bounds.width !== 48 || bounds.y + bounds.height > header.y + header.height || overlap(bounds, menu) || overlap(bounds, logo)) throw Error(`Obstructed navbar at ${width}`);
      await page.evaluate(() => window.scrollTo(0, 800));
      const scrolled = await pet.boundingBox();
      if (scrolled.y !== bounds.y) throw Error(`Pet left safe navbar slot at ${width}`);
      await page.mouse.move(scrolled.x + 24, scrolled.y + 24);
      await page.mouse.down();
      await page.mouse.move(100, 300, {steps: 10});
      await page.mouse.up();
      const dragged = await pet.boundingBox();
      if (dragged.y < 200) throw Error(`Dragging failed at ${width}`);
      await page.getByRole('button', {name: 'Open menu', exact: true}).click();
      if (await pet.isVisible()) throw Error(`Pet covers navigation dialog at ${width}`);
      await page.keyboard.press('Escape');
    } else if (bounds.width !== 100 || Math.abs(bounds.y - (667 - 100 - 80)) > 1) throw Error(`Desktop/tablet pet changed at ${width}`);
  }
}
