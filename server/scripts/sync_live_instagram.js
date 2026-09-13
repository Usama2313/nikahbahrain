import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

export function parseProfileFromAltText(post) {
  const text = post.alt || '';

  // 1. Extract Profile ID (e.g. NPF110, NPF168, NPF166)
  const idMatch = text.match(/NPF\s*[-_]?\s*(\d+)/i) || post.shortcode;
  const rawId = typeof idMatch === 'string' ? idMatch : (idMatch[0] ? idMatch[0].replace(/\s+/g, '').toUpperCase() : `NB-${post.shortcode}`);
  const id = rawId.startsWith('NPF') ? rawId.replace('NPF', 'NPF-') : rawId;

  // 2. Gender & Category
  const isMale = /GROOM|Gender\s*:\s*Male|Male/i.test(text) && !/BRIDE/i.test(text.substring(0, 100));
  const isFemale = /BRIDE|Gender\s*:\s*Female|Female/i.test(text);
  const gender = isFemale ? 'female' : 'male';

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
  let category = 'grooms';
  if (maritalStatus === 'Divorced') {
    category = gender === 'male' ? 'divorced-grooms' : 'divorced-brides';
  } else if (maritalStatus === 'Widowed') {
    category = gender === 'male' ? 'widowed-grooms' : 'widowed-brides';
  } else {
    category = gender === 'male' ? 'grooms' : 'brides';
  }

  // 3. Age
  let age = 28;
  const ageMatch = text.match(/Age\s*:\s*(?:Originally\s*)?(\d{2})/i) || text.match(/(\d{2})\s*years?/i);
  if (ageMatch) {
    age = parseInt(ageMatch[1], 10);
  } else {
    const birthYearMatch = text.match(/(?:19\d{2}|20\d{2})/);
    if (birthYearMatch) {
      const year = parseInt(birthYearMatch[0], 10);
      if (year > 1960 && year < 2010) {
        age = 2026 - year;
      }
    }
  }

  // 4. Height
  let height = gender === 'male' ? "5'10\"" : "5'4\"";
  const heightMatch = text.match(/Height\s*:\s*([0-9]['"’.\s-]+[0-9]*["’]?|[0-9]\.[0-9]+)/i);
  if (heightMatch) {
    height = heightMatch[1].trim();
  }

  // 5. Nationality
  let nationality = 'Pakistani';
  if (/Indian/i.test(text)) {
    nationality = 'Indian';
  } else if (/Bahraini/i.test(text)) {
    nationality = 'Bahraini';
  } else if (/Pakistani/i.test(text)) {
    nationality = 'Pakistani';
  }

  // 6. Sect / Religion
  let sect = 'Sunni';
  const sectMatch = text.match(/(?:Sect|Religion)\s*:\s*([^,\n.]+)/i);
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
  const casteMatch = text.match(/Cast[e]?\s*:\s*([^,\n.]+)/i);
  if (casteMatch) {
    caste = casteMatch[1].trim();
  } else {
    const knownCastes = ['Syed', 'Arain', 'Awan', 'Sheikh', 'Malik', 'Khan', 'Qureshi', 'Siddiqui', 'Rajput', 'Jat', 'Merchant'];
    for (const c of knownCastes) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        caste = c;
        break;
      }
    }
  }

  // 8. Education
  let education = 'Graduate';
  const eduMatch = text.match(/Education\s*:\s*([^,\n.]+)/i);
  if (eduMatch) {
    education = eduMatch[1].trim();
  } else if (/MBBS|Doctor/i.test(text)) {
    education = 'MBBS / Doctor';
  } else if (/Master|M\.S\.|MBA|M\.Sc/i.test(text)) {
    education = 'Master Degree';
  } else if (/Bachelor|B\.E\.|B\.Tech|BBA/i.test(text)) {
    education = 'Bachelor Degree';
  }

  // 9. Profession / Job
  let profession = gender === 'male' ? 'Professional in Bahrain' : 'Qualified Candidate in Bahrain';
  const jobMatch = text.match(/(?:Profession|Job)\s*:\s*([^,\n.]+)/i);
  if (jobMatch) {
    profession = jobMatch[1].trim();
  }

  // 10. Location & Residence
  let location = 'Bahrain';
  const locMatch = text.match(/Location\s*:\s*([^,\n.]+)/i);
  if (locMatch) {
    location = locMatch[1].trim();
  }
  let residence = 'Bahrain Resident';
  const resMatch = text.match(/Residence\s*:\s*([^,\n.]+)/i);
  if (resMatch) {
    residence = resMatch[1].trim();
  }

  // 11. About & Seeking
  let about = `Verified marriage profile from Instagram @nikah_bahrain.`;
  const bioMatch = text.match(/(?:Short\s*Bio|About)\s*:?([^]+?)(?=Family|Seeking|Interested|Note|$)/i);
  if (bioMatch) {
    about = bioMatch[1].trim();
  }
  const familyMatch = text.match(/Family\s*:?([^]+?)(?=Seeking|Interested|Note|$)/i);
  if (familyMatch) {
    about += ` Family: ${familyMatch[1].trim()}`;
  }

  let requirements = 'Seeking a practicing, family-oriented partner residing in Bahrain or GCC.';
  const seekingMatch = text.match(/(?:Seeking|Looking\s*For|Requirements)\s*:?([^]+?)(?=Interested|Note|DM|WhatsApp|$)/i);
  if (seekingMatch) {
    requirements = seekingMatch[1].trim();
  }

  const nameTitle = `${rawId} (${gender === 'female' ? 'Bride' : 'Groom'})`;

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
    image: post.imageUrl,
    instagramPostUrl: post.url,
    instagramPostId: post.shortcode,
    about: about.replace(/\s+/g, ' ').trim(),
    requirements: requirements.replace(/\s+/g, ' ').trim(),
    rawFlyerText: text,
    verified: true,
    featured: false,
    createdAt: new Date().toISOString()
  };
}

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
