import { chromium } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(pathToFileURL(resolve('docs/08-presentation/K-SAFE-MVP-20261102.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.locator('.slide').evaluateAll(slides => slides.flatMap((slide, index) => slide.scrollHeight > slide.clientHeight || slide.scrollWidth > slide.clientWidth ? [index + 1] : []));
  if (overflow.length) throw new Error('Slide overflow: ' + overflow.join(','));
  await page.pdf({ path: 'docs/08-presentation/K-SAFE-MVP-20261102.pdf', printBackground: true, preferCSSPageSize: true });
  await page.locator('.slide').nth(7).screenshot({ path: 'artifacts/ai/slide-quality.png' });
  console.log(JSON.stringify({ slides: await page.locator('.slide').count(), overflow }));
} finally { await browser.close(); }
