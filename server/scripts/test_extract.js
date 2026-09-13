import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SESSION_ID = '19237154023%3AapiqfqSKpEAIrB%3A9%3AAYlR5-MbafZxWOGKWYDIMjAc5tNFo8KxVRBiH006Pw';

async function testPost(shortcode) {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setCookie({
    name: 'sessionid',
    value: SESSION_ID,
    domain: '.instagram.com',
    path: '/',
    httpOnly: true,
    secure: true
  });

  const url = `https://www.instagram.com/p/${shortcode}/`;
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 25000 });
  await new Promise(r => setTimeout(r, 2000));

  const result = await page.evaluate(() => {
    // 1. Check all img tags
    const imgs = Array.from(document.querySelectorAll('img')).map(i => ({
      alt: i.getAttribute('alt') || '',
      src: i.src || ''
    })).filter(i => i.alt.length > 50);

    // 2. Check HTML for accessibility_caption
    const html = document.documentElement.innerHTML;
    const matches = [];
    const regex = /"accessibility_caption"\s*:\s*"([^"]+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      matches.push(match[1]);
    }

    return { imgs, accessibilityCaptions: matches };
  });

  console.log('Result for', shortcode, ':', JSON.stringify(result, null, 2));
  await browser.close();
}

testPost('DdGnXuiogDy').catch(console.error);
