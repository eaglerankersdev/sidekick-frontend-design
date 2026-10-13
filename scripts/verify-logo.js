// Run against the local server with playwright-cli run-code --filename=scripts/verify-logo.js.
async (page) => {
  for (const reducedMotion of ['reduce', 'no-preference']) {
    await page.emulateMedia({reducedMotion});
    for (const width of [390, 768, 1440]) {
      await page.setViewportSize({width, height: 900});
      await page.goto('http://127.0.0.1:3000/');
      const headerLogo = page.locator('header').getByRole('link', {name: 'SideKick CRM home', exact: true}).first();
      for (let repeat = 0; repeat < 2; repeat++) {
        await page.evaluate(() => window.scrollTo({top: 1600, behavior: 'instant'}));
        await headerLogo.click();
        await page.waitForFunction(() => scrollY === 0);
      }
      await page.locator('footer').getByRole('link', {name: 'SideKick CRM home', exact: true}).click();
      await page.waitForFunction(() => scrollY === 0);
      if (width < 1080) {
        await page.evaluate(() => window.scrollTo({top: 1600, behavior: 'instant'}));
        await page.getByRole('button', {name: 'Open menu', exact: true}).click();
        await page.getByRole('dialog', {name: 'Navigation menu'}).getByRole('link', {name: 'SideKick CRM home', exact: true}).click();
        await page.waitForFunction(() => scrollY === 0 && !document.querySelector('dialog[open]'));
      }
      await page.evaluate(() => window.scrollTo({top: 1600, behavior: 'instant'}));
      await headerLogo.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => scrollY === 0);
      await page.goto('http://127.0.0.1:3000/features/ai-mcp');
      await page.evaluate(() => window.scrollTo({top: 1600, behavior: 'instant'}));
      await headerLogo.click();
      await page.waitForURL('http://127.0.0.1:3000/');
      await page.waitForFunction(() => scrollY === 0);
    }
  }
  return 'Passed: repeated header, footer, mobile menu, keyboard, and cross-page logo navigation at 3 widths with normal and reduced motion.';
}
