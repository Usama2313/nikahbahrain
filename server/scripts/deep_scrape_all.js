import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseProfileFromAltText } from './sync_live_instagram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profilesFilePath = path.join(__dirname, '..', 'data', 'profiles.json');

async function deepScrapeAllPosts() {
  console.log('[Deep Scrape] Launching Chrome headless...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas', '--no-first-run', '--no-zygote',
      '--disable-gpu', '--window-size=1280,900'
    ]
  });

  const postsMap = new Map();

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

    console.log('[Deep Scrape] Navigating to @nikah_bahrain profile...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 35000
    });

    // Dismiss any popups
    await page.evaluate(() => {
      document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
    });
    await new Promise(r => setTimeout(r, 2000));

    // Phase 1: Scroll the profile grid to collect all post links + alt text
    let noNewCount = 0;
    let scrollAttempts = 0;
    const maxScrolls = 40;

    while (scrollAttempts < maxScrolls && noNewCount < 6) {
      const found = await page.evaluate(() => {
        const results = [];
        document.querySelectorAll('a[href*="/p/"]').forEach(a => {
          const href = a.getAttribute('href');
          const img = a.querySelector('img');
          if (!href || !img) return;
          const shortcodeMatch = href.match(/\/p\/([^\/]+)/);
          const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
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
      console.log(`[Deep Scrape] Grid scroll ${scrollAttempts + 1}: ${postsMap.size} posts collected...`);

      await page.evaluate(() => window.scrollBy(0, 1200));
      await new Promise(r => setTimeout(r, 2500));
      scrollAttempts++;
    }

    console.log(`[Deep Scrape] Phase 1 complete. Grid posts: ${postsMap.size}`);

    // Phase 2: For posts where alt text is very short/generic, visit the post page to get better alt
    const posts = Array.from(postsMap.values());
    let enriched = 0;
    for (const post of posts) {
      // Only visit if we got poor alt text from the grid
      if (post.alt.length < 100 && post.shortcode) {
        try {
          await page.goto(post.url, { waitUntil: 'networkidle2', timeout: 20000 });
          await page.evaluate(() => {
            document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
          });
          await new Promise(r => setTimeout(r, 1500));

          const postData = await page.evaluate(() => {
            // Find the main post image with longest alt (the flyer text)
            const images = Array.from(document.querySelectorAll('article img, main img, div[role="presentation"] img'));
            let bestAlt = '';
            let bestSrc = '';
            for (const img of images) {
              const alt = img.getAttribute('alt') || '';
              if (alt.length > bestAlt.length) {
                bestAlt = alt;
                bestSrc = img.src || img.getAttribute('src') || '';
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
        } catch (e) {
          console.warn(`[Deep Scrape] Failed to enrich ${post.shortcode}:`, e.message);
        }
      }
    }

    console.log(`[Deep Scrape] Phase 2 complete. Enriched ${enriched} posts with full alt text.`);

    // Parse into structured profiles
    const parsedProfiles = posts.map(parseProfileFromAltText);
    console.log(`[Deep Scrape] Parsed ${parsedProfiles.length} profiles from Instagram flyers.`);

    // Save to profiles.json - ONLY real Instagram data, no mock
    fs.writeFileSync(profilesFilePath, JSON.stringify(parsedProfiles, null, 2), 'utf8');
    console.log(`[Deep Scrape] ✅ Saved ${parsedProfiles.length} 100% live Instagram profiles to profiles.json!`);

    return parsedProfiles;
  } finally {
    await browser.close();
  }
}

deepScrapeAllPosts().then(profiles => {
  console.log('\n=== FINAL SUMMARY ===');
  console.log(`Total live Instagram profiles: ${profiles.length}`);
  const cats = {};
  profiles.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });
  console.log('By category:', cats);
}).catch(console.error);
