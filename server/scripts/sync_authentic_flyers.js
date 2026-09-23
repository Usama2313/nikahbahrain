import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientJsonPath = path.join(__dirname, '../../client/src/data/profiles.json');
const serverJsonPath = path.join(__dirname, '../data/profiles.json');

const profiles = JSON.parse(fs.readFileSync(clientJsonPath, 'utf8'));
console.log(`Initial profiles count: ${profiles.length}`);

function cleanField(str) {
  if (!str) return '';
  return str
    .replace(/^[:\-–\s]+/, '')
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFlyerDetails(text) {
  if (!text || typeof text !== 'string') return {};
  const t = text;
  const res = {};

  // 1. Age / DOB
  const ageMatch = t.match(/\bAGE\s*[:\s-]+\s*\(?(?:Originally\s*)?(\d{2})\)?/i) ||
                   t.match(/\bAge\s*[:\s-]*\(?(\d{2})\)?/i) ||
                   t.match(/\b(\d{2})\s*years?\s*old\b/i);
  if (ageMatch) {
    const a = parseInt(ageMatch[1], 10);
    if (a >= 18 && a <= 75) res.age = a;
  } else {
    const dobMatch = t.match(/(?:DATE\s*OF\s*BIRTH|DOB)\s*[:\s-]*.*?\b(19\d{2}|200\d)\b/i);
    if (dobMatch) {
      const year = parseInt(dobMatch[1], 10);
      if (year >= 1960 && year <= 2008) res.age = 2026 - year;
    }
  }

  // 2. Height
  const hMatch = t.match(/HEIGHT\s*[:\s-]*([56]['’\.]\d{1,2}(?:\"|''|\s*ft|\s*feet)?|\d{3}\s*cm)/i);
  if (hMatch) res.height = cleanField(hMatch[1]);

  // 3. Gender
  if (/\b(?:BRIDE|FEMALE|SISTER)\b/i.test(t.slice(0, 350)) || /LOOKING FOR.*GROOM/i.test(t)) {
    res.gender = 'female';
  } else if (/\b(?:GROOM|MALE|BROTHER)\b/i.test(t.slice(0, 350)) || /LOOKING FOR.*BRIDE/i.test(t)) {
    res.gender = 'male';
  }

  // 4. Marital Status
  if (/2nd\s*(?:wife|marriage)|seeking\s*second\s*wife|second\s*marriage/i.test(t)) {
    res.maritalStatus = '2nd Marriage';
  } else if (/divorce[d]?|khula/i.test(t)) {
    res.maritalStatus = 'Divorced';
  } else if (/widow(?:ed)?/i.test(t)) {
    res.maritalStatus = 'Widowed';
  } else if (/separated/i.test(t)) {
    res.maritalStatus = 'Separated';
  } else if (/single|never\s*married|unmarried/i.test(t)) {
    res.maritalStatus = 'Never Married';
  }

  // 5. Nationality
  if (/Bahraini\s*(?:\/|\s*and\s*)\s*Pakistani|Pakistani\s*(?:\/|\s*and\s*)\s*Bahraini/i.test(t)) {
    res.nationality = 'Bahraini / Pakistani';
  } else if (/Indian\s*(?:\/|\s*and\s*)\s*Bahraini|Bahraini\s*(?:\/|\s*and\s*)\s*Indian/i.test(t)) {
    res.nationality = 'Indian / Bahraini';
  } else if (/\bPakistani\b/i.test(t)) {
    res.nationality = 'Pakistani';
  } else if (/\bIndian\b/i.test(t)) {
    res.nationality = 'Indian';
  } else if (/\bBahraini\b|\bBahriani\b/i.test(t)) {
    res.nationality = 'Bahraini';
  } else if (/\bSaudi\b/i.test(t)) {
    res.nationality = 'Saudi Arabia';
  } else if (/\bBangladeshi\b/i.test(t)) {
    res.nationality = 'Bangladeshi';
  } else if (/\bEmirati\b/i.test(t)) {
    res.nationality = 'Emirati';
  } else if (/\bBritish\b/i.test(t)) {
    res.nationality = 'British';
  }

  // 6. Sect
  if (/sunni/i.test(t)) res.sect = 'Sunni';
  else if (/shia/i.test(t)) res.sect = 'Shia';

  // 7. Education
  const eduMatch = t.match(/(?:QUALIFICATION|EDUCATION)\s*[:\s-]*([^\n.,;]+)/i);
  if (eduMatch) {
    const cleanEdu = cleanField(eduMatch[1]);
    if (cleanEdu.length > 2 && cleanEdu.length < 60 && !cleanEdu.includes('OCCUPATION') && !cleanEdu.includes('AGE')) {
      res.education = cleanEdu;
    }
  }

  // 8. Profession / Occupation
  const profMatch = t.match(/(?:OCCUPATION|PROFESSION|JOB TITLE)\s*[:\s-]*([^\n.,;]+)/i);
  if (profMatch) {
    const cleanProf = cleanField(profMatch[1]);
    if (cleanProf.length > 2 && cleanProf.length < 60 && !cleanProf.includes('AGE') && !cleanProf.includes('PERSONALITY')) {
      res.profession = cleanProf;
    }
  }

  // 9. Residence / Location
  const locMatch = t.match(/(?:RESIDENCE|LOCATION|CITY)\s*[:\s-]*([^\n.,;]+)/i);
  if (locMatch) {
    const cleanLoc = cleanField(locMatch[1]);
    if (cleanLoc.length > 2 && cleanLoc.length < 40) {
      res.location = cleanLoc;
    }
  }

  return res;
}

// Track seen IDs and post IDs to eliminate duplicate profiles
const seenIds = new Set();
const seenPosts = new Set();
const seenImgs = new Set();

// Remove duplicate copies of identical posts
const duplicatesToSkip = new Set([
  'DYTxBhGoX6o', // Exact duplicate of DYboqtXoQRc
  'DYTxWOtoS3Z'  // Exact duplicate of DYboweTowE3
]);

let npf174Assigned = false;
const processed = [];

for (const p of profiles) {
  if (!p) continue;

  // Skip known duplicate flyer posts
  if (p.instagramPostId && duplicatesToSkip.has(p.instagramPostId)) {
    console.log(`Skipping duplicate flyer post: ${p.instagramPostId}`);
    continue;
  }

  // Fix ID repetition for NPF-174
  let finalId = p.id;
  if (p.id === 'NPF-174') {
    if (!npf174Assigned && p.instagramPostId === 'DdUNUXAocWf') {
      finalId = 'NPF-174'; // Keep the authentic NPF-174
      npf174Assigned = true;
    } else if (p.instagramPostId) {
      finalId = `IG-${p.instagramPostId}`;
    } else {
      finalId = `NPF-174-${processed.length}`;
    }
  }

  // Deduplicate by ID
  if (seenIds.has(finalId)) {
    console.log(`Skipping duplicate profile ID: ${finalId}`);
    continue;
  }

  // Deduplicate by Instagram Post ID
  if (p.instagramPostId && seenPosts.has(p.instagramPostId)) {
    console.log(`Skipping duplicate post ID: ${p.instagramPostId}`);
    continue;
  }

  // Deduplicate by Image
  if (p.image && seenImgs.has(p.image)) {
    console.log(`Skipping duplicate image: ${p.image}`);
    continue;
  }

  seenIds.add(finalId);
  if (p.instagramPostId) seenPosts.add(p.instagramPostId);
  if (p.image) seenImgs.add(p.image);

  // Extract authentic details from flyer text / caption
  const rawText = (p.rawFlyerText || '') + '\n' + (p.about || '');
  const parsed = parseFlyerDetails(rawText);

  // Determine if existing profile had the dummy placeholder footprint
  const isDummyAge = (p.age === 28 || p.age === '28');
  const isDummyProfession = (p.profession === 'Professional');
  const isDummyEducation = (p.education === 'Degree Holder');

  // Authentic data resolution: ONLY display data if it matches the flyer picture!
  // If not same / not found in flyer, DO NOT DISPLAY IT!
  let age = null;
  if (parsed.age) {
    age = parsed.age;
  } else if (!isDummyAge && typeof p.age === 'number' && p.age > 0) {
    age = p.age;
  }

  let profession = '';
  if (parsed.profession) {
    profession = parsed.profession;
  } else if (!isDummyProfession && p.profession && p.profession !== 'Professional') {
    profession = p.profession;
  }

  let education = '';
  if (parsed.education) {
    education = parsed.education;
  } else if (!isDummyEducation && p.education && p.education !== 'Degree Holder') {
    education = p.education;
  }

  let maritalStatus = parsed.maritalStatus || '';
  if (!maritalStatus && p.maritalStatus && !isDummyAge) {
    maritalStatus = p.maritalStatus;
  }

  let nationality = parsed.nationality || '';
  if (!nationality && p.nationality) {
    // Only retain if it wasn't a blanket dummy assignment
    if (!isDummyAge || p.id.startsWith('NPF-')) {
      nationality = p.nationality;
    }
  }

  let height = parsed.height || '';
  if (!height && p.height && !isDummyAge) {
    height = p.height;
  }

  let sect = parsed.sect || '';
  if (!sect && p.sect && !isDummyAge) {
    sect = p.sect;
  }

  let gender = parsed.gender || p.gender || 'female';
  let category = gender === 'female' ? 'brides' : 'grooms';

  // Construct clean, authentic title
  let name = p.name || '';
  if (/^IG-[A-Za-z0-9_-]+\s*·\s*Bahraini Bride$/i.test(name) && !nationality) {
    // If nationality was not actually verified, don't claim "Bahraini Bride"
    name = `${finalId} · ${gender === 'female' ? 'Bride' : 'Groom'} Proposal`;
  } else if (name.startsWith('NPF-174 ·') && finalId !== 'NPF-174') {
    name = `${finalId} · ${nationality ? nationality + ' ' : ''}${gender === 'female' ? 'Bride' : 'Groom'}`;
  } else if (!name) {
    name = `${finalId} · ${gender === 'female' ? 'Bride' : 'Groom'}`;
  }

  // Location
  let location = parsed.location || p.location || '';
  if (location.toLowerCase() === 'bahrain resident') location = 'Bahrain';

  // Bio: preserve caption or clean flyer text
  let about = p.about || '';
  if (about.startsWith('Official matrimonial post from @nikah_bahrain for candidate')) {
    about = ''; // remove auto-generated dummy bio
  }

  processed.push({
    ...p,
    id: finalId,
    name,
    gender,
    maritalStatus,
    category,
    nationality,
    age,
    height,
    sect,
    caste: (p.caste && p.caste !== 'General' && !isDummyAge) ? p.caste : '',
    education,
    profession,
    salary: p.salary || 'Confidential / As per discussion',
    location: location || 'Bahrain',
    residence: p.residence || location || 'Bahrain',
    siblings: p.siblings || '',
    father: p.father || '',
    mother: p.mother || '',
    family: p.family || '',
    languages: p.languages || '',
    complexion: p.complexion || '',
    build: p.build || '',
    image: p.image || '',
    instagramPostUrl: p.instagramPostUrl || `https://www.instagram.com/p/${p.instagramPostId}/`,
    instagramPostId: p.instagramPostId || '',
    about,
    requirements: p.requirements || '',
    contact: p.contact || '+973 3718 8557',
    rawFlyerText: p.rawFlyerText || '',
    verified: true,
    featured: p.featured || false,
    createdAt: p.createdAt || new Date().toISOString()
  });
}

console.log(`Processed clean authentic profiles count: ${processed.length}`);

// Write cleaned profiles
const jsonOutput = JSON.stringify(processed, null, 2);
fs.writeFileSync(clientJsonPath, jsonOutput, 'utf8');
fs.writeFileSync(serverJsonPath, jsonOutput, 'utf8');

console.log(`Saved updated profiles to client and server JSON successfully!`);
