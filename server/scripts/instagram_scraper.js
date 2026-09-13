import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export async function scrapeInstagramFeed(maxPosts = 24) {
  console.log('🚀 Starting Instagram scraper with Chrome:', CHROME_PATH);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--window-size=1280,900'
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('Navigating to https://www.instagram.com/nikah_bahrain/...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Close any login / cookie popup if present
    await page.evaluate(() => {
      // Close button with svg aria-label="Close"
      const closeButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const btn of closeButtons) {
        if (btn.innerText.includes('Close') || btn.querySelector('svg[aria-label="Close"]')) {
          btn.click();
        }
      }
      // Or remove modal dialog backdrops
      const dialogs = document.querySelectorAll('div[role="dialog"]');
      dialogs.forEach(d => d.remove());
    });

    await new Promise((r) => setTimeout(r, 2000));

    const postsMap = new Map();
    let scrollAttempts = 0;
    const maxScrolls = 6;

    while (postsMap.size < maxPosts && scrollAttempts < maxScrolls) {
      const currentPosts = await page.evaluate(() => {
        const results = [];
        const links = document.querySelectorAll('a[href*="/p/"]');
        links.forEach((a) => {
          const href = a.getAttribute('href');
          const img = a.querySelector('img');
          const src = img ? (img.getAttribute('src') || img.src) : null;
          const alt = img ? (img.getAttribute('alt') || '') : '';
          if (href && src) {
            const shortcodeMatch = href.match(/\/p\/([^\/]+)/);
            const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
            results.push({
              shortcode,
              url: `https://www.instagram.com/p/${shortcode}/`,
              imageUrl: src,
              alt
            });
          }
        });
        return results;
      });

      for (const p of currentPosts) {
        if (p.shortcode && !postsMap.has(p.shortcode)) {
          postsMap.set(p.shortcode, p);
        }
      }

      console.log(`Found ${postsMap.size} posts so far...`);
      if (postsMap.size >= maxPosts) break;

      await page.evaluate(() => window.scrollBy(0, 1000));
      await new Promise((r) => setTimeout(r, 2000));
      scrollAttempts++;
    }

    const posts = Array.from(postsMap.values());
    console.log(`Total collected posts from feed: ${posts.length}`);
    return posts;
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  scrapeInstagramFeed(12).then((posts) => {
    console.log('Result sample:', JSON.stringify(posts.slice(0, 3), null, 2));
  }).catch(console.error);
}
