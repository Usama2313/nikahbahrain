import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const profilesFilePath = path.join(__dirname, '..', 'data', 'profiles.json');

const profiles = JSON.parse(fs.readFileSync(profilesFilePath, 'utf8'));

const ALL_HEADERS = [
  'Education', 'Qualification', 'Profession', 'Job', 'Occupation', 
  'Short Bio', 'Bio', 'About', 'Family', 'Father\'s', 'Father', 'Siblings', 
  'Seeking', 'Looking For', 'Looking', 'Requirements', 'Height', 'Age', 
  'Birth Date', 'Location', 'Residence', 'Languages', 'Language', 
  'Sect', 'Caste', 'Cast', 'Religion', 'Nationality', 'Marital Status', 
  'Interested In', 'Contact', 'Co', 'Note', 'Gender'
];

function extractField(text, keyPattern) {
  // matches KEY: value until next ALL_CAPS or standard header keyword or end of string
  const headerRegexStr = ALL_HEADERS.map(h => h.replace(/[']/g, "\\'")).join('|');
  const regex = new RegExp(`(?:${keyPattern})\\s*[:\\s-]+([\\s\\S]*?)(?=(?:${headerRegexStr})\\s*[:\\s-]|["“”]|\\bnikah_bahrain\\b|$)`, 'i');
  const match = text.match(regex);
  if (!match) return null;
  return match[1]
    .replace(/["“”‎]/g, '')
    .replace(/\bnikah_bahrain\b/gi, '')
    .replace(/Nikah\s*BAHRAIN/gi, '')
    .trim();
}

function cleanHeight(val, text) {
  const m = (val + ' ' + text).match(/(\d\s*['’]\s*\d{1,2}(?:"|'')?|\d\.\d{1,2}|\d{3}\s*cm)/i);
  if (m) {
    return m[1].replace(/["'’]/g, '').trim().replace(/\s+/, "'");
  }
  return val;
}

let count = 0;
for (const p of profiles) {
  const raw = p.rawFlyerText || '';
  if (!raw || raw.length < 25) continue;

  // 1. Education
  const edu = extractField(raw, 'Education|Qualification');
  if (edu) {
    p.education = edu.replace(/[:,-]+$/, '').trim();
  }

  // 2. Profession
  const prof = extractField(raw, 'Profession|Job|Occupation');
  if (prof) {
    p.profession = prof.replace(/[:,-]+$/, '').trim();
  } else if (/MBBS|Doctor/i.test(p.education)) {
    p.profession = 'Doctor / Healthcare';
  }

  // 3. Sect / Religion
  const sect = extractField(raw, 'Sect|Religion');
  if (sect) {
    p.sect = sect.replace(/[:,-]+$/, '').replace(/\.$/, '').trim();
  }

  // 4. Caste
  const caste = extractField(raw, 'Caste|Cast');
  if (caste) {
    p.caste = caste.replace(/[:,-]+$/, '').trim();
  }

  // 5. Nationality
  const nat = extractField(raw, 'Nationality');
  if (nat) {
    let cleanNat = nat.replace(/[:,-]+$/, '').trim();
    if (/Bahraini/i.test(cleanNat) && /Pakistani/i.test(cleanNat)) cleanNat = 'Bahraini / Pakistani';
    else if (/Pakistani/i.test(cleanNat)) cleanNat = 'Pakistani';
    else if (/Indian/i.test(cleanNat)) cleanNat = 'Indian';
    else if (/Bahraini/i.test(cleanNat)) cleanNat = 'Bahraini';
    p.nationality = cleanNat;
  }

  // 6. Height
  const h = extractField(raw, 'Height');
  if (h) {
    p.height = cleanHeight(h, raw);
  }

  // 7. Residence
  const res = extractField(raw, 'Residence');
  if (res) {
    p.residence = res.replace(/[:,-]+$/, '').trim();
  }

  // 8. Location
  const loc = extractField(raw, 'Location');
  if (loc) {
    p.location = loc.replace(/[:,-]+$/, '').trim();
  }

  // 9. Father / Siblings info enrich to about
  const father = extractField(raw, "Father\\'s|Father");
  const siblings = extractField(raw, 'Siblings');
  if (father || siblings) {
    let famDetails = [];
    if (father) famDetails.push(`Father: ${father}`);
    if (siblings) famDetails.push(`Siblings: ${siblings}`);
    const famStr = famDetails.join(' | ');
    if (!p.about.includes(famStr)) {
      p.about = `${p.about} (${famStr})`.trim();
    }
  }

  count++;
}

fs.writeFileSync(profilesFilePath, JSON.stringify(profiles, null, 2), 'utf8');
console.log(`✅ Polished ${count} profiles with comprehensive multi-format parser!`);
