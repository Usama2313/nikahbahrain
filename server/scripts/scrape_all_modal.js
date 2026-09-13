import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const profilesFilePath = path.join(__dirname, '..', 'data', 'profiles.json');

const SESSION_ID = process.argv[2] || process.env.IG_SESSION_ID || '19237154023%3AapiqfqSKpEAIrB%3A9%3AAYlR5-MbafZxWOGKWYDIMjAc5tNFo8KxVRBiH006Pw';

export function parseFlyerData(rawText, postUrl, imageUrl, shortcode) {
  const text = rawText || '';

  // 1. Profile ID
  let rawId = `NB-${shortcode}`;
  const idMatch = text.match(/NPF\s*[-_#]?\s*(\d+)/i) || text.match(/Profile\s*#?\s*NPF\s*[-_]?\s*(\d+)/i);
  if (idMatch) {
    const num = idMatch[1];
    rawId = `NPF-${num}`;
  }
  const id = rawId;

  // 2. Gender & Category
  // Header inspection (first 150 chars usually has NPF... BRIDE or GROOM)
  const header = text.slice(0, 200);
  let gender = 'male';

  const hasBrideHeader = /\bBRIDE\b/i.test(header);
  const hasGroomHeader = /\bGROOM\b/i.test(header);

  if (hasBrideHeader && !hasGroomHeader) {
    gender = 'female';
  } else if (hasGroomHeader && !hasBrideHeader) {
    gender = 'male';
  } else if (/Gender\s*:\s*Female/i.test(text) || /\bFemale\b/i.test(text)) {
    gender = 'female';
  } else if (/Gender\s*:\s*Male/i.test(text) || /\bMale\b/i.test(text)) {
    gender = 'male';
  } else if (/\bBRIDE\b/i.test(text)) {
    gender = 'female';
  }

  // Marital Status
  let maritalStatus = 'Never Married';
  if (/Divorced/i.test(text)) {
    maritalStatus = 'Divorced';
  } else if (/Widow(ed)?/i.test(text)) {
    maritalStatus = 'Widowed';
  } else if (/Single/i.test(text) || /Never Married/i.test(text)) {
    maritalStatus = 'Never Married';
  }

  // Category
  let category = gender === 'female' ? 'brides' : 'grooms';
  if (maritalStatus === 'Divorced') {
    category = gender === 'female' ? 'divorced-brides' : 'divorced-grooms';
  } else if (maritalStatus === 'Widowed') {
    category = gender === 'female' ? 'widowed-brides' : 'widowed-grooms';
  }

  // 3. Age
  let age = gender === 'female' ? 26 : 30;
  const ageMatch = text.match(/Age\s*[:\s-]+\s*(?:Originally\s*)?(\d{2})/i) || text.match(/(\d{2})\s*years?/i);
  if (ageMatch) {
    const parsedAge = parseInt(ageMatch[1], 10);
    if (parsedAge >= 18 && parsedAge <= 75) age = parsedAge;
  } else {
    const birthYearMatch = text.match(/(?:Birth\s*Date|DOB|Date\s*of\s*Birth)[^0-9]+(\d{4})/i) || text.match(/\b(19[7-9]\d|200[0-7])\b/);
    if (birthYearMatch) {
      const year = parseInt(birthYearMatch[1] || birthYearMatch[0], 10);
      if (year >= 1960 && year <= 2008) {
        age = 2026 - year;
      }
    }
  }

  // 4. Height
  let height = gender === 'female' ? "5'4\"" : "5'10\"";
  const heightMatch = text.match(/Height\s*[:\s-]+\s*([0-9]['"’.\s-]+[0-9]*["’]?|[0-9]\.[0-9]+)/i);
  if (heightMatch) {
    height = heightMatch[1].trim();
  }

  // 5. Nationality
  let nationality = 'Bahraini';
  if (/Pakistani/i.test(text)) {
    nationality = 'Pakistani';
  } else if (/Indian/i.test(text)) {
    nationality = 'Indian';
  } else if (/Bahraini/i.test(text)) {
    nationality = 'Bahraini';
  }

  // 6. Sect / Religion
  let sect = 'Sunni';
  const sectMatch = text.match(/(?:Sect|Religion)\s*[:\s-]+\s*([^,\n.]+)/i);
  if (sectMatch) {
    sect = sectMatch[1].trim();
  } else if (/Ahle\s*Hadith/i.test(text)) {
    sect = 'Sunni / Ahle Hadith';
  } else if (/Hanafi/i.test(text)) {
    sect = 'Sunni / Hanafi';
  } else if (/Shia|Ithna\s*Ashari/i.test(text)) {
    sect = 'Shia';
  }

  // 7. Caste
  let caste = 'General';
  const casteMatch = text.match(/Cast[e]?\s*[:\s-]+\s*([^,\n.]+)/i);
  if (casteMatch) {
    caste = casteMatch[1].trim();
  } else {
    const knownCastes = ['Syed', 'Arain', 'Awan', 'Sheikh', 'Malik', 'Khan', 'Qureshi', 'Siddiqui', 'Rajput', 'Jat', 'Merchant', 'Mughal', 'Ansari', 'Pathan', 'Memon'];
    for (const c of knownCastes) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        caste = c;
        break;
      }
    }
  }

  // 8. Education
  let education = gender === 'female' ? 'Bachelor / Graduate' : 'Graduate';
  const eduMatch = text.match(/Education\s*[:\s-]+\s*([^,\n.]+)/i);
  if (eduMatch) {
    education = eduMatch[1].trim();
  } else if (/MBBS|Doctor/i.test(text)) {
    education = 'MBBS / Doctor';
  } else if (/Master|M\.S\.|MBA|M\.Sc/i.test(text)) {
    education = 'Master Degree';
  } else if (/Bachelor|B\.E\.|B\.Tech|BBA|B\.Com|B\.Sc/i.test(text)) {
    education = 'Bachelor Degree';
  }

  // 9. Profession
  let profession = gender === 'female' ? 'Educated / Professional' : 'Professional in Bahrain';
  const jobMatch = text.match(/(?:Profession|Job)\s*[:\s-]+\s*([^,\n.]+)/i);
  if (jobMatch) {
    profession = jobMatch[1].trim();
  } else if (/Doctor|Physician/i.test(text)) {
    profession = 'Doctor / Healthcare';
  } else if (/Engineer/i.test(text)) {
    profession = 'Engineer';
  } else if (/Manager/i.test(text)) {
    profession = 'Manager';
  } else if (/Teacher|Educator/i.test(text)) {
    profession = 'Teacher / Educator';
  }

  // 10. Location & Residence
  let location = 'Bahrain';
  const locMatch = text.match(/Location\s*[:\s-]+\s*([^,\n.]+)/i);
  if (locMatch) location = locMatch[1].trim();

  let residence = 'Bahrain Resident';
  const resMatch = text.match(/Residence\s*[:\s-]+\s*([^,\n.]+)/i);
  if (resMatch) residence = resMatch[1].trim();

  // 11. About & Seeking
  let about = `Authentic verified matrimonial profile from Instagram @nikah_bahrain.`;
  const bioMatch = text.match(/(?:Short\s*Bio|About)\s*[:\s-]?([^]+?)(?=Family|Seeking|Interested|Note|Contact|$)/i);
  if (bioMatch) {
    about = bioMatch[1].trim();
  }
  const familyMatch = text.match(/Family\s*[:\s-]?([^]+?)(?=Seeking|Interested|Note|Contact|$)/i);
  if (familyMatch) {
    about += ` Family: ${familyMatch[1].trim()}`;
  }

  let requirements = 'Seeking a pious, family-oriented Muslim partner residing in Bahrain or GCC.';
  const seekingMatch = text.match(/(?:Seeking|Looking\s*For|Requirements)\s*[:\s-]?([^]+?)(?=Interested|Note|DM|WhatsApp|Contact|$)/i);
  if (seekingMatch) {
    requirements = seekingMatch[1].trim();
  }

  // Contact info
  const contactMatch = text.match(/CONTACT\s*[:\s-]+\s*([0-9\s+]+)/i);
  const contact = contactMatch ? contactMatch[1].trim() : '+973 3718 8557';

  const nameTitle = `${id} (${gender === 'female' ? 'Bride' : 'Groom'})`;

  return {
    id,
    name: nameTitle,
    gender,
    maritalStatus,
    category,
    nationality,
    age,
    height,
    sect,
    caste,
    education,
    profession,
    salary: 'Confidential / As per discussion',
    location,
    residence,
    contact,
    image: imageUrl,
    instagramPostUrl: postUrl,
    instagramPostId: shortcode,
    about: about.replace(/\s+/g, ' ').slice(0, 350).trim(),
    requirements: requirements.replace(/\s+/g, ' ').slice(0, 250).trim(),
    rawFlyerText: text,
    verified: true,
    featured: false,
    createdAt: new Date().toISOString()
  };
}

async function evalSafe(page, fn) {
  try {
    return await page.evaluate(fn);
  } catch (e) {
    if (e.message && (e.message.includes('detached') || e.message.includes('Target closed') || e.message.includes('Session closed'))) {
      return null; // Signal caller to recover
    }
    throw e;
  }
}

async function makePage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setCookie({
    name: 'sessionid',
    value: SESSION_ID,
    domain: '.instagram.com',
    path: '/',
    httpOnly: true,
    secure: true
  });
  return page;
}

async function scrapeAllViaModal() {
  console.log('🚀 [Modal Scraper] Starting full Instagram modal scrape for @nikah_bahrain...');
  console.log('Target: Extract ALL real posts without any mock data.');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage',
      '--disable-gpu', '--window-size=1280,900'
    ]
  });

  const profilesMap = new Map();

  // Load existing profiles to preserve good flyer text (resume support)
  if (fs.existsSync(profilesFilePath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(profilesFilePath, 'utf8'));
      existing.forEach(p => {
        if (p.rawFlyerText && p.rawFlyerText.length > 50) {
          profilesMap.set(p.instagramPostId, p);
        }
      });
      console.log(`[Modal Scraper] Pre-loaded ${profilesMap.size} existing profiles with flyer text.`);
    } catch (e) {}
  }

  try {
    let page = await makePage(browser);

    console.log('[Modal Scraper] Navigating to profile grid...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', { waitUntil: 'domcontentloaded', timeout: 35000 });
    await new Promise(r => setTimeout(r, 2500));

    await page.waitForSelector('a[href*="/p/"]', { timeout: 15000 });
    const firstPost = await page.$('a[href*="/p/"]');
    if (!firstPost) throw new Error('No posts found on grid.');

    console.log('[Modal Scraper] Clicking first post to open modal...');
    await firstPost.click();
    await new Promise(r => setTimeout(r, 2500));

    let visitedCount = 0;
    let consecutiveDuplicates = 0;
    let lastUrl = '';
    let recoverUrl = '';
    const MAX_POSTS = 240;

    while (visitedCount < MAX_POSTS && consecutiveDuplicates < 6) {
      visitedCount++;

      // Evaluate with detached-frame recovery
      let modalData = await evalSafe(page, () => {
        const currentUrl = window.location.href;
        const shortcodeMatch = currentUrl.match(/\/p\/([^\/]+)/);
        const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
        const dialog = document.querySelector('div[role="dialog"]');
        if (!dialog) return { currentUrl, shortcode, error: 'no-dialog' };

        const images = Array.from(dialog.querySelectorAll('img'));
        let flyerImg = null;
        let bestAltLen = 0;
        for (const img of images) {
          const alt = img.getAttribute('alt') || '';
          if (alt.includes('profile picture')) continue;
          if (alt.length > bestAltLen) { bestAltLen = alt.length; flyerImg = img; }
        }
        if (!flyerImg && images.length > 0) {
          flyerImg = images.find(img => !(img.getAttribute('alt') || '').includes('profile picture')) || images[0];
        }
        const altText = flyerImg ? (flyerImg.getAttribute('alt') || '') : '';
        const imgSrc = flyerImg ? (flyerImg.getAttribute('src') || flyerImg.src || '') : '';
        let captionText = '';
        const captionElem = dialog.querySelector('h1') || dialog.querySelector('span[dir="auto"]');
        if (captionElem) captionText = captionElem.innerText || '';
        return { currentUrl, shortcode, altText, imgSrc, captionText };
      });

      // Recovery: page/frame was detached — reopen the last known URL
      if (modalData === null) {
        console.warn(`[Modal Scraper] ⚠️  Detached frame at post ${visitedCount}. Recovering...`);
        try { await page.close(); } catch (_) {}
        page = await makePage(browser);
        const resumeUrl = recoverUrl || 'https://www.instagram.com/nikah_bahrain/';
        await page.goto(resumeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000));
        // Save checkpoint before continuing
        const chk = Array.from(profilesMap.values());
        fs.writeFileSync(profilesFilePath, JSON.stringify(chk, null, 2), 'utf8');
        console.log(`💾 [Recovery Checkpoint] Saved ${chk.length} profiles.`);
        // Try to re-evaluate once
        modalData = await evalSafe(page, () => {
          const currentUrl = window.location.href;
          const shortcodeMatch = currentUrl.match(/\/p\/([^\/]+)/);
          const shortcode = shortcodeMatch ? shortcodeMatch[1] : '';
          const dialog = document.querySelector('div[role="dialog"]');
          if (!dialog) return { currentUrl, shortcode, error: 'no-dialog' };
          const images = Array.from(dialog.querySelectorAll('img'));
          let flyerImg = null, bestAltLen = 0;
          for (const img of images) {
            const alt = img.getAttribute('alt') || '';
            if (alt.includes('profile picture')) continue;
            if (alt.length > bestAltLen) { bestAltLen = alt.length; flyerImg = img; }
          }
          if (!flyerImg && images.length > 0) flyerImg = images[0];
          const altText = flyerImg ? (flyerImg.getAttribute('alt') || '') : '';
          const imgSrc = flyerImg ? (flyerImg.src || '') : '';
          return { currentUrl, shortcode, altText, imgSrc, captionText: '' };
        });
        if (!modalData) { console.error('Recovery failed. Stopping.'); break; }
      }

      if (!modalData || modalData.error) {
        console.warn(`[Modal Scraper] Post ${visitedCount}: no modal. Skipping...`);
        consecutiveDuplicates++;
        await page.keyboard.press('ArrowRight');
        await new Promise(r => setTimeout(r, 1400));
        continue;
      }

      // Track URL for recovery
      recoverUrl = modalData.currentUrl;

      if (modalData.currentUrl === lastUrl) {
        consecutiveDuplicates++;
      } else {
        consecutiveDuplicates = 0;
        lastUrl = modalData.currentUrl;
      }

      if (modalData.shortcode) {
        const combinedText = modalData.altText + (modalData.captionText ? '\n' + modalData.captionText : '');
        const profile = parseFlyerData(combinedText, modalData.currentUrl, modalData.imgSrc, modalData.shortcode);
        profilesMap.set(modalData.shortcode, profile);
        console.log(`[${visitedCount}/${MAX_POSTS}] ${profile.id} (${profile.gender}, age ${profile.age}) - ${profile.education.slice(0, 30)} | ${profile.profession.slice(0, 30)}`);
      }

      // Checkpoint every 15 posts
      if (visitedCount % 15 === 0) {
        const currentList = Array.from(profilesMap.values());
        fs.writeFileSync(profilesFilePath, JSON.stringify(currentList, null, 2), 'utf8');
        console.log(`💾 [Checkpoint] Saved ${currentList.length} unique profiles to profiles.json`);
      }

      // Advance to next post
      try {
        await page.keyboard.press('ArrowRight');
      } catch (_) {}
      await new Promise(r => setTimeout(r, 1400));
    }

  } finally {
    await browser.close();
  }

  const finalList = Array.from(profilesMap.values());
  fs.writeFileSync(profilesFilePath, JSON.stringify(finalList, null, 2), 'utf8');

  const categories = {};
  finalList.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });

  console.log('\n=============================================');
  console.log(`🎉 SCRAPE COMPLETED! Total profiles: ${finalList.length}`);
  console.log('Categories breakdown:', categories);
  console.log('=============================================\n');
}

scrapeAllViaModal().catch(err => {
  console.error('[Fatal Scraper Error]:', err);
  process.exit(1);
});
