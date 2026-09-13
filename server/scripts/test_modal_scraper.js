import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SESSION_ID = '19237154023%3AapiqfqSKpEAIrB%3A9%3AAYlR5-MbafZxWOGKWYDIMjAc5tNFo8KxVRBiH006Pw';

async function testModalScrape() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setCookie({
    name: 'sessionid',
    value: SESSION_ID,
    domain: '.instagram.com',
    path: '/',
    httpOnly: true,
    secure: true
  });

  console.log('Loading profile page...');
  await page.goto('https://www.instagram.com/nikah_bahrain/', { waitUntil: 'networkidle2', timeout: 35000 });
  await new Promise(r => setTimeout(r, 2000));

  // Find first post link and click it
  console.log('Clicking first post...');
  const firstPost = await page.$('a[href*="/p/"]');
  if (!firstPost) {
    console.error('No post found on grid!');
    await browser.close();
    return;
  }
  await firstPost.click();
  await new Promise(r => setTimeout(r, 2500));

  for (let i = 0; i < 5; i++) {
    const postInfo = await page.evaluate(() => {
      const url = window.location.href;
      const dialog = document.querySelector('div[role="dialog"]');
      if (!dialog) return { url, error: 'no dialog' };

      // Find all images inside dialog
      const imgs = Array.from(dialog.querySelectorAll('img')).map(img => ({
        src: img.src,
        alt: img.getAttribute('alt') || ''
      }));

      // Find captions / text inside dialog
      const text = dialog.innerText;

      return {
        url,
        imgs,
        textSnippet: text.slice(0, 200)
      };
    });

    console.log(`\n--- Post ${i + 1} ---`);
    console.log('URL:', postInfo.url);
    if (postInfo.imgs) {
      for (const img of postInfo.imgs) {
        if (img.alt.length > 30) {
          console.log('Image Alt:', img.alt.slice(0, 150) + '...');
        }
      }
    }

    // Press ArrowRight to go to next post
    await page.keyboard.press('ArrowRight');
    await new Promise(r => setTimeout(r, 1500));
  }

  await browser.close();
}

testModalScrape().catch(console.error);
