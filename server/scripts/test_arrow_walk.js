import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function testArrowWalk() {
  console.log('Testing ArrowRight walk on Instagram post modal...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1280,900']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('Going to first post...');
    await page.goto('https://www.instagram.com/nikah_bahrain/p/DdJ--fXIzM-/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    for (let i = 0; i < 5; i++) {
      const data = await page.evaluate(() => {
        const url = window.location.href;
        const img = document.querySelector('article img, div[role="dialog"] img, main img');
        const alt = img ? img.getAttribute('alt') : null;
        const src = img ? img.src : null;
        return { url, hasAlt: !!alt, altLength: alt ? alt.length : 0, altPreview: alt ? alt.substring(0, 80) : '' };
      });
      console.log(`Step ${i + 1}:`, data);

      await page.keyboard.press('ArrowRight');
      await new Promise(r => setTimeout(r, 1500));
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await browser.close();
  }
}

testArrowWalk();
