// Playwright callback; run against the local production server.
async page => {
  const base = 'http://127.0.0.1:3000';
  for (const width of [320, 375, 390, 440, 600, 768, 1440]) {
    await page.setViewportSize({width, height: width === 320 ? 568 : 667});
    await page.goto(base);
    const pet = page.getByRole('button', {name: 'Say hello to SideKick', exact: true});
    await pet.waitFor();
    const bounds = await pet.boundingBox();
    if (width <= 600) {
      const height = width === 320 ? 568 : 667;
      if (bounds.width !== 60 || Math.abs(bounds.x - (width - 68)) > 1 || Math.abs(bounds.y - (height - 68)) > 1) throw Error(`Incorrect mobile corner at ${width}`);
      await page.evaluate(() => window.scrollTo(0, 800));
      const scrolled = await pet.boundingBox();
      if (scrolled.y !== bounds.y) throw Error(`Pet moved while scrolling at ${width}`);
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
