/**
 * apply_scrape_results.js
 * Enriches server and client profiles.json with real data from scrape_results.json
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverJsonPath = path.join(__dirname, '../data/profiles.json');
const clientJsonPath = path.join(__dirname, '../../client/src/data/profiles.json');
const scrapeResultsPath = path.join(__dirname, 'scrape_results.json');

const profiles = JSON.parse(fs.readFileSync(serverJsonPath, 'utf8'));
const scraped = JSON.parse(fs.readFileSync(scrapeResultsPath, 'utf8'));

let updated = 0;

for (const s of scraped) {
  const p = profiles.find(x => 
    x.instagramPostId === s.shortcode || 
    x.instagramPostUrl?.includes(s.shortcode) || 
    x.id?.includes(s.shortcode)
  );
  if (!p) continue;

  const cap = (s.caption || '').trim();
  if (s.imageUrl && (!p.image || p.image.startsWith('data:'))) {
    p.image = s.imageUrl;
  }

  if (cap) {
    const lower = cap.toLowerCase();

    // Determine gender / category
    const isBride = /bride|sister/i.test(cap) && !/brother.*bride|looking for.*bride|need a bride/i.test(cap);
    const isGroom = /groom|brother/i.test(cap) && !/sister.*groom|looking for.*groom|wants a groom/i.test(cap);

    if (isBride) {
      p.category = 'brides';
      p.gender = 'female';
      if (p.name && p.name.includes('(Groom)')) {
        p.name = p.name.replace('(Groom)', '(Bride)');
      }
    } else if (isGroom) {
      p.category = 'grooms';
      p.gender = 'male';
      if (p.name && p.name.includes('(Bride)')) {
        p.name = p.name.replace('(Bride)', '(Groom)');
      }
    }

    // Determine nationality
    const hasBahraini = /bahraini|bahriani/i.test(cap);
    const hasPakistani = /pakistani/i.test(cap);
    const hasIndian = /indian|hyderabadi/i.test(cap);

    if (hasBahraini && hasPakistani) {
      p.nationality = 'Bahraini / Pakistani';
    } else if (hasBahraini && hasIndian) {
      p.nationality = 'Indian / Bahraini';
    } else if (hasPakistani) {
      p.nationality = 'Pakistani';
    } else if (hasIndian) {
      p.nationality = 'Indian';
    } else if (hasBahraini) {
      p.nationality = 'Bahraini';
    }

    // Determine marital status
    if (/2nd marriage|second marriage/i.test(cap)) {
      p.maritalStatus = 'Second Marriage';
    } else if (/khula|divorce/i.test(cap)) {
      p.maritalStatus = 'Divorced / Khula';
    }

    // Update about / rawFlyerText
    p.rawFlyerText = cap;
    if (!p.about || p.about.includes('Official matrimonial post')) {
      p.about = cap;
    }

    updated++;
  }
}

fs.writeFileSync(serverJsonPath, JSON.stringify(profiles, null, 2), 'utf8');
fs.writeFileSync(clientJsonPath, JSON.stringify(profiles, null, 2), 'utf8');

console.log(`✅ Successfully updated ${updated} profiles with scraped captions in server and client.`);
