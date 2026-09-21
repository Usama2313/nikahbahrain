/**
 * puppeteer_caption_scraper.js
 * 
 * Uses a single persistent Puppeteer browser session to:
 * 1. Load @nikah_bahrain profile and collect all post shortcodes
 * 2. Visit each post URL in the same browser (so Instagram serves full HTML with captions)
 * 3. Extract "caption":{"text":"..."} from the page's embedded script JSON
 * 4. Parse with parse_profile.js → upsert into Supabase
 *
 * Key insight: Chrome gets 1.2MB HTML with caption embedded in script JSON.
 * Plain fetch only gets 647KB without caption. We must use Puppeteer for ALL requests.
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { parseProfileFromAltText } from './parse_profile.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '../.env') });
puppeteer.use(StealthPlugin());

import { dbInsertProfile, isDbAvailable, saveLocalProfiles, getLocalProfiles } from '../db.js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const SESSION_ID = process.env.INSTAGRAM_SESSION_ID;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_PROFILE = 'nikah_bahrain';
const REPLACE_ALL = process.argv.includes('--replace-all');

if (!SESSION_ID) { console.error('❌ Missing INSTAGRAM_SESSION_ID'); process.exit(1); }

const dbConfigured = isDbAvailable();
const supabase = dbConfigured ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
if (!dbConfigured) {
  console.log('ℹ️ Supabase not configured or using placeholders. Saving to local profiles.json fallback.');
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randomDelay(min = 2000, max = 4500) { return sleep(Math.floor(Math.random() * (max - min) + min)); }

function extractCaptionFromPageHtml(html) {
  // The full caption is in: "caption":{"text":"...","pk":...}
  const match = html.match(/"caption":\{"text":"((?:[^"\\]|\\.)*)"/);
  if (!match) return '';
  return match[1]
    .replace(/\\n/g, '\n')
    .replace(/\\"/g, '"')
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
    .replace(/\\\\/g, '\\')
    .trim();
}

function extractImageFromHtml(html) {
  const m = html.match(/property="og:image" content="([^"]+)"/);
  return m ? m[1].replace(/&amp;/g, '&').split('?')[0] : '';
}

function extractTimestampFromHtml(html) {
  const m = html.match(/"created_at":(\d{10})/);
  return m ? parseInt(m[1]) : 0;
}

async function main() {
  console.log('='.repeat(60));
  console.log('  Nikah Bahrain — Puppeteer Caption Scraper');
  console.log(`  Mode: ${REPLACE_ALL ? 'REPLACE ALL' : 'INCREMENTAL'}`);
  console.log('='.repeat(60));

  console.log('\n🚀 Launching Chrome (stealth)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--window-size=1366,768', '--disable-gpu',
      '--lang=en-US', '--disable-blink-features=AutomationControlled',
      '--disable-dev-shm-usage'
    ],
    defaultViewport: { width: 1366, height: 768 }
  });

  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

  // --- Set session cookies ---
  console.log('🍪 Setting session cookies...');
  await page.goto('https://www.instagram.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.setCookie(
    { name: 'sessionid', value: SESSION_ID, domain: '.instagram.com', path: '/', httpOnly: true, secure: true, sameSite: 'None' },
    { name: 'ig_nrcb', value: '1', domain: '.instagram.com', path: '/' },
    { name: 'wd', value: '1366x768', domain: '.instagram.com', path: '/' },
    { name: 'dpr', value: '1', domain: '.instagram.com', path: '/' }
  );

  // --- Load profile page and collect shortcodes ---
  console.log(`\n🌐 Loading @${TARGET_PROFILE} profile...`);
  await randomDelay(1000, 2000);
  await page.goto(`https://www.instagram.com/${TARGET_PROFILE}/`, { waitUntil: 'networkidle2', timeout: 60000 });

  if (page.url().includes('/accounts/login')) {
    await browser.close();
    throw new Error('Session expired — redirected to login');
  }
  console.log('✅ Logged in!');

  // Scroll to load all posts
  console.log('📜 Scrolling to load all posts...');
  let prevCount = 0, stuck = 0;
  for (let i = 0; i < 25; i++) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await randomDelay(2500, 4000);
    const count = await page.$$eval('a[href*="/p/"]', els => new Set(els.map(e => e.href.match(/\/p\/([^/]+)/)?.[1]).filter(Boolean)).size);
    console.log(`  Scroll ${i + 1}: ${count} posts`);
    if (count === prevCount) { if (++stuck >= 3) { console.log('  → End of feed'); break; } } else stuck = 0;
    prevCount = count;
  }

  const shortcodes = await page.$$eval('a[href*="/p/"]', els => {
    const s = new Set();
    els.forEach(el => { const m = el.href.match(/\/p\/([A-Za-z0-9_-]+)\//); if (m) s.add(m[1]); });
    return [...s];
  });
  console.log(`\n✅ Found ${shortcodes.length} post shortcodes`);

  // --- Visit each post page and extract caption ---
  console.log(`\n📥 Reading captions from ${shortcodes.length} posts...\n`);
  const posts = [];

  for (let i = 0; i < shortcodes.length; i++) {
    const shortcode = shortcodes[i];
    const url = `https://www.instagram.com/p/${shortcode}/`;
    process.stdout.write(`  [${i + 1}/${shortcodes.length}] ${shortcode}: `);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Get the full page HTML (which has caption in embedded script JSON)
      const html = await page.content();
      
      const caption = extractCaptionFromPageHtml(html);
      const imageUrl = extractImageFromHtml(html);
      const takenAt = extractTimestampFromHtml(html);

      const preview = caption ? caption.slice(0, 70) : '(no caption)';
      console.log(`"${preview}"`);

      posts.push({ shortcode, caption, alt: '', url, imageUrl, takenAt });
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }

    // Human-like delay between posts
    if (i < shortcodes.length - 1) await randomDelay(2500, 5000);
  }

  await browser.close();
  console.log(`\n✅ Fetched ${posts.length} posts total`);

  // Save debug output
  const debugPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'scrape_results.json');
  fs.writeFileSync(debugPath, JSON.stringify(posts, null, 2));
  console.log(`📁 Saved raw results: ${debugPath}`);

  // --- Parse and save to database ---
  if (REPLACE_ALL) {
    console.log('\n🗑️ Clearing existing profiles...');
    if (supabase) {
      const { error } = await supabase.from('profiles').delete().neq('id', '__none__');
      if (error) console.error('Clear error:', error.message);
      else console.log('Database cleared.');
    } else {
      saveLocalProfiles([]);
      console.log('Local profiles cleared.');
    }
  }

  console.log(`\n💾 Parsing & saving ${posts.length} posts...`);
  let saved = 0, skipped = 0, errors = 0;

  for (const post of posts) {
    try {
      const parsed = parseProfileFromAltText(post);
      if (!parsed.id || (!parsed.age && !parsed.nationality && !parsed.profession)) {
        console.log(`  ⏭️ Skip ${post.shortcode} — "${post.caption.slice(0, 50)}"`);
        skipped++;
        continue;
      }

      const row = {
        id: parsed.id,
        name: parsed.name || null,
        gender: parsed.gender || 'male',
        age: parsed.age ? parseInt(parsed.age) : null,
        height: parsed.height || null,
        nationality: parsed.nationality || null,
        religion: parsed.religion || null,
        sect: parsed.sect || null,
        marital_status: parsed.maritalStatus || null,
        education: parsed.education || null,
        profession: parsed.profession || null,
        location: parsed.location || null,
        languages: parsed.languages || null,
        bio: parsed.bio || null,
        requirements: parsed.requirements || null,
        father: parsed.father || null,
        mother: parsed.mother || null,
        siblings: parsed.siblings || null,
        complexion: parsed.complexion || null,
        caste: parsed.caste || null,
        weight: parsed.weight || null,
        category: parsed.category || 'grooms',
        instagram_post_url: post.url || null,
        image_url: post.imageUrl || null,
        raw_caption: post.caption?.slice(0, 2000) || null,
        created_at: post.takenAt ? new Date(post.takenAt * 1000).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (supabase) {
        const { error } = await supabase.from('profiles').upsert(row, { onConflict: 'id' });
        if (error) {
          console.error(`  ⚠️ Supabase upsert failed: ${error.message}, saving to local fallback`);
          await dbInsertProfile(row);
        }
      } else {
        await dbInsertProfile(row);
      }

      console.log(`  ✅ ${parsed.id} | ${parsed.gender} | Age:${parsed.age} | ${parsed.nationality} | ${parsed.category}`);
      saved++;
    } catch (e) {
      console.error(`  ❌ Parse ${post.shortcode}: ${e.message}`);
      errors++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 DONE: ${saved} saved, ${skipped} skipped, ${errors} errors`);
  console.log('='.repeat(60));
}

main().catch(e => { console.error('Fatal:', e.message, e.stack); process.exit(1); });
