import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_DATA_PATH = path.join(__dirname, '..', 'data', 'profiles.json');
const CLIENT_DATA_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');
const CLIENT_UPLOADS = path.join(__dirname, '..', '..', 'client', 'public');

const profiles = JSON.parse(fs.readFileSync(SERVER_DATA_PATH, 'utf8'));
console.log(`Loaded ${profiles.length} profiles.`);

// Known duplicate hashes
const DUP_HASH_NPF173_GROOM = '51d848a994fa38cd16b66a6e9d270bd7';
const DUP_HASH_NPF177_FARHANA = 'dbb4bdc6a962e917d72539cfaca2b9df';
const DUP_HASH_3 = '491b9e78b44f488264c67b02f38eb965';

function getFileHash(relPath) {
  if (!relPath) return null;
  const fullPath = path.join(CLIENT_UPLOADS, relPath);
  if (!fs.existsSync(fullPath)) return null;
  try {
    return crypto.createHash('md5').update(fs.readFileSync(fullPath)).digest('hex');
  } catch (_) {
    return null;
  }
}

function cleanOcrNoise(str) {
  if (!str) return '';
  return str
    .replace(/[\u1000-\u109F\uAA60-\uAA7F\uA9E0-\uA9FF\u4E00-\u9FFF\u3040-\u309F\u30A0-\u30FF]/g, '') // Burmese, Chinese, Japanese OCR glitches
    .replace(/["“”'’‎]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALL_HEADERS = [
  'Education', 'Qualification', 'Profession', 'Job', 'Occupation', 'Business',
  'Short Bio', 'Bio', 'About', 'Family', "Father's Occupation", "Father's", "Father Name", 'Father',
  "Mother's Occupation", "Mother's", "Mother Name", 'Mother',
  'Siblings', 'Sibling', 'No. Siblings', 'No Siblings', 'Seeking', 'Looking For', 'Looking',
  'Partner Requirement', 'Requirements', 'Height', 'Age', 'Birth Date', 'Date of Birth',
  'Location', 'Residence', 'Current Residence', 'Languages', 'Language',
  'Sect', 'Religious Sect', 'Caste', 'Cast', 'Religion', 'Nationality',
  'Marital Status', 'Interested In', 'Contact', 'Gender', 'Complexion', 'Build'
];

function extractField(text, keyPattern) {
  if (!text) return null;
  const headerRegexStr = ALL_HEADERS.map(h => h.replace(/['.]/g, "\\$&")).join('|');
  const regex = new RegExp(`(?:${keyPattern})\\s*[:\\s-]+([\\s\\S]*?)(?=(?:${headerRegexStr})\\s*[:\\s-]|["“”]|\\bnikah_bahrain\\b|\\bNIKAH BAHRAIN\\b|$)`, 'i');
  const match = text.match(regex);
  if (!match) return null;
  return cleanOcrNoise(match[1])
    .replace(/\bnikah_bahrain\b/gi, '')
    .replace(/\bNIKAH\s*BAHRAIN\b/gi, '')
    .replace(/^[:\-–\s]+/, '')
    .replace(/[;:]+$/, '')
    .trim();
}

let clearedImageCount = 0;
let updatedFieldCount = 0;

for (const p of profiles) {
  // 1. Remove duplicate/fake image assignments
  if (p.image) {
    const hash = getFileHash(p.image);
    if (hash === DUP_HASH_NPF173_GROOM) {
      // 51d8... is NPF173 Groom flyer. Clear from any profile that is not NPF-173
      if (p.id !== 'NPF-173') {
        p.image = null;
        clearedImageCount++;
      }
    } else if (hash === DUP_HASH_NPF177_FARHANA) {
      // dbb4... is duplicate low-res copy of NPF177 Farhana Shamim. Clear from any profile that is not NPF-177
      // (and NPF-177 already has its high-res image ig_DdYHLqto7OH.jpg)
      if (p.id !== 'NPF-177') {
        p.image = null;
        clearedImageCount++;
      }
    } else if (hash === DUP_HASH_3) {
      p.image = null;
      clearedImageCount++;
    }
  }

  // 2. Parse and enrich fields from rawFlyerText if available
  const raw = p.rawFlyerText || '';
  if (raw && raw.length > 25) {
    // Gender
    const isBride = /\b(BRIDE|FEMALE|Girl|Daughter|Sister)\b/i.test(raw);
    const isGroom = /\b(GROOM|MALE|Boy|Son|Brother)\b/i.test(raw);
    if (isBride && !isGroom) {
      p.gender = 'female';
      p.category = p.maritalStatus === 'Divorced' ? 'divorced-brides' : 'brides';
    } else if (isGroom && !isBride) {
      p.gender = 'male';
      p.category = p.maritalStatus === 'Divorced' ? 'divorced-grooms' : 'grooms';
    }

    // Age
    const ageMatch = raw.match(/\bAGE\s*[:\s-]+\s*(\d{2})\b/i) || raw.match(/\b(\d{2})\s*years?\s*old\b/i);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1]);
      if (parsedAge >= 18 && parsedAge <= 70) {
        p.age = parsedAge;
      }
    }

    // Height
    const h = extractField(raw, 'Height');
    if (h) {
      const hm = h.match(/(\d\s*['’]\s*\d{1,2}(?:"|'')?|\d\.\d{1,2}\s*ft|\d{3}\s*cm|\d\s*feet(?:\s*\d+\s*inches)?)/i);
      if (hm) {
        let cleanH = hm[1].replace(/["'’]/g, '').trim().replace(/\s+/, "'");
        if (/^\d{2}$/.test(cleanH)) cleanH = cleanH[0] + "'" + cleanH[1] + '"';
        else if (!cleanH.includes('"') && cleanH.includes("'")) cleanH += '"';
        p.height = cleanH;
      }
    }

    // Marital Status
    const ms = extractField(raw, 'Marital Status');
    if (ms) {
      if (/Never Married|Single|Unmarried/i.test(ms)) p.maritalStatus = 'Never Married';
      else if (/Divorced/i.test(ms)) p.maritalStatus = 'Divorced';
      else if (/Widow(ed)?/i.test(ms)) p.maritalStatus = 'Widowed';
      else if (/2nd Marriage|Second/i.test(ms)) p.maritalStatus = '2nd Marriage';
      else if (/Separated/i.test(ms)) p.maritalStatus = 'Separated';
    }

    // Nationality
    const nat = extractField(raw, 'Nationality');
    if (nat && nat.length < 40) {
      let cleanNat = nat.replace(/[:,-]+$/, '').trim();
      if (/Bahraini/i.test(cleanNat) && /Pakistani/i.test(cleanNat)) cleanNat = 'Bahraini / Pakistani';
      else if (/Pakistani/i.test(cleanNat)) cleanNat = 'Pakistani';
      else if (/Indian/i.test(cleanNat)) cleanNat = 'Indian';
      else if (/Bahraini/i.test(cleanNat)) cleanNat = 'Bahraini';
      else if (/Saudi/i.test(cleanNat)) cleanNat = 'Saudi Arabia';
      p.nationality = cleanNat;
    }

    // Education
    const edu = extractField(raw, 'Qualification|Education');
    if (edu && edu.length < 100 && !edu.toLowerCase().includes('partner')) {
      p.education = cleanOcrNoise(edu);
    }

    // Profession
    const prof = extractField(raw, 'Occupation|Profession|Job|Business');
    if (prof && prof.length < 100 && !prof.toLowerCase().includes('father') && !prof.toLowerCase().includes('mother')) {
      p.profession = cleanOcrNoise(prof);
    }

    // Father
    const father = extractField(raw, "Father's Occupation|Father\\'s Occupation|Father's Name|Father\\'s|Father");
    if (father && father.length < 90 && !father.toLowerCase().includes('not mentioned') && !father.toLowerCase().includes('mother')) {
      p.father = cleanOcrNoise(father);
    }

    // Mother
    const mother = extractField(raw, "Mother's Occupation|Mother\\'s Occupation|Mother's Name|Mother\\'s|Mother");
    if (mother && mother.length < 90 && !mother.toLowerCase().includes('not mentioned')) {
      p.mother = cleanOcrNoise(mother);
    }

    // Siblings
    const sib = extractField(raw, 'No. Siblings|No Siblings|No. of Siblings|Siblings');
    if (sib && sib.length < 100) {
      p.siblings = cleanOcrNoise(sib);
    }

    // Sect
    const sect = extractField(raw, 'Religious Sect|Sect|Faith');
    if (sect && sect.length < 40) {
      p.sect = cleanOcrNoise(sect);
    }

    // Languages
    const lang = extractField(raw, 'Languages|Language');
    if (lang && lang.length < 60) {
      p.languages = cleanOcrNoise(lang);
    }

    // Residence
    const res = extractField(raw, 'Current Residence|Residence');
    if (res && res.length < 70) {
      p.residence = cleanOcrNoise(res);
    }

    // Requirements
    const req = extractField(raw, 'Partner Requirement|Requirements|Looking For|Seeking');
    if (req && req.length > 5 && req.length < 300) {
      p.requirements = cleanOcrNoise(req);
    }

    // Candidate Real Name (if flyer has an explicit candidate name)
    const nameMatch = raw.match(/\bNAME\s*[:\s-]+\s*([A-Za-z\s]+?)(?=(?:AGE|EDUCATION|QUALIFICATION|HEIGHT|RESIDENCE|LOOKING|PROFESSION|MARITAL)\b|[:\n]|$)/i);
    if (nameMatch) {
      const rawName = nameMatch[1].trim();
      if (rawName && rawName.length > 2 && rawName.length < 35 && !/^(Bride|Groom|Not Mentioned|None|Profile|NPF\d+)$/i.test(rawName)) {
        p.name = `${rawName} (${p.gender === 'male' ? 'Groom' : 'Bride'})`;
      }
    }

    updatedFieldCount++;
  }

  // 3. Ensure candidate name is unique and informative
  // Replace generic identical names like "Bahraini Bride" with unique identifiable label
  const isGeneric = /^(Pakistani|Indian|Bahraini|Saudi|Emirati|\s*)\s*(Bride|Groom)/i.test((p.name || '').trim())
    || /^(IG-|NPF-)/i.test((p.name || '').trim())
    || !p.name;

  if (isGeneric) {
    const genderLabel = p.gender === 'male' ? 'Groom' : 'Bride';
    const natLabel = p.nationality ? `${p.nationality} ` : '';
    p.name = `${p.id} · ${natLabel}${genderLabel}`;
    if (p.maritalStatus && p.maritalStatus !== 'Never Married') {
      p.name += ` (${p.maritalStatus})`;
    }
  }

  // Clean about field - ensure no raw Instagram alt-text remains
  if (p.about && /^Photo by Nikah Bahrain/i.test(p.about.trim())) {
    p.about = '';
  }

  // If about is empty but requirements exists, or construct a clean bio from verified fields
  if (!p.about || p.about.trim() === '') {
    const parts = [];
    if (p.age) parts.push(`${p.age} years old`);
    if (p.maritalStatus) parts.push(p.maritalStatus);
    if (p.nationality) parts.push(`${p.nationality} national`);
    if (p.residence) parts.push(`residing in ${p.residence}`);
    if (p.profession) parts.push(`working as ${p.profession}`);
    if (p.education) parts.push(`educated with ${p.education}`);
    if (parts.length > 0) {
      p.about = `${p.gender === 'male' ? 'Groom' : 'Bride'} candidate (${p.id}): ${parts.join(', ')}.`;
    }
  }
}

// Write back to both files
fs.writeFileSync(SERVER_DATA_PATH, JSON.stringify(profiles, null, 2), 'utf8');
fs.writeFileSync(CLIENT_DATA_PATH, JSON.stringify(profiles, null, 2), 'utf8');

console.log(`\n=== RESULTS ===`);
console.log(`Cleared fake duplicate images from: ${clearedImageCount} profiles`);
console.log(`Updated/Enriched fields for: ${updatedFieldCount} profiles`);
console.log(`Total profiles with authentic image: ${profiles.filter(p => p.image).length}`);
console.log(`Total profiles saved: ${profiles.length}`);
