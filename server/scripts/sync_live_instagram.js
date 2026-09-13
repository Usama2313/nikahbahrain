import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

import { parseProfileFromAltText } from './parse_profile.js';
export { parseProfileFromAltText };


export async function syncLiveInstagramPosts(targetCount = 50) {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error('Local Chrome browser binary not found in this cloud environment. Run live sync on your local machine using "npm run sync-ig" and push the updated profiles.');
  }

  console.log(`[Instagram Sync] Connecting to @nikah_bahrain via Chrome...`);

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

    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 35000
    });

    // Dismiss dialogs
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const btn of closeButtons) {
        if (btn.innerText.includes('Close') || btn.querySelector('svg[aria-label="Close"]')) {
          btn.click();
        }
      }
      document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
    });

    await new Promise((r) => setTimeout(r, 2000));

    const postsMap = new Map();
    let noNewCount = 0;
    let scrollAttempts = 0;
    const maxScrolls = 25;

    while (postsMap.size < targetCount && scrollAttempts < maxScrolls && noNewCount < 5) {
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

      const prevSize = postsMap.size;
      for (const p of currentPosts) {
        if (p.shortcode && !postsMap.has(p.shortcode)) {
          postsMap.set(p.shortcode, p);
        }
      }

      if (postsMap.size === prevSize) {
        noNewCount++;
      } else {
        noNewCount = 0;
      }

      console.log(`[Instagram Sync] Gathered ${postsMap.size} posts...`);
      if (postsMap.size >= targetCount) break;

      // Scroll down and wait
      await page.evaluate(() => window.scrollBy(0, 1200));
      await new Promise((r) => setTimeout(r, 2500));
      scrollAttempts++;
    }

    const rawPosts = Array.from(postsMap.values());
    console.log(`[Instagram Sync] Completed extraction of ${rawPosts.length} posts from Instagram feed!`);

    // Parse posts into structured profiles
    const parsedProfiles = rawPosts.map(parseProfileFromAltText);

    // Merge with existing profiles or update
    const profilesFilePath = path.join(__dirname, '..', 'data', 'profiles.json');
    let existing = [];
    if (fs.existsSync(profilesFilePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(profilesFilePath, 'utf8'));
      } catch (e) {
        existing = [];
      }
    }

    // Index existing by instagramPostId or id
    const mergedMap = new Map();
    // Put newly fetched live Instagram profiles first
    for (const p of parsedProfiles) {
      mergedMap.set(p.instagramPostId || p.id, p);
    }
    // Keep any existing profiles not replaced
    for (const p of existing) {
      const key = p.instagramPostId || p.id;
      if (!mergedMap.has(key)) {
        mergedMap.set(key, p);
      }
    }

    const finalProfiles = Array.from(mergedMap.values());
    fs.writeFileSync(profilesFilePath, JSON.stringify(finalProfiles, null, 2), 'utf8');

    console.log(`[Instagram Sync] Successfully saved ${finalProfiles.length} profiles (${parsedProfiles.length} freshly fetched from Instagram) to ${profilesFilePath}!`);

    return {
      success: true,
      freshlyFetched: parsedProfiles.length,
      totalProfiles: finalProfiles.length,
      profiles: parsedProfiles
    };
  } finally {
    await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncLiveInstagramPosts(30).then((res) => {
    console.log('Sync result summary:', {
      freshlyFetched: res.freshlyFetched,
      totalProfiles: res.totalProfiles,
      firstProfile: res.profiles[0]
    });
  }).catch(console.error);
}
