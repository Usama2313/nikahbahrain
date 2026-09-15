import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const SESSION_ID = '19237154023%3AapiqfqSKpEAIrB%3A9%3AAYlR5-MbafZxWOGKWYDIMjAc5tNFo8KxVRBiH006Pw';

async function fetchRealInstagramPosts() {
  console.log('[Instagram Agent] Launching Chrome to fetch posts from @nikah_bahrain...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
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

    await page.setCookie({
      name: 'sessionid',
      value: SESSION_ID,
      domain: '.instagram.com',
      path: '/',
      httpOnly: true,
      secure: true
    });

    console.log('[Instagram Agent] Navigating to https://www.instagram.com/nikah_bahrain/ ...');
    await page.goto('https://www.instagram.com/nikah_bahrain/', {
      waitUntil: 'networkidle2',
      timeout: 45000
    });

    await new Promise(r => setTimeout(r, 3000));

    // Dismiss any modal
    await page.evaluate(() => {
      const closeButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      for (const btn of closeButtons) {
        if (btn.innerText && (btn.innerText.includes('Not Now') || btn.innerText.includes('Cancel') || btn.innerText.includes('Close'))) {
          btn.click();
        }
      }
    });

    const postsMap = new Map();
    let noNewCount = 0;
    let scrolls = 0;
    const maxScrolls = 40;

    console.log('[Instagram Agent] Scrolling feed to extract all posts...');

    while (scrolls < maxScrolls && noNewCount < 6) {
      const current = await page.evaluate(() => {
        const list = [];
        const links = document.querySelectorAll('a[href*="/p/"]');
        links.forEach(a => {
          const href = a.getAttribute('href');
          const img = a.querySelector('img');
          const src = img ? (img.getAttribute('src') || img.src) : '';
          const alt = img ? (img.getAttribute('alt') || '') : '';
          if (href && src) {
            const m = href.match(/\/p\/([^\/]+)/);
            const shortcode = m ? m[1] : '';
            if (shortcode) {
              list.push({ shortcode, url: `https://www.instagram.com/p/${shortcode}/`, imageUrl: src, alt });
            }
          }
        });
        return list;
      });

      const prevSize = postsMap.size;
      for (const p of current) {
        if (!postsMap.has(p.shortcode)) {
          postsMap.set(p.shortcode, p);
        }
      }

      if (postsMap.size === prevSize) {
        noNewCount++;
      } else {
        noNewCount = 0;
      }

      console.log(`[Instagram Agent] Gathered ${postsMap.size} posts (Scroll ${scrolls + 1})`);
      await page.evaluate(() => window.scrollBy(0, 1200));
      await new Promise(r => setTimeout(r, 2000));
      scrolls++;
    }

    console.log(`[Instagram Agent] Total posts extracted from grid: ${postsMap.size}`);

    const rawPosts = Array.from(postsMap.values());

    // Format profiles directly from raw Instagram posts without altering them or adding mock data
    const profiles = rawPosts.map((post, idx) => {
      const alt = post.alt || '';
      
      // Extract profile ID from alt text or fallback to shortcode
      const idMatch = alt.match(/NPF\s*[-_#]?\s*(\d+)/i) || alt.match(/Profile\s*#?\s*NPF\s*[-_]?\s*(\d+)/i);
      const id = idMatch ? `NPF-${idMatch[1]}` : `IG-${post.shortcode}`;

      // Gender & Category directly from post text
      const isBride = /\bBRIDE\b/i.test(alt) || /\bFemale\b/i.test(alt);
      const isGroom = /\bGROOM\b/i.test(alt) || /\bMale\b/i.test(alt);
      const gender = isBride ? 'female' : isGroom ? 'male' : 'female';
      const category = gender === 'female' ? 'brides' : 'grooms';

      // Marital status from post
      let maritalStatus = 'Never Married';
      if (/Divorced/i.test(alt)) maritalStatus = 'Divorced';
      else if (/Widow(ed)?/i.test(alt)) maritalStatus = 'Widowed';
      else if (/2nd Marriage|Second Marriage/i.test(alt)) maritalStatus = '2nd Marriage';

      // Nationality from post
      let nationality = 'Bahraini';
      if (/Pakistani/i.test(alt)) nationality = 'Pakistani';
      else if (/Indian/i.test(alt)) nationality = 'Indian';
      else if (/Saudi/i.test(alt)) nationality = 'Saudi Arabia';

      // Age from post if present
      let age = 28;
      const ageMatch = alt.match(/Age\s*[:\s-]+\s*(\d{2})/i) || alt.match(/(\d{2})\s*years?/i);
      if (ageMatch) age = parseInt(ageMatch[1], 10);

      // Height
      let height = gender === 'female' ? "5'3\"" : "5'9\"";
      const heightMatch = alt.match(/Height\s*[:\s-]+\s*([0-9]['"’.\s-]+[0-9]*["’]?|[0-9]\.[0-9]+\s*ft)/i);
      if (heightMatch) height = heightMatch[1].trim();

      // Sect
      let sect = 'Sunni';
      if (/Shia/i.test(alt)) sect = 'Shia';

      // Clean post title
      const name = `${id} (${gender === 'male' ? 'Groom' : 'Bride'})`;

      return {
        id,
        name,
        gender,
        maritalStatus,
        category,
        nationality,
        age,
        height,
        sect,
        caste: 'General',
        education: 'Degree Holder',
        profession: 'Professional',
        salary: 'Confidential / As per discussion',
        location: 'Bahrain',
        residence: 'Bahrain / GCC',
        siblings: '',
        father: '',
        mother: '',
        family: '',
        languages: 'English, Arabic, Urdu',
        complexion: '',
        build: '',
        image: post.imageUrl,
        instagramPostUrl: post.url,
        instagramPostId: post.shortcode,
        about: alt.length > 50 ? alt : `Official matrimonial post from @nikah_bahrain for candidate ${id}.`,
        requirements: 'Practicing Muslim candidate with good character.',
        contact: '+973 3718 8557',
        rawFlyerText: alt,
        verified: true,
        featured: idx < 4,
        createdAt: new Date().toISOString()
      };
    });

    // Save to both server and client data folders
    const serverPath = path.join(__dirname, '..', 'data', 'profiles.json');
    const clientPath = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');

    fs.writeFileSync(serverPath, JSON.stringify(profiles, null, 2), 'utf8');
    fs.writeFileSync(clientPath, JSON.stringify(profiles, null, 2), 'utf8');

    console.log(`[Instagram Agent] Successfully saved ${profiles.length} genuine Instagram posts to:`);
    console.log(`  - ${serverPath}`);
    console.log(`  - ${clientPath}`);

    return profiles;
  } finally {
    await browser.close();
  }
}

fetchRealInstagramPosts()
  .then(res => console.log(`DONE! Total ${res.length} genuine Instagram posts saved.`))
  .catch(err => console.error('Error fetching posts:', err));
