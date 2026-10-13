// Run with playwright-cli run-code --filename=scripts/verify-hero-mascot.js.
async (page) => {
  const base = 'http://127.0.0.1:3000';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({width: 1440, height: 1000});
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.goto(base);
  const mascot = page.getByRole('button', {name: 'Say hi to SideKick'});
  await mascot.waitFor();
  const dashboard = page.locator('[class*="heroBrowser"]');
  const original = await dashboard.boundingBox();
  const bounds = await mascot.boundingBox();
  const waitLook = (axis, sign) => page.waitForFunction(({axis, sign}) => {
    const value = Number(document.querySelector('[aria-label="Say hi to SideKick"]').style.getPropertyValue('--look-' + axis));
    return sign === 0 ? value === 0 : value * sign > .15;
  }, {axis, sign});
  for (const [x, y, axis, sign] of [[20,300,'x',-1], [1430,300,'x',1], [bounds.x+70,90,'y',-1], [bounds.x+70,900,'y',1]]) {
    await page.mouse.move(x, y);
    await waitLook(axis, sign);
  }
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[class*="HeroMascot"] [class*="head"]')).transform !== 'matrix(1, 0, 0, 1, 0, 0)');
  const after = await dashboard.boundingBox();
  if (JSON.stringify(original) !== JSON.stringify(after)) throw Error('Mascot shifted dashboard geometry');
  await mascot.hover();
  await page.waitForFunction(() => document.querySelector('[aria-label="Say hi to SideKick"]').dataset.greeting === 'true');
  const wave = await mascot.locator('[class*="hand"]').evaluate(el => getComputedStyle(el).animationName);
  if (wave === 'none') throw Error('Hover did not wave');
  await page.waitForFunction(() => document.querySelector('[aria-label="Say hi to SideKick"]').dataset.greeting === 'false');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.mouse.move(20,300);
  await waitLook('x',0);
  await mascot.focus();
  await page.keyboard.press('Enter');
  if (await mascot.getAttribute('data-greeting') !== 'true') throw Error('Keyboard greeting missing');
  if (await mascot.locator('[class*="hand"]').evaluate(el => getComputedStyle(el).animationName) !== 'none') throw Error('Reduced-motion wave still animates');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.mouse.move(40,300);
  await waitLook('x',0);
  for (const width of [320,390,768,1440,1920]) {
    await page.setViewportSize({width,height:1000});
    await mascot.scrollIntoViewIfNeeded();
    const box = await mascot.boundingBox();
    if (box.x < 0 || box.x + box.width > width) throw Error('Mascot clipped at ' + width);
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error('Overflow at ' + width);
  }
  const touch = await page.context().browser().newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile = await touch.newPage();
  await mobile.goto(base);
  const touchMascot = mobile.getByRole('button',{name:'Say hi to SideKick'});
  await touchMascot.tap();
  if (await touchMascot.getAttribute('data-greeting') !== 'true') throw Error('Touch greeting missing');
  await mobile.mouse.move(20,300);
  if (await touchMascot.evaluate(el => Number(el.style.getPropertyValue('--look-x'))) !== 0) throw Error('Coarse pointer triggered tracking');
  await touch.close();
  await page.goto(base + '/features');
  await page.mouse.move(20,300);
  if (errors.length) throw Error(errors.join('\n'));
  return 'Passed: four gaze directions, wide radius, head movement, wave, keyboard/touch greeting, reduced motion, offscreen reset, five widths, stable dashboard, route cleanup.';
}
