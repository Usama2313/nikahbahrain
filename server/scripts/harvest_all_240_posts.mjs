import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pipeline } from 'stream/promises';
import { createWriteStream } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_UPLOADS = path.join(__dirname, '..', 'public', 'uploads');
const CLIENT_UPLOADS = path.join(__dirname, '..', '..', 'client', 'public', 'uploads');
const SERVER_DATA_PATH = path.join(__dirname, '..', 'data', 'profiles.json');
const CLIENT_DATA_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');
const POSTS_CACHE_PATH = path.join(__dirname, '..', 'data', 'harvested_posts.json');

for (const dir of [SERVER_UPLOADS, CLIENT_UPLOADS]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function cleanOcrNoise(str) {
  if (!str) return '';
  return str
    .replace(/[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, '')
    .replace(/["""''‎]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatHeight(hStr) {
  if (!hStr) return '';
  const clean = cleanOcrNoise(hStr).replace(/feet/i, "'").replace(/inches/i, '"');
  const m = clean.match(/(\d)\s*[''.\s:]\s*(\d{1,2})/);
  if (m) return `${m[1]}'${m[2]}"`;
  const mBare = clean.match(/^5(\d)$/);
  if (mBare) return `5'${mBare[1]}"`;
  const mBare2 = clean.match(/^5(\d{2})$/);
  if (mBare2) return `5'${mBare2[1]}"`;
  return clean.trim();
}

const ALL_HEADERS = [
  'Education', 'Qualification', 'Profession', 'Job', 'Occupation', 'Business',
  "Father's Occupation", "Father's", "Father Name", 'Father',
  "Mother's Occupation", "Mother's", "Mother Name", 'Mother',
  'Siblings', 'No. Siblings', 'No Siblings', 'Seeking', 'Looking For', 'Looking',
  'Partner Requirement', 'Requirements', 'Height', 'Age', 'Birth Date', 'Date of Birth',
  'Location', 'Residence', 'Current Residence', 'Languages', 'Language',
  'Sect', 'Religious Sect', 'Caste', 'Religion', 'Nationality',
  'Marital Status', 'Contact', 'Gender', 'Complexion', 'Build'
];

function extractField(text, keyPattern) {
  if (!text) return null;
  const headerRegexStr = ALL_HEADERS.map(h => h.replace(/['.]/g, "\\$&")).join('|');
  const regex = new RegExp(`(?:${keyPattern})\\s*[:\\s-]+([\\s\\S]*?)(?=(?:${headerRegexStr})\\s*[:\\s-]|["""]|\\bNIKAH BAHRAIN\\b|$)`, 'i');
  const match = text.match(regex);
  if (!match) return null;
  return cleanOcrNoise(match[1])
    .replace(/\bNIKAH\s*BAHRAIN\b/gi, '')
    .replace(/^[:\-–\s]+/, '').replace(/[;:]+$/, '').trim();
}

async function downloadImage(url, destPath) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://www.instagram.com/'
      },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) return 0;
    const fileStream = createWriteStream(destPath);
    await pipeline(res.body, fileStream);
    return fs.statSync(destPath).size;
  } catch (e) {
    return 0;
  }
}

function parseProfile(p, textToParse) {
  if (!textToParse || textToParse.length < 20) return;

  const isBride = /\b(BRIDE|FEMALE|Girl|Daughter)\b/i.test(textToParse);
  const isGroom = /\b(GROOM|MALE|Boy|Son)\b/i.test(textToParse);
  if (isBride && !isGroom) { p.gender = 'female'; }
  else if (isGroom && !isBride) { p.gender = 'male'; }

  const ageM = textToParse.match(/\bAGE\s*[:\s-]+\s*(\d{2})\b/i);
  if (ageM) { const a = parseInt(ageM[1]); if (a >= 18 && a <= 70) p.age = a; }

  const h = extractField(textToParse, 'Height');
  if (h) p.height = formatHeight(h);

  const ms = extractField(textToParse, 'Marital Status');
  if (ms) {
    if (/Never Married|Single|Unmarried/i.test(ms)) p.maritalStatus = 'Never Married';
    else if (/Divorced/i.test(ms)) p.maritalStatus = 'Divorced';
    else if (/Widow(ed)?/i.test(ms)) p.maritalStatus = 'Widowed';
    else if (/2nd Marriage|Second/i.test(ms)) p.maritalStatus = '2nd Marriage';
    else if (/Separated/i.test(ms)) p.maritalStatus = 'Separated';
  }

  const nat = extractField(textToParse, 'Nationality');
  if (nat && nat.length < 50) {
    let cleanNat = nat.replace(/[:,-]+$/, '').trim();
    if (/Bahraini/i.test(cleanNat) && /Pakistani/i.test(cleanNat)) cleanNat = 'Bahraini / Pakistani';
    else if (/Pakistani/i.test(cleanNat)) cleanNat = 'Pakistani';
    else if (/Indian/i.test(cleanNat)) cleanNat = 'Indian';
    else if (/Bahraini/i.test(cleanNat)) cleanNat = 'Bahraini';
    else if (/Saudi/i.test(cleanNat)) cleanNat = 'Saudi Arabia';
    p.nationality = cleanNat;
  }

  const edu = extractField(textToParse, 'Qualification|Education');
  if (edu && edu.length < 120 && !edu.toLowerCase().includes('partner')) p.education = cleanOcrNoise(edu);

  const prof = extractField(textToParse, 'Occupation Business|Occupation|Profession|Job|Business');
  if (prof && prof.length < 120 && !prof.toLowerCase().includes('father') && !prof.toLowerCase().includes('mother')) p.profession = cleanOcrNoise(prof);

  const father = extractField(textToParse, "Father's Occupation|Father's|Father");
  if (father && father.length < 90 && !father.toLowerCase().includes('not mentioned') && !father.toLowerCase().includes('mother')) p.father = cleanOcrNoise(father);

  const mother = extractField(textToParse, "Mother's Occupation|Mother's|Mother");
  if (mother && mother.length < 90 && !mother.toLowerCase().includes('not mentioned')) p.mother = cleanOcrNoise(mother);

  const sib = extractField(textToParse, 'No. Siblings|No Siblings|Siblings');
  if (sib && sib.length < 100) p.siblings = cleanOcrNoise(sib);

  const sect = extractField(textToParse, 'Religious Sect|Sect|Faith');
  if (sect && sect.length < 40) p.sect = cleanOcrNoise(sect);

  const lang = extractField(textToParse, 'Languages|Language');
  if (lang && lang.length < 80) p.languages = cleanOcrNoise(lang);

  const res = extractField(textToParse, 'Current Residence|Residence');
  if (res && res.length < 70) {
    p.residence = cleanOcrNoise(res);
    if (!p.location || p.location === 'Bahrain') p.location = p.residence;
  }

  const req = extractField(textToParse, 'Partner Requirement|Requirements|Looking For|Seeking');
  if (req && req.length > 5 && req.length < 350) p.requirements = cleanOcrNoise(req);

  const nameM = textToParse.match(/\bNAME\s*[:\s-]+\s*([A-Za-z\s]+?)(?=(?:AGE|EDUCATION|QUALIFICATION|HEIGHT|RESIDENCE|LOOKING|PROFESSION|MARITAL)\b|[:\n]|$)/i);
  if (nameM) {
    const rawName = cleanOcrNoise(nameM[1]);
    if (rawName && rawName.length > 2 && rawName.length < 35 && !/^(Bride|Groom|Not Mentioned|None|Profile|NPF\d+)$/i.test(rawName)) {
      p.name = `${rawName} (${p.gender === 'male' ? 'Groom' : 'Bride'})`;
    }
  }

  // Ensure category matches gender and marital status
  if (p.gender === 'female') p.category = ['Divorced', 'Widowed', 'Separated'].includes(p.maritalStatus) ? 'divorced-brides' : 'brides';
  else if (p.gender === 'male') p.category = ['Divorced', 'Widowed', 'Separated'].includes(p.maritalStatus) ? 'divorced-grooms' : 'grooms';

  // Clean name
  const isGeneric = /^(Pakistani|Indian|Bahraini|Saudi|Emirati|\s*)\s*(Bride|Groom)/i.test((p.name || '').trim())
    || /^(IG-|NPF-)[\S]*\s*[·(]/.test((p.name || '').trim())
    || !p.name;
  if (isGeneric) {
    const gl = p.gender === 'male' ? 'Groom' : 'Bride';
    const nl = p.nationality ? `${p.nationality} ` : '';
    p.name = `${p.id} · ${nl}${gl}`;
    if (p.maritalStatus && p.maritalStatus !== 'Never Married') p.name += ` (${p.maritalStatus})`;
  }

  // Clean about
  if (p.about && (/^Photo by Nikah Bahrain/i.test(p.about.trim()) || /^May be an image/i.test(p.about.trim()))) p.about = '';
  if (!p.about || p.about.trim() === '') {
    const parts = [];
    if (p.age) parts.push(`${p.age} years old`);
    if (p.maritalStatus) parts.push(p.maritalStatus);
    if (p.nationality) parts.push(`${p.nationality} national`);
    if (p.residence) parts.push(`residing in ${p.residence}`);
    if (p.profession) parts.push(`working in ${p.profession}`);
    if (p.education) parts.push(`educated in ${p.education}`);
    if (parts.length > 0) p.about = `${p.gender === 'male' ? 'Groom' : 'Bride'} candidate (${p.id}): ${parts.join(', ')}.`;
  }
}

async function main() {
  console.log('=== Connecting to Chrome on port 9222 ===');
  const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
  const pages = await browser.pages();
  let igPage = pages.find(p => p.url().includes('instagram.com/nikah_bahrain'));

  if (!igPage) {
    console.log('Instagram tab not found. Navigating new page...');
    igPage = pages[0];
    await igPage.goto('https://www.instagram.com/nikah_bahrain/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  }

  await igPage.bringToFront();
  console.log(`Attached to: ${igPage.url()}`);

  // Scroll to top first
  await igPage.evaluate(() => window.scrollTo(0, 0));
  await sleep(2000);

  const postsMap = new Map();
    const MAX_SCROLLS = 500;
  const STABLE_LIMIT = 30;

  console.log('Starting scroll-harvest of all posts...\n');

  for (let s = 1; s <= MAX_SCROLLS; s++) {
    // Harvest all visible post anchors
    const batch = await igPage.evaluate(() => {
      const results = [];
      // Multiple selectors to catch different Instagram layouts
      const selectors = [
        'article a[href*="/p/"]',
        'a[href*="/p/"]',
        'div._aagu a',
        'div[style*="grid"] a',
        'main article div a'
      ];
      const seen = new Set();
      for (const sel of selectors) {
        try {
          document.querySelectorAll(sel).forEach(a => {
            const href = a.getAttribute('href') || '';
            const match = href.match(/\/p\/([A-Za-z0-9_-]{10,})/);
            if (!match) return;
            const shortcode = match[1];
            if (seen.has(shortcode)) return;
            seen.add(shortcode);
            const img = a.querySelector('img');
            if (!img) return;
            results.push({
              shortcode,
              href,
              imgSrc: img.getAttribute('src') || '',
              alt: img.getAttribute('alt') || ''
            });
          });
        } catch (_) {}
      }
      return results;
    });

    let newCount = 0;
    for (const post of batch) {
      if (!postsMap.has(post.shortcode)) {
        postsMap.set(post.shortcode, post);
        newCount++;
      } else {
        // Keep the entry with better/bigger img src (higher-res)
        const ex = postsMap.get(post.shortcode);
        if (post.alt && post.alt.length > (ex.alt || '').length) ex.alt = post.alt;
        if (post.imgSrc && !post.imgSrc.includes('s150x150') && !post.imgSrc.includes('s320x320')) {
          if (!ex.imgSrc || ex.imgSrc.includes('s150x150') || ex.imgSrc.includes('s320x320')) {
            ex.imgSrc = post.imgSrc;
          }
        }
      }
    }

    const total = postsMap.size;
    if (newCount > 0) {
      stableScrolls = 0;
      process.stdout.write(`\r[Scroll ${s}] Total unique posts: ${total} (+${newCount})`);
    } else {
      stableScrolls++;
      if (s % 20 === 0) process.stdout.write(`\r[Scroll ${s}] Total: ${total} (stable ${stableScrolls}/${STABLE_LIMIT})`);
    }

    if (stableScrolls >= STABLE_LIMIT) {
      console.log(`\nStopped: ${total} posts found, ${stableScrolls} stable scrolls.`);
      break;
    }

    // Progressive scroll
    await igPage.evaluate(() => {
      const scrollStep = window.innerHeight * 1.5;
      window.scrollBy(0, scrollStep);
    });
    await sleep(2500 + Math.random() * 800);

    // Every 30 scrolls, scroll up slightly to trigger re-render
    if (s % 30 === 0) {
      await igPage.evaluate(() => window.scrollBy(0, -300));
      await sleep(800);
    }
  }

  console.log(`\n\nTotal unique posts harvested: ${postsMap.size}`);
  await browser.disconnect();

  // Save harvested posts to cache file
  const harvestedArray = Array.from(postsMap.values());
  fs.writeFileSync(POSTS_CACHE_PATH, JSON.stringify(harvestedArray, null, 2), 'utf8');
  console.log(`Saved ${harvestedArray.length} posts to ${POSTS_CACHE_PATH}`);

  // Load existing profiles
  const existingProfiles = JSON.parse(fs.readFileSync(SERVER_DATA_PATH, 'utf8'));
  const existingByPostId = new Map(existingProfiles.map(p => [p.instagramPostId, p]));
  const existingById = new Map(existingProfiles.map(p => [p.id, p]));

  const finalProfiles = [];
  const processedShortcodes = new Set();
  let downloaded = 0;

  console.log('\nBuilding profiles and downloading images...');

  for (const post of harvestedArray) {
    processedShortcodes.add(post.shortcode);
    const filename = `ig_${post.shortcode}.jpg`;
    const cDest = path.join(CLIENT_UPLOADS, filename);
    const sDest = path.join(SERVER_UPLOADS, filename);

    // Download if not present or <10KB (probably placeholder)
    let imageOk = fs.existsSync(cDest) && fs.statSync(cDest).size > 10000;
    if (!imageOk && post.imgSrc && !post.imgSrc.includes('s150x150')) {
      const size = await downloadImage(post.imgSrc, cDest);
      if (size > 4000) {
        try { fs.copyFileSync(cDest, sDest); } catch (_) {}
        imageOk = true;
        downloaded++;
        process.stdout.write(`\r  Downloaded ${downloaded}...`);
      }
    }

    // Determine profile ID from alt text
    let profileId = null;
    const npfMatch = (post.alt || '').match(/NPF\s*(\d+[a-z]?)/i);
    if (npfMatch) profileId = `NPF-${npfMatch[1]}`;

    // Retrieve or create profile entry
    let p = existingByPostId.get(post.shortcode)
      || (profileId && existingById.get(profileId))
      || null;

    if (p) {
      p = { ...p };
      p.instagramPostId = post.shortcode;
      p.instagramPostUrl = `https://www.instagram.com/p/${post.shortcode}/`;
      if (imageOk) p.image = `/uploads/${filename}`;
      if (post.alt && post.alt.length > (p.rawFlyerText || '').length) p.rawFlyerText = post.alt;
      if (profileId && !p.id.startsWith('NPF-')) p.id = profileId;
    } else {
      p = {
        id: profileId || `IG-${post.shortcode}`,
        name: '',
        gender: 'female',
        maritalStatus: 'Never Married',
        category: 'brides',
        nationality: 'Bahraini',
        age: null,
        height: '',
        sect: 'Sunni',
        caste: 'General',
        education: '',
        profession: '',
        salary: 'Confidential / As per discussion',
        location: 'Bahrain',
        residence: 'Bahrain',
        siblings: '',
        father: '',
        mother: '',
        family: '',
        languages: 'Arabic, English',
        complexion: '',
        build: '',
        image: imageOk ? `/uploads/${filename}` : null,
        instagramPostUrl: `https://www.instagram.com/p/${post.shortcode}/`,
        instagramPostId: post.shortcode,
        about: '',
        requirements: '',
        contact: '+973 3718 8557',
        rawFlyerText: post.alt || '',
        verified: true,
        featured: false,
        createdAt: new Date().toISOString()
      };
    }

    parseProfile(p, p.rawFlyerText || post.alt || '');
    finalProfiles.push(p);
  }

  // Retain profiles that weren't in the harvested set (e.g. NPF entries not visible on grid)
  for (const p of existingProfiles) {
    if (p.instagramPostId && processedShortcodes.has(p.instagramPostId)) continue;
    if (finalProfiles.some(x => x.id === p.id)) continue;
    finalProfiles.push({ ...p });
  }

  // Deduplicate by id (keep first occurrence)
  const seenIds = new Set();
  const dedupedProfiles = [];
  for (const p of finalProfiles) {
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    dedupedProfiles.push(p);
  }

  // Sort: NPF descending first, then IG
  dedupedProfiles.sort((a, b) => {
    const isNpfA = a.id.startsWith('NPF-');
    const isNpfB = b.id.startsWith('NPF-');
    if (isNpfA && isNpfB) return (parseInt(b.id.replace('NPF-', '')) || 0) - (parseInt(a.id.replace('NPF-', '')) || 0);
    if (isNpfA) return -1;
    if (isNpfB) return 1;
    return (a.instagramPostId || '').localeCompare(b.instagramPostId || '');
  });

  fs.writeFileSync(SERVER_DATA_PATH, JSON.stringify(dedupedProfiles, null, 2), 'utf8');
  fs.writeFileSync(CLIENT_DATA_PATH, JSON.stringify(dedupedProfiles, null, 2), 'utf8');

  console.log(`\n\n========================================`);
  console.log(`Profiles saved: ${dedupedProfiles.length}`);
  console.log(`Images downloaded: ${downloaded}`);
  console.log(`Profiles with authentic image: ${dedupedProfiles.filter(p => p.image).length}`);
  console.log(`Profiles without image: ${dedupedProfiles.filter(p => !p.image).length}`);
  console.log(`========================================`);
}

main().catch(e => {
  console.error('Fatal error:', e.message);
  process.exit(1);
});
