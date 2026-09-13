import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseProfileFromAltText } from './sync_live_instagram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profilesFilePath = path.join(__dirname, '..', 'data', 'profiles.json');

// Read session cookie from .env or arg
const SESSION_ID = process.argv[2] || process.env.IG_SESSION_ID || '';
const CSRF_TOKEN = process.argv[3] || process.env.IG_CSRF_TOKEN || '';

if (!SESSION_ID) {
  console.error('Usage: node deep_scrape_auth.js <sessionid> [csrftoken]');
  console.error('Get sessionid from: Chrome DevTools > Application > Cookies > instagram.com > sessionid');
  process.exit(1);
}

async function deepScrapeAuthenticated() {
  console.log('[Auth Scrape] Launching Chrome with Instagram session...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--window-size=1280,900'
    ]
  });

  const postsMap = new Map();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // Set Instagram session cookies BEFORE navigating
    await page.setCookie(
      { name: 'sessionid', value: SESSION_ID, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
      ...(CSRF_TOKEN ? [{ name: 'csrftoken', value: CSRF_TOKEN, domain: '.instagram.com', path: '/', secure: true }] : [])
    );

    console.log('[Auth Scrape] Session cookie set. Navigating to @nikah_bahrain...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 35000
    });

    await new Promise(r => setTimeout(r, 2500));

    // Verify we are logged in by checking for post count
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('[Auth Scrape] Page loaded. Contains "227":', pageText.includes('227'));

    // Phase 1: Scroll the full grid
    let noNewCount = 0;
    let scrollAttempts = 0;

    while (scrollAttempts < 60 && noNewCount < 8) {
      const found = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('a[href*="/p/"]').forEach(a => {
          const href = a.getAttribute('href');
          const img = a.querySelector('img');
          if (!href || !img) return;
          const m = href.match(/\/p\/([^\/]+)/);
          const shortcode = m ? m[1] : '';
          if (!shortcode) return;
          results.push({
            shortcode,
            url: `https://www.instagram.com/p/${shortcode}/`,
            imageUrl: img.src || img.getAttribute('src') || '',
            alt: img.getAttribute('alt') || ''
          });
        });
        return results;
      });

      const prevSize = postsMap.size;
      for (const p of found) {
        if (p.shortcode && !postsMap.has(p.shortcode)) {
          postsMap.set(p.shortcode, p);
        }
      }

      noNewCount = postsMap.size === prevSize ? noNewCount + 1 : 0;
      const progress = `[Auth Scrape] Scroll ${scrollAttempts + 1}: ${postsMap.size} posts collected`;
      console.log(progress);

      await page.evaluate(() => window.scrollBy(0, 1200));
      await new Promise(r => setTimeout(r, 2000));
      scrollAttempts++;
    }

    console.log(`\n[Auth Scrape] Phase 1 done. Total grid posts: ${postsMap.size}`);

    // Phase 2: Visit each post page for full alt text (flyer details)
    const posts = Array.from(postsMap.values());
    let enriched = 0;

    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      try {
        await page.goto(post.url, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1200));

        const postData = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('article img, main img'));
          let bestAlt = '', bestSrc = '';
          for (const img of images) {
            const alt = img.getAttribute('alt') || '';
            if (alt.length > bestAlt.length) {
              bestAlt = alt;
              bestSrc = img.src || '';
            }
          }
          return { alt: bestAlt, src: bestSrc };
        });

        if (postData.alt.length > post.alt.length) {
          post.alt = postData.alt;
          enriched++;
        }
        if (postData.src && postData.src.includes('cdninstagram')) {
          post.imageUrl = postData.src;
        }

        console.log(`[Auth Scrape] Enriched ${i + 1}/${posts.length}: ${post.shortcode} (alt: ${post.alt.length} chars)`);
      } catch (e) {
        console.warn(`[Auth Scrape] Skip ${post.shortcode}: ${e.message}`);
      }
    }

    console.log(`\n[Auth Scrape] Phase 2 done. Enriched ${enriched}/${posts.length} posts.`);

    // Parse and save
    const parsed = posts.map(parseProfileFromAltText);
    fs.writeFileSync(profilesFilePath, JSON.stringify(parsed, null, 2), 'utf8');

    console.log(`\n✅ [Auth Scrape] DONE! Saved ${parsed.length} live Instagram profiles.`);

    const cats = {};
    parsed.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
    console.log('By category:', cats);

    return parsed;
  } finally {
    await browser.close();
  }
}

deepScrapeAuthenticated().catch(console.error);
