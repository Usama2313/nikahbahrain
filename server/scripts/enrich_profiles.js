import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseProfileFromAltText } from './sync_live_instagram.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profilesFilePath = path.join(__dirname, '..', 'data', 'profiles.json');

const SESSION_ID = process.argv[2] || process.env.IG_SESSION_ID || '';
if (!SESSION_ID) {
  console.error('Usage: node enrich_profiles.js <sessionid>');
  process.exit(1);
}

async function enrichProfiles() {
  const profiles = JSON.parse(fs.readFileSync(profilesFilePath, 'utf8'));

  // Only enrich those with short/no alt text
  const toEnrich = profiles.filter(p => !p.rawFlyerText || p.rawFlyerText.length < 100);
  console.log(`[Enrich] ${toEnrich.length} profiles need enrichment out of ${profiles.length}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1280,900']
  });

  let enriched = 0;
  const profileMap = new Map(profiles.map(p => [p.instagramPostId, p]));

  try {
    for (let i = 0; i < toEnrich.length; i++) {
      const profile = toEnrich[i];
      const url = profile.instagramPostUrl;

      // Open a fresh page for each post to avoid detached frame issues
      const page = await browser.newPage();
      try {
        await page.setViewport({ width: 1280, height: 900 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setCookie(
          { name: 'sessionid', value: SESSION_ID, domain: '.instagram.com', path: '/', httpOnly: true, secure: true }
        );

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 });
        await new Promise(r => setTimeout(r, 1500));

        const postData = await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('article img, main img, section img'));
          let bestAlt = '', bestSrc = '';
          for (const img of images) {
            const alt = img.getAttribute('alt') || '';
            const src = img.src || '';
            if (alt.length > bestAlt.length && alt.length > 30) {
              bestAlt = alt;
              bestSrc = src;
            }
          }
          return { alt: bestAlt, src: bestSrc };
        });

        if (postData.alt.length > 50) {
          // Re-parse this profile with the richer alt text
          const enrichedProfile = parseProfileFromAltText({
            shortcode: profile.instagramPostId,
            url: profile.instagramPostUrl,
            imageUrl: postData.src || profile.image,
            alt: postData.alt
          });
          // Preserve the existing image if the new one is bad
          if (!postData.src || !postData.src.includes('cdninstagram')) {
            enrichedProfile.image = profile.image;
          }
          profileMap.set(profile.instagramPostId, enrichedProfile);
          enriched++;
        }

        console.log(`[Enrich] ${i + 1}/${toEnrich.length} ${profile.instagramPostId}: alt=${postData.alt.length} chars`);
      } catch (e) {
        console.warn(`[Enrich] Skip ${profile.instagramPostId}: ${e.message.substring(0, 60)}`);
      } finally {
        await page.close();
      }

      // Save every 20 profiles in case of crash
      if ((i + 1) % 20 === 0) {
        const current = Array.from(profileMap.values());
        fs.writeFileSync(profilesFilePath, JSON.stringify(current, null, 2), 'utf8');
        console.log(`[Enrich] Checkpoint: saved ${current.length} profiles (enriched ${enriched} so far)`);
      }
    }
  } finally {
    await browser.close();
  }

  const finalProfiles = Array.from(profileMap.values());
  fs.writeFileSync(profilesFilePath, JSON.stringify(finalProfiles, null, 2), 'utf8');

  const cats = {};
  finalProfiles.forEach(p => { cats[p.category] = (cats[p.category] || 0) + 1; });

  console.log(`\n✅ [Enrich] DONE! Enriched ${enriched}/${toEnrich.length} profiles.`);
  console.log(`Total profiles: ${finalProfiles.length}`);
  console.log('By category:', cats);
}

enrichProfiles().catch(console.error);
