import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseProfileFromAltText } from './parse_profile.js';

export { parseProfileFromAltText };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function syncLiveInstagramPosts(targetCount = 50) {
  if (!fs.existsSync(CHROME_PATH)) {
    throw new Error(`Chrome not found at ${CHROME_PATH}. Set CHROME_PATH env var or run on local machine.`);
  }

  console.log(`[Instagram Sync] Launching Chrome to scrape @nikah_bahrain (target: ${targetCount} posts)...`);

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
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    // ── Set Instagram session cookie if available (allows seeing ALL posts) ──
    const sessionId = process.env.INSTAGRAM_SESSION_ID;
    if (sessionId) {
      console.log('[Instagram Sync] Using Instagram session cookie for authenticated access...');
      await page.setCookie(
        { name: 'sessionid', value: sessionId, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
        { name: 'ig_did', value: process.env.INSTAGRAM_DID || '', domain: '.instagram.com', path: '/', secure: true },
        { name: 'csrftoken', value: process.env.INSTAGRAM_CSRF || '', domain: '.instagram.com', path: '/', secure: true }
      );
    } else {
      console.log('[Instagram Sync] No session cookie — scraping public feed (limited to ~12 posts visible)');
    }

    console.log('[Instagram Sync] Navigating to https://www.instagram.com/nikah_bahrain/ ...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    // Dismiss popups / login wall
    await dismissModals(page);
    await sleep(2000);

    // ── STEP 1: Scroll the grid to collect all post shortcodes ──────────────
    const postsMap = new Map();
    let scrollAttempts = 0;
    const maxScrolls = 30;
    let noNewStreak = 0;

    console.log('[Instagram Sync] Scrolling grid to collect all posts...');
    while (scrollAttempts < maxScrolls && noNewStreak < 5) {
      const found = await extractGridPosts(page);
      const prevSize = postsMap.size;

      for (const p of found) {
        if (p.shortcode && !postsMap.has(p.shortcode)) {
          postsMap.set(p.shortcode, p);
        }
      }

      if (postsMap.size === prevSize) {
        noNewStreak++;
      } else {
        noNewStreak = 0;
      }

      console.log(`[Instagram Sync] Grid scroll ${scrollAttempts + 1}: ${postsMap.size} posts found so far...`);

      if (postsMap.size >= targetCount) break;

      await page.evaluate(() => window.scrollBy(0, 1200));
      await sleep(2000);
      scrollAttempts++;
    }

    console.log(`[Instagram Sync] ✓ Collected ${postsMap.size} unique posts from grid.`);

    // ── STEP 2: Enrich each post by visiting post page to read caption ───────
    const postsList = Array.from(postsMap.values());
    let enriched = 0;

    for (const post of postsList) {
      try {
        const captionData = await fetchPostCaption(page, post.url);

        // Use caption if it's more informative than alt text
        if (captionData.caption && captionData.caption.length > 80) {
          const combined = captionData.caption + '\n' + post.alt;
          post.alt = combined;
        } else if (captionData.imgAlt && captionData.imgAlt.length > (post.alt?.length || 0)) {
          post.alt = captionData.imgAlt + '\n' + (captionData.caption || '');
        }

        // Use better quality image from post page if found
        if (captionData.imageUrl && captionData.imageUrl.length > 10) {
          post.imageUrl = captionData.imageUrl;
        }

        enriched++;
        console.log(`[Instagram Sync] ✓ [${enriched}/${postsList.length}] Enriched ${post.shortcode} (${post.alt.length} chars)`);
      } catch (err) {
        console.warn(`[Instagram Sync] Could not enrich ${post.shortcode}: ${err.message}`);
      }
    }

    // ── STEP 3: Parse posts into structured profile objects ──────────────────
    const parsedProfiles = postsList.map(parseProfileFromAltText);
    console.log(`[Instagram Sync] ✓ Parsed ${parsedProfiles.length} profiles from Instagram posts.`);

    // ── STEP 4: Load existing profiles and merge ─────────────────────────────
    const existing = loadExistingProfiles();

    // Merge strategy:
    // 1. Keep admin-created profiles (no instagramPostId, or NPF- IDs without shortcode)
    // 2. Update existing IG profiles with fresh data
    // 3. Add brand new IG profiles
    const mergedMap = new Map();

    // Preserve admin/manual profiles first
    for (const p of existing) {
      if (!p.instagramPostId || (p.id && p.id.startsWith('NPF-') && !p.instagramPostId.match(/^[A-Za-z0-9_-]{8,}$/))) {
        mergedMap.set(p.id, p);
      }
    }

    // Add/update with fresh Instagram data
    for (const p of parsedProfiles) {
      const key = p.instagramPostId || p.id;
      mergedMap.set(key, p);
    }

    // Preserve any existing Instagram profiles NOT scraped this run (older posts)
    for (const p of existing) {
      const key = p.instagramPostId || p.id;
      if (p.instagramPostId && !mergedMap.has(key)) {
        mergedMap.set(key, p);
      }
    }

    const finalProfiles = Array.from(mergedMap.values());
    console.log(`[Instagram Sync] ✓ Merged: ${finalProfiles.length} total profiles (${parsedProfiles.length} fresh IG + preserved existing).`);

    // ── STEP 5: Save to Supabase DB + local JSON ─────────────────────────────
    await saveProfiles(finalProfiles);

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function dismissModals(page) {
  try {
    await page.evaluate(() => {
      // Click any close / "Not Now" / "Cancel" buttons
      const candidates = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const btn of candidates) {
        const txt = (btn.innerText || '').toLowerCase();
        if (txt.includes('not now') || txt.includes('cancel') || txt.includes('close')) {
          btn.click();
        }
        // SVG close icon
        if (btn.querySelector('svg[aria-label="Close"]')) btn.click();
      }
      // Remove dialog backdrops
      document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
      // Allow scrolling
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    });
  } catch (_) {}
}

async function extractGridPosts(page) {
  return page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const links = document.querySelectorAll('a[href*="/p/"]');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/p\/([^\/]+)/);
      if (!m) return;
      const shortcode = m[1];
      if (seen.has(shortcode)) return;
      seen.add(shortcode);

      const img = a.querySelector('img');
      const src = img ? (img.getAttribute('src') || img.src || '') : '';
      const alt = img ? (img.getAttribute('alt') || '') : '';

      if (src) {
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
}

async function fetchPostCaption(page, postUrl) {
  try {
    await page.goto(postUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    await sleep(2000);
    await dismissModals(page);

    return await page.evaluate(() => {
      // Get caption text — Instagram puts it in h1 or article span
      const captionEl =
        document.querySelector('article h1') ||
        document.querySelector('article span[dir="auto"]') ||
        document.querySelector('h1') ||
        document.querySelector('span[dir="auto"]');
      const caption = captionEl ? (captionEl.innerText || '').trim() : '';

      // Get best flyer image — look for image with rich alt text
      const imgs = Array.from(document.querySelectorAll('article img, div[role="main"] img'))
        .map(i => ({ src: i.src || i.getAttribute('src') || '', alt: i.getAttribute('alt') || '' }))
        .filter(i => i.src && !i.alt.toLowerCase().includes('profile picture'));

      // Prefer image with longest alt text (flyer image)
      let best = imgs.reduce((a, b) => (b.alt.length > a.alt.length ? b : a), { src: '', alt: '' });

      return {
        caption,
        imgAlt: best.alt,
        imageUrl: best.src
      };
    });
  } catch (err) {
    return { caption: '', imgAlt: '', imageUrl: '' };
  }
}

function loadExistingProfiles() {
  const candidates = [
    path.join(__dirname, '..', 'data', 'profiles.json'),
    path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json'),
    '/tmp/profiles.json'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(c, 'utf8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`[Instagram Sync] Loaded ${parsed.length} existing profiles from ${c}`);
          return parsed;
        }
      } catch (_) {}
    }
  }
  return [];
}

async function saveProfiles(profiles) {
  // Try Supabase first
  try {
    const { dbUpsertProfiles } = await import('../db.js');
    await dbUpsertProfiles(profiles);
    console.log(`[Instagram Sync] ✓ Saved ${profiles.length} profiles to Supabase DB + local JSON`);
    return;
  } catch (dbErr) {
    console.warn('[Instagram Sync] Supabase upsert failed, falling back to JSON files:', dbErr.message);
  }

  // Fallback: save to JSON files
  const targets = [
    path.join(__dirname, '..', 'data', 'profiles.json'),
    path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json'),
  ];
  const jsonStr = JSON.stringify(profiles, null, 2);
  for (const t of targets) {
    try {
      const dir = path.dirname(t);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(t, jsonStr, 'utf8');
      console.log(`[Instagram Sync] ✓ Saved to ${t}`);
    } catch (e) {
      console.error(`[Instagram Sync] Could not save to ${t}:`, e.message);
    }
  }
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = parseInt(process.argv[2], 10) || 50;
  syncLiveInstagramPosts(count).then(res => {
    console.log('\n=============================================');
    console.log(`🎉 Instagram Sync Complete!`);
    console.log(`   Fresh IG posts scraped : ${res.freshlyFetched}`);
    console.log(`   Total profiles in DB   : ${res.totalProfiles}`);
    console.log('=============================================\n');
  }).catch(err => {
    console.error('Fatal sync error:', err);
    process.exit(1);
  });
}
