import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SESSION_ID = '19237154023%3AapiqfqSKpEAIrB%3A9%3AAYlR5-MbafZxWOGKWYDIMjAc5tNFo8KxVRBiH006Pw';

async function checkPage() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setCookie({
    name: 'sessionid',
    value: SESSION_ID,
    domain: '.instagram.com',
    path: '/',
    httpOnly: true,
    secure: true
  });

  await page.goto('https://www.instagram.com/p/DdGnXuiogDy/', { waitUntil: 'domcontentloaded', timeout: 20000 });
  await new Promise(r => setTimeout(r, 3000));

  const info = await page.evaluate(() => {
    return {
      title: document.title,
      url: window.location.href,
      imgCount: document.querySelectorAll('img').length,
      allAlts: Array.from(document.querySelectorAll('img')).map(i => i.alt),
      bodySnippet: document.body.innerText.slice(0, 300)
    };
  });

  console.log('INFO:', JSON.stringify(info, null, 2));
  await browser.close();
}

checkPage().catch(console.error);
