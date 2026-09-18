import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { parseProfileFromAltText } from './parse_profile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from server/.env or project root .env
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(__dirname, '..', '..', '.env'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), 'server', '.env')
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

export { parseProfileFromAltText };

export function findChromeExecutable() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Google\\Chrome\\Application\\chrome.exe') : null,
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// Helper to determine next NPF ID
function getNextProfileId(profiles) {
  let maxNum = 0;
  for (const p of profiles) {
    if (p && p.id) {
      const m = p.id.match(/^NPF-?(\d+)/i);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum && n < 9000) maxNum = n;
      }
    }
  }
  return `NPF-${String(maxNum + 1).padStart(3, '0')}`;
}

// ─── Main Instagram Sync Function ─────────────────────────────────────────────
export async function syncLiveInstagramPosts(targetCount = 20) {
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    throw new Error('Chrome/Chromium/Edge browser executable not found on this machine.');
  }

  console.log(`[Instagram Sync] Launching browser (${chromePath}) to inspect @nikah_bahrain...`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
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

    // Instagram session cookie if provided (allows reading deep feed if needed)
    const sessionId = process.env.INSTAGRAM_SESSION_ID;
    if (sessionId) {
      console.log('[Instagram Sync] Applying Instagram session credentials...');
      await page.setCookie(
        { name: 'sessionid', value: sessionId, domain: '.instagram.com', path: '/', httpOnly: true, secure: true },
        { name: 'ig_did', value: process.env.INSTAGRAM_DID || '', domain: '.instagram.com', path: '/', secure: true },
        { name: 'csrftoken', value: process.env.INSTAGRAM_CSRF || '', domain: '.instagram.com', path: '/', secure: true }
      );
    }

    console.log('[Instagram Sync] Loading https://www.instagram.com/nikah_bahrain/ ...');
    try {
      await page.goto('https://www.instagram.com/nikah_bahrain/', {
        waitUntil: 'domcontentloaded',
        timeout: 25000
      });
    } catch (navErr) {
      console.warn('[Instagram Sync] Navigation warning (continuing):', navErr.message);
    }

    await dismissModals(page);
    await sleep(2500);

    let currentUrl = page.url();
    if (
      currentUrl.includes('/accounts/') ||
      currentUrl.includes('scraping_warning') ||
      currentUrl.includes('challenge') ||
      currentUrl.includes('checkpoint') ||
      currentUrl.includes('login')
    ) {
      console.warn('[Instagram Sync] Instagram session cookie expired or forced login wall. Clearing cookies to load public feed...');
      try {
        const client = await page.target().createCDPSession();
        await client.send('Network.clearBrowserCookies');
      } catch (_) {}
      try {
        await page.goto('https://www.instagram.com/nikah_bahrain/', {
          waitUntil: 'domcontentloaded',
          timeout: 25000
        });
      } catch (_) {}
      await dismissModals(page);
      await sleep(2500);
      console.log('[Instagram Sync] Fallback URL:', page.url());
    }

    // ── STEP 1: Fast Grid Extraction ────────────────────────────────────────
    const postsMap = new Map();
    let scrollAttempts = 0;
    const maxScrolls = 4; // Fast inspection of the latest posts
    let noNewStreak = 0;

    console.log('[Instagram Sync] Checking latest grid posts...');
    while (scrollAttempts < maxScrolls && noNewStreak < 2) {
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

      if (postsMap.size >= targetCount) break;

      await page.evaluate(() => window.scrollBy(0, 1000));
      await sleep(1200);
      scrollAttempts++;
    }

    console.log(`[Instagram Sync] Discovered ${postsMap.size} posts in feed grid.`);

    // ── STEP 2: Smart Diffing with Database ─────────────────────────────────
    const existing = loadExistingProfiles();
    let deletedIds = new Set();
    try {
      const { getDeletedProfileIds } = await import('../db.js');
      deletedIds = getDeletedProfileIds();
    } catch (_) {}

    const knownShortcodes = new Set();
    const knownUrls = new Set();
    for (const p of existing) {
      if (p.instagramPostId) knownShortcodes.add(p.instagramPostId);
      if (p.instagramPostUrl) {
        knownUrls.add(p.instagramPostUrl);
        const m = p.instagramPostUrl.match(/\/p\/([^\/]+)/);
        if (m) knownShortcodes.add(m[1]);
      }
    }

    // Filter to only posts that are NEW (not in database) and NOT deleted by admin
    const gridPosts = Array.from(postsMap.values());
    const newPostsToEnrich = gridPosts.filter(p => {
      if (deletedIds.has(`NB-${p.shortcode}`)) return false;
      if (deletedIds.has(p.shortcode)) return false;
      return !knownShortcodes.has(p.shortcode) && !knownUrls.has(p.url);
    });

    console.log(`[Instagram Sync] Diff analysis: ${newPostsToEnrich.length} new post(s) found to ingest.`);

    // ── STEP 3: Enrich only the NEW posts ───────────────────────────────────
    const freshParsedProfiles = [];
    for (const post of newPostsToEnrich) {
      try {
        console.log(`[Instagram Sync] Fetching full flyer details for new post ${post.shortcode}...`);
        const captionData = await fetchPostCaption(page, post.url);

        if (captionData.caption && captionData.caption.length > 50) {
          post.alt = captionData.caption + '\n' + (post.alt || '');
        } else if (captionData.imgAlt && captionData.imgAlt.length > (post.alt?.length || 0)) {
          post.alt = captionData.imgAlt + '\n' + (captionData.caption || '');
        }

        if (captionData.imageUrl && captionData.imageUrl.length > 10) {
          post.imageUrl = captionData.imageUrl;
        }

        const parsed = parseProfileFromAltText(post);
        // Ensure ID is populated
        if (!parsed.id || parsed.id.startsWith('NB-')) {
          parsed.id = getNextProfileId([...freshParsedProfiles, ...existing]);
        }

        // Check again against deleted IDs
        if (!deletedIds.has(parsed.id)) {
          freshParsedProfiles.push(parsed);
          console.log(`[Instagram Sync] ✓ Successfully parsed new proposal: ${parsed.id} (${parsed.gender})`);
        }
      } catch (err) {
        console.warn(`[Instagram Sync] Could not enrich post ${post.shortcode}:`, err.message);
      }
    }

    // ── STEP 4: Merge & Persist ─────────────────────────────────────────────
    let finalProfiles = existing;
    if (freshParsedProfiles.length > 0) {
      finalProfiles = [...freshParsedProfiles, ...existing];
      await saveProfiles(finalProfiles);
      console.log(`[Instagram Sync] ✓ Added ${freshParsedProfiles.length} new profiles. Total in database: ${finalProfiles.length}`);
    } else {
      console.log('[Instagram Sync] All Instagram feed posts are already up-to-date.');
    }

    return {
      success: true,
      freshlyFetched: freshParsedProfiles.length,
      totalProfiles: finalProfiles.length,
      newProfiles: freshParsedProfiles,
      message: freshParsedProfiles.length > 0
        ? `✓ Successfully synced ${freshParsedProfiles.length} new profile(s) from @nikah_bahrain! Total: ${finalProfiles.length}`
        : `✓ Instagram feed is fully synced. All ${finalProfiles.length} proposals are up to date.`
    };

  } finally {
    try {
      await browser.close();
    } catch (_) {}
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function dismissModals(page) {
  try {
    await page.evaluate(() => {
      const candidates = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const btn of candidates) {
        const txt = (btn.innerText || '').toLowerCase();
        if (txt.includes('not now') || txt.includes('cancel') || txt.includes('close')) {
          btn.click();
        }
        if (btn.querySelector('svg[aria-label="Close"]')) btn.click();
      }
      document.querySelectorAll('div[role="dialog"]').forEach(d => d.remove());
      document.body.style.overflow = 'auto';
      document.documentElement.style.overflow = 'auto';
    });
  } catch (_) {}
}

async function extractGridPosts(page) {
  return page.evaluate(() => {
    const results = [];
    const seen = new Set();
    const links = document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]');
    links.forEach(a => {
      const href = a.getAttribute('href') || '';
      const m = href.match(/\/(?:p|reel)\/([^\/?#]+)/);
      if (!m) return;
      const shortcode = m[1];
      if (seen.has(shortcode)) return;
      seen.add(shortcode);

      const img = a.querySelector('img');
      const src = img ? (img.getAttribute('src') || img.src || '') : '';
      const alt = img ? (img.getAttribute('alt') || '') : '';

      results.push({
        shortcode,
        url: `https://www.instagram.com/p/${shortcode}/`,
        imageUrl: src,
        alt
      });
    });
    return results;
  });
}

async function fetchPostCaption(page, postUrl) {
  try {
    try {
      await page.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    } catch (_) {}
    await sleep(1500);
    await dismissModals(page);

    return await page.evaluate(() => {
      const captionEl =
        document.querySelector('article h1') ||
        document.querySelector('article span[dir="auto"]') ||
        document.querySelector('h1') ||
        document.querySelector('span[dir="auto"]');
      const caption = captionEl ? (captionEl.innerText || '').trim() : '';

      const imgs = Array.from(document.querySelectorAll('article img, div[role="main"] img'))
        .map(i => ({ src: i.src || i.getAttribute('src') || '', alt: i.getAttribute('alt') || '' }))
        .filter(i => i.src && !i.alt.toLowerCase().includes('profile picture'));

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
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json'),
    '/tmp/profiles.json'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(c, 'utf8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (_) {}
    }
  }
  return [];
}

async function saveProfiles(profiles) {
  try {
    const { dbUpsertProfiles } = await import('../db.js');
    await dbUpsertProfiles(profiles);
    return;
  } catch (dbErr) {
    console.warn('[Instagram Sync] Supabase upsert failed, saving to local JSON:', dbErr.message);
  }

  const targets = [
    path.join(__dirname, '..', 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json'),
  ];
  const jsonStr = JSON.stringify(profiles, null, 2);
  for (const t of targets) {
    try {
      const dir = path.dirname(t);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(t, jsonStr, 'utf8');
    } catch (_) {}
  }
}

// ─── CLI Entry ────────────────────────────────────────────────────────────────
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = parseInt(process.argv[2], 10) || 20;
  syncLiveInstagramPosts(count).then(res => {
    console.log('\n=============================================');
    console.log(`🎉 Instagram Sync Complete!`);
    console.log(`   Result: ${res.message}`);
    console.log(`   Fresh posts added: ${res.freshlyFetched}`);
    console.log(`   Total profiles in DB: ${res.totalProfiles}`);
    console.log('=============================================\n');
    process.exit(0);
  }).catch(err => {
    console.error('Fatal sync error:', err.message);
    process.exit(1);
  });
}
