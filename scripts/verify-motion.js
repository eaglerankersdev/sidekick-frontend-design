// playwright-cli -s=sidekick run-code --filename=scripts/verify-motion.js
async page => {
  const failures = [], errors = [];
  const check = (condition, message) => { if (!condition) failures.push(message); };
  page.on('pageerror', error => errors.push(error.message));
  const base = 'http://127.0.0.1:3000';
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.setViewportSize({width: 1440, height: 960});
  await page.goto(base + '/features');
  const columns = await page.locator('.grid--4').first().evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length);
  check(columns === 4, 'Feature cards exceed their four-column layout');
  for (const slug of ['pressure-washing', 'concrete-sealing', 'towing', 'junk-removal', 'painting']) {
    await page.goto(base + '/industries/' + slug);
    const panels = page.locator('[class*="_stack"]').first().locator(':scope > *');
    const first = await panels.nth(0).boundingBox(), second = await panels.nth(1).boundingBox();
    check(first.y + first.height <= second.y || first.x + first.width <= second.x, slug + ': hero previews overlap');
    const kpis = page.locator('aside [class*="_kpis"]').last();
    check(await kpis.evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length) === 2, slug + ': narrow dashboard did not adapt to its container');
  }
  await page.setViewportSize({width: 390, height: 844});
  await page.goto(base + '/privacy');
  const toc = await page.getByRole('navigation', {name: 'Privacy Policy sections'}).boundingBox();
  const firstSection = await page.locator('article > div section').first().boundingBox();
  check(toc.y + toc.height < firstSection.y, 'Mobile contents appears after the article');

  await page.setViewportSize({width: 1440, height: 960});
  await page.goto(base + '/features/ai-mcp');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ok'));
  const visual = page.locator('[data-scroll-visual]').first();
  const transformBefore = await visual.evaluate(el => getComputedStyle(el).transform);
  await page.evaluate(() => window.scrollTo(0, 420));
  await page.waitForTimeout(1000);
  const transformAfter = await visual.evaluate(el => getComputedStyle(el).transform);
  check(transformAfter !== transformBefore, 'Desktop product visual does not respond to scrolling');
  const step = page.locator('[data-story-step]').first();
  await step.evaluate(el => window.scrollTo(0, scrollY + el.getBoundingClientRect().top - innerHeight * .45));
  await page.waitForTimeout(600);
  check(await step.evaluate(el => el.classList.contains('is-current')), 'Workflow step does not highlight at reading position');
  await page.emulateMedia({reducedMotion: 'reduce'});
  await page.waitForFunction(() => !document.documentElement.classList.contains('motion-ok'));
  check(await visual.evaluate(el => getComputedStyle(el).transform) === 'none', 'Reduced-motion visual still has a transform');
  check(await step.evaluate(el => !el.classList.contains('is-current')), 'Reduced-motion step highlight did not clean up');
  await page.emulateMedia({reducedMotion: 'no-preference'});
  await page.waitForFunction(() => document.documentElement.classList.contains('motion-ok'));
  // Client navigation must clean up old triggers and reveal the new route.
  await page.locator('main').getByRole('link', {name: 'All features', exact: true}).click();
  await page.waitForURL(base + '/features');
  await page.setViewportSize({width: 390, height: 844});
  for (let y = 0; y < await page.evaluate(() => document.documentElement.scrollHeight); y += 600) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(80);
  }
  await page.waitForTimeout(650);
  const hidden = await page.locator('[data-reveal], [data-reveal-stagger] > *').evaluateAll(els => els.filter(el => el.getBoundingClientRect().height > 0 && Number(getComputedStyle(el).opacity) < .99).length);
  check(hidden === 0, 'Content remained hidden after a full mobile scroll: ' + hidden);
  check(errors.length === 0, 'Browser errors: ' + errors.join('; '));
  await page.evaluate(report => { window.__motionQA = report; }, {failures, errors, checks: 'Grid density, five industry preview pairs, narrow dashboard containers, mobile legal navigation, scroll drift, workflow highlight, live reduced-motion changes, client navigation and complete mobile reveals'});
  if (failures.length) throw new Error(failures.join('\n'));
}
