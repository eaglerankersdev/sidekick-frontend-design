// Execute with a Playwright page against the production build on port 3000.
async page => {
  const assert = (ok, message) => { if (!ok) throw new Error(message); };
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const base = 'http://127.0.0.1:3000';
  for (const [width, height] of [[320,568],[375,667],[390,844],[768,1024],[900,900]]) {
    await page.setViewportSize({width,height});
    await page.emulateMedia({reducedMotion:'no-preference'});
    await page.goto(base);
    const root = page.locator('[data-workflow-journey]');
    await page.waitForFunction(() => document.querySelector('[data-workflow-journey]')?.dataset.mobileScroll === 'true');
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);
    const layout = await root.evaluate(el => ({top:el.getBoundingClientRect().top+scrollY, width:el.clientWidth, offset:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h'))+12}));
    for (const i of [0,1,2,3,4,5,6,3,0]) {
      await page.evaluate(({layout,i}) => scrollTo(0, layout.top-layout.offset+Math.min(layout.width,300)*i), {layout,i});
      await page.waitForTimeout(120);
      const box = await page.locator('[data-workflow-card]').nth(i).boundingBox();
      assert(box.x >= 0 && box.x+box.width <= width+1, `${width}: card ${i} horizontally clipped`);
      assert(box.y >= layout.offset && box.y+box.height <= height, `${width}: card ${i} vertically clipped`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth+1), `${width}: page overflow`);
    }
    await page.evaluate(layout => scrollTo(0,layout.top+3000),layout);
    assert((await root.boundingBox()).y < 0, 'Cannot scroll beyond workflow');
  }
  await page.setViewportSize({width:844,height:390});
  await page.goto(base);
  await page.waitForTimeout(500);
  assert(await page.locator('[data-mobile-scroll]').count()===0,'Short landscape must use readable static cards');
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(base);
  await page.waitForTimeout(400);
  assert(await page.locator('[data-mobile-scroll]').count()===0,'Reduced motion must not pin');
  const cards=await page.locator('[data-workflow-card]').all();
  let bottom=-1;
  for(const card of cards){const b=await card.boundingBox();assert(b.y>bottom,'Static cards overlap');bottom=b.y+b.height;}
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.setViewportSize({width:1440,height:900});
  await page.goto(base);await page.waitForTimeout(500);
  assert(await page.locator('[data-mobile-scroll]').count()===0,'Desktop must retain original layout');
  assert(await page.locator('[class*="_stageInner"]').isVisible(),'Desktop visual missing');
  await page.setViewportSize({width:320,height:568});await page.waitForTimeout(400);
  assert(await page.locator('[data-mobile-scroll]').count()===1,'Resize to mobile did not activate');
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(150);
  assert(await page.locator('[data-mobile-scroll]').count()===0,'Live reduced-motion change did not clean up');
  assert(errors.length===0,errors.join('\n'));
}
