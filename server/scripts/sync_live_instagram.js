import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseProfileFromAltText } from './parse_profile.js';

export { parseProfileFromAltText };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export async function syncLiveInstagramPosts(targetCount = 25) {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome browser binary not found at ${CHROME_PATH}. Run live sync on your local machine using "npm run sync-ig".`);
  }

  console.log(`[Instagram Sync] Launching Chrome to connect to @nikah_bahrain...`);

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

    console.log('[Instagram Sync] Navigating to https://www.instagram.com/nikah_bahrain/...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 35000
    });

    // Dismiss any dialogs or login modals
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const btn of closeButtons) {
        if (btn.innerText.includes('Close') || btn.innerText.includes('Not Now') || btn.querySelector('svg[aria-label="Close"]')) {
          btn.click();
        }
      }
      document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    });

    await new Promise((r) => setTimeout(r, 2000));

    const postsMap = new Map();

    // Extract all posts present on feed
    const gridPosts = await page.evaluate(() => {
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

    for (const p of gridPosts) {
      if (p.shortcode && !postsMap.has(p.shortcode)) {
        postsMap.set(p.shortcode, p);
      }
    }

    console.log(`[Instagram Sync] Found ${postsMap.size} posts on feed.`);

    // For posts with generic/short alt-text (carousel posts), visit post page to retrieve detailed flyer
    const postsList = Array.from(postsMap.values());
    for (const p of postsList) {
      // If alt is generic (less than 120 chars or doesn't mention key terms)
      const isGeneric = p.alt.length < 120 || (!p.alt.includes('AGE') && !p.alt.includes('GROOM') && !p.alt.includes('BRIDE') && !p.alt.includes('NPF'));
      if (isGeneric && p.shortcode) {
        try {
          console.log(`[Instagram Sync] Enriching post ${p.shortcode} from post URL...`);
          await page.goto(p.url, { waitUntil: 'networkidle2', timeout: 25000 });
          await new Promise(r => setTimeout(r, 2000));

          const enriched = await page.evaluate(() => {
            const imgs = Array.from(document.querySelectorAll('article img, div[role="main"] img, img')).map(i => ({
              src: i.src,
              alt: i.getAttribute('alt') || ''
            })).filter(i => i.alt.length > 50 && !i.alt.includes('profile picture'));

            // Find best image with richest flyer text
            let bestImg = null;
            let maxLen = 0;
            for (const img of imgs) {
              if (img.alt.length > maxLen) {
                maxLen = img.alt.length;
                bestImg = img;
              }
            }

            const caption = document.querySelector('h1')?.innerText || document.querySelector('article span[dir="auto"]')?.innerText || '';
            return {
              flyerImg: bestImg ? bestImg.src : null,
              flyerAlt: bestImg ? bestImg.alt : null,
              caption
            };
          });

          if (enriched.flyerAlt) {
            p.alt = enriched.flyerAlt + (enriched.caption ? '\n' + enriched.caption : '');
            if (enriched.flyerImg) p.imageUrl = enriched.flyerImg;
            console.log(`[Instagram Sync] ✓ Enriched ${p.shortcode} with ${p.alt.length} chars of flyer data.`);
          }
        } catch (postErr) {
          console.warn(`[Instagram Sync] Could not enrich ${p.shortcode}:`, postErr.message);
        }
      }
    }

    const rawPosts = Array.from(postsMap.values());
    console.log(`[Instagram Sync] Completed extraction of ${rawPosts.length} posts!`);

    // Parse posts into structured profiles
    const parsedProfiles = rawPosts.map(parseProfileFromAltText);

    // Load existing profiles from server JSON file (local fallback)
    const serverFilePath = path.join(__dirname, '..', 'data', 'profiles.json');
    const clientFilePath = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');

    let existing = [];
    if (fs.existsSync(serverFilePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(serverFilePath, 'utf8'));
      } catch (e) { existing = []; }
    } else if (fs.existsSync(clientFilePath)) {
      try {
        existing = JSON.parse(fs.readFileSync(clientFilePath, 'utf8'));
      } catch (e) { existing = []; }
    }

    // Merge: Preserve all custom/admin created profiles at the top, then add Instagram posts
    const mergedMap = new Map();
    // 1. Keep all custom profiles (ones without instagramPostId or with NPF- id)
    for (const p of existing) {
      if (!p.instagramPostId) {
        mergedMap.set(p.id, p);
      }
    }
    // 2. Add freshly scraped Instagram posts
    for (const p of parsedProfiles) {
      mergedMap.set(p.instagramPostId || p.id, p);
    }
    // 3. Keep any existing Instagram posts not scraped this run
    for (const p of existing) {
      const key = p.instagramPostId || p.id;
      if (!mergedMap.has(key)) mergedMap.set(key, p);
    }

    const finalProfiles = Array.from(mergedMap.values());

    // Try to save via Supabase DB first, then fall back to local JSON
    try {
      const { dbUpsertProfiles } = await import('./db.js');
      await dbUpsertProfiles(finalProfiles);
      console.log(`[Instagram Sync] Saved ${finalProfiles.length} profiles to Supabase + local JSON`);
    } catch (dbErr) {
      console.warn('[Instagram Sync] DB upsert failed, saving to local JSON only:', dbErr.message);
      try {
        fs.writeFileSync(serverFilePath, JSON.stringify(finalProfiles, null, 2), 'utf8');
        console.log(`[Instagram Sync] Saved ${finalProfiles.length} profiles to ${serverFilePath}`);
      } catch (e) { console.error('Error writing server profiles.json:', e.message); }
      try {
        if (fs.existsSync(path.dirname(clientFilePath))) {
          fs.writeFileSync(clientFilePath, JSON.stringify(finalProfiles, null, 2), 'utf8');
          console.log(`[Instagram Sync] Saved ${finalProfiles.length} profiles to ${clientFilePath}`);
        }
      } catch (e) { console.error('Error writing client profiles.json:', e.message); }
    }

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
  syncLiveInstagramPosts(25).then((res) => {
    console.log('\n=============================================');
    console.log(`🎉 Instagram Sync Succeeded!`);
    console.log(`Freshly fetched: ${res.freshlyFetched}`);
    console.log(`Total database count: ${res.totalProfiles}`);
    console.log('Top 3 profiles:', res.profiles.slice(0, 3).map(p => `${p.id} (${p.name}) - ${p.profession}`));
    console.log('=============================================\n');
  }).catch((err) => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  });
}
