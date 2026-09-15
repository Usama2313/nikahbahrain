import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverFilePath = path.join(__dirname, '..', 'data', 'profiles.json');
const clientFilePath = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');

const profiles = JSON.parse(fs.readFileSync(serverFilePath, 'utf8'));

const ALL_HEADERS = [
  'Education', 'Qualification', 'Profession', 'Job', 'Occupation', 'Business',
  'Short Bio', 'Bio', 'About', 'Family', "Father's", 'Father', 'Mother',
  'Siblings', 'Sibling', 'No. Siblings', 'No Siblings', 'Seeking', 'Looking For', 'Looking',
  'Partner Requirement', 'Requirements', 'Height', 'Age', 'Birth Date', 'Date of Birth',
  'Location', 'Residence', 'Current Residence', 'Languages', 'Language',
  'Sect', 'Religious Sect', 'Caste', 'Cast', 'Religion', 'Nationality',
  'Marital Status', 'Interested In', 'Contact', 'Note', 'Gender', 'Complexion', 'Build', 'Her', 'His'
];

function extractField(text, keyPattern) {
  if (!text) return null;
  const headerRegexStr = ALL_HEADERS.map(h => h.replace(/['.]/g, "\\$&")).join('|');
  const regex = new RegExp(`(?:${keyPattern})\\s*[:\\s-]+([\\s\\S]*?)(?=(?:${headerRegexStr})\\s*[:\\s-]|["“”]|\\bnikah_bahrain\\b|\\bNIKAH BAHRAIN\\b|$)`, 'i');
  const match = text.match(regex);
  if (!match) return null;
  return match[1]
    .replace(/["“”‎]/g, '')
    .replace(/\bnikah_bahrain\b/gi, '')
    .replace(/\bNIKAH\s*BAHRAIN\b/gi, '')
    .replace(/^[:\-–\s]+/, '')
    .replace(/[;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHeight(val, text) {
  const m = (val + ' ' + text).match(/(\d\s*['’]\s*\d{1,2}(?:"|'')?|\d\.\d{1,2}|\d{3}\s*cm|\d\s*feet(?:\s*\d+\s*inches)?)/i);
  if (m) {
    return m[1].replace(/["'’]/g, '').trim().replace(/\s+/, "'");
  }
  return val;
}

let count = 0;
for (const p of profiles) {
  const raw = p.rawFlyerText || '';
  if (!raw || raw.length < 20) continue;

  // 1. Candidate Name
  const nameVal = extractField(raw, 'Name');
  if (nameVal && !nameVal.toLowerCase().includes('not mentioned') && nameVal.length < 35) {
    const cleanN = nameVal.replace(/^(Mr|Miss|Ms|Dr)\.?\s*/i, '').trim();
    if (cleanN && !cleanN.toLowerCase().includes('education') && !cleanN.toLowerCase().includes('age')) {
      p.name = `${cleanN} (${p.gender === 'female' ? 'Bride' : 'Groom'})`;
    }
  }

  // 2. Education
  const edu = extractField(raw, 'Education|Qualification');
  if (edu && edu.length < 90) {
    p.education = edu.replace(/[:,-]+$/, '').trim();
  }

  // 3. Profession / Occupation / Business
  const prof = extractField(raw, 'Occupation Business|Profession|Job|Occupation|Business');
  if (prof && prof.length < 90) {
    p.profession = prof.replace(/[:,-]+$/, '').trim();
  } else if (/MBBS|Doctor/i.test(p.education)) {
    p.profession = 'Doctor / Healthcare';
  }

  // 4. Sect
  const sect = extractField(raw, 'Religious Sect|Sect|Religion');
  if (sect && sect.length < 40) {
    p.sect = sect.replace(/[:,-]+$/, '').replace(/\.$/, '').trim();
  }

  // 5. Caste
  const caste = extractField(raw, 'Caste|Cast');
  if (caste && caste.length < 40 && !caste.toLowerCase().includes('not mentioned')) {
    p.caste = caste.replace(/[:,-]+$/, '').trim();
  }

  // 6. Nationality
  const nat = extractField(raw, 'Nationality');
  if (nat && nat.length < 50) {
    let cleanNat = nat.replace(/[:,-]+$/, '').trim();
    if (/Bahraini/i.test(cleanNat) && /Pakistani/i.test(cleanNat)) cleanNat = 'Bahraini / Pakistani';
    else if (/Pakistani/i.test(cleanNat)) cleanNat = 'Pakistani';
    else if (/Indian/i.test(cleanNat)) cleanNat = 'Indian';
    else if (/Bahraini/i.test(cleanNat)) cleanNat = 'Bahraini';
    else if (/Saudi/i.test(cleanNat)) cleanNat = 'Saudi Arabia';
    p.nationality = cleanNat;
  }

  // 7. Height
  const h = extractField(raw, 'Height');
  if (h) {
    p.height = cleanHeight(h, raw);
  }

  // 8. Marital Status
  const ms = extractField(raw, 'Marital Status');
  if (ms) {
    if (/Single|Never Married/i.test(ms)) p.maritalStatus = 'Never Married';
    else if (/Divorced/i.test(ms)) p.maritalStatus = 'Divorced';
    else if (/Widow(ed)?/i.test(ms)) p.maritalStatus = 'Widowed';
    else if (/2nd Marriage|Second/i.test(ms)) p.maritalStatus = '2nd Marriage';
  }

  // 9. Residence
  const res = extractField(raw, 'Current Residence|Residence');
  if (res && res.length < 70) {
    p.residence = res.replace(/[:,-]+$/, '').trim();
  }

  // 10. Location
  const loc = extractField(raw, 'Location|Current City');
  if (loc && loc.length < 60) {
    p.location = loc.replace(/[:,-]+$/, '').trim();
  }

  // 11. Father details
  const father = extractField(raw, "Father Name|Father\\'s Name|Father\\'s|Father");
  if (father && father.length < 80 && !father.toLowerCase().includes('not mentioned')) {
    p.father = father;
  }

  // 12. Mother details
  const mother = extractField(raw, "Mother Name|Mother\\'s Name|Mother\\'s|Mother");
  if (mother && mother.length < 80) {
    p.mother = mother;
  }

  // 13. Siblings details
  const siblings = extractField(raw, 'No\\. Siblings|No Siblings|No\\. of Siblings|Siblings');
  if (siblings && siblings.length < 100) {
    p.siblings = siblings;
  }

  // 14. Partner Requirements / Looking for
  const req = extractField(raw, 'Looking For|Partner Requirement|Requirements|Seeking');
  if (req && req.length > 5) {
    p.requirements = req;
  }

  // 15. Bio / Her / His / About
  const herBio = extractField(raw, 'Her|His');
  if (herBio && herBio.length > 10) {
    p.about = herBio;
    if (/fair/i.test(herBio)) p.complexion = 'Fair';
    else if (/wheatish/i.test(herBio)) p.complexion = 'Wheatish';
  }

  count++;
}

// Write to both server and client data folders
fs.writeFileSync(serverFilePath, JSON.stringify(profiles, null, 2), 'utf8');
if (fs.existsSync(clientFilePath)) {
  fs.writeFileSync(clientFilePath, JSON.stringify(profiles, null, 2), 'utf8');
}

console.log(`Successfully parsed and enriched ${count} profiles across server & client!`);
