/**
 * clean_profiles.js
 * Cleans up the profiles.json:
 *  1. Removes true duplicates (same image file)
 *  2. Clears Instagram alt-text from `about` field (useless "Photo by Nikah Bahrain...")
 *  3. Gives clean display names to generic ID-named profiles
 *  4. Removes the NPF-229 empty entry with no data at all
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, '..', 'data', 'profiles.json');
const CLIENT_DATA_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');

const profiles = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
console.log('Loaded profiles:', profiles.length);

// Step 1: Remove truly empty profiles (no image, no about, no profession)
const nonEmpty = profiles.filter(p => {
  const hasImage = p.image && p.image.trim() !== '';
  const hasContent = (p.about && p.about.trim() !== '') ||
                     (p.profession && p.profession.trim() !== '') ||
                     (p.age) ||
                     (p.nationality && p.nationality.trim() !== '');
  return hasImage || hasContent;
});
console.log('After removing empty profiles:', nonEmpty.length, '(removed:', profiles.length - nonEmpty.length, ')');

// Step 2: Deduplicate by image path (keep first occurrence)
const seenImages = new Set();
const deduped = [];
let imageDupeCount = 0;
for (const p of nonEmpty) {
  const imgKey = (p.image || '').trim().toLowerCase();
  if (imgKey && seenImages.has(imgKey)) {
    imageDupeCount++;
    console.log(`  Removing image duplicate: ${p.id} (image: ${imgKey})`);
    continue;
  }
  if (imgKey) seenImages.add(imgKey);
  deduped.push(p);
}
console.log('After deduplication by image:', deduped.length, '(removed:', imageDupeCount, ')');

// Step 3: Clean up about field — remove useless Instagram alt-text
const IG_ALT_PATTERNS = [
  /^Photo by Nikah Bahrain/i,
  /^May be (an image|a graphic|a photo) of/i,
  /^No photo description available/i,
];

let aboutCleared = 0;
const cleaned = deduped.map(p => {
  let about = p.about || '';
  const isUselessAltText = IG_ALT_PATTERNS.some(rx => rx.test(about.trim()));
  if (isUselessAltText) {
    aboutCleared++;
    about = '';
  }
  
  // Step 4: Clean up generic ID-based names to show clean display labels
  let name = p.name || '';
  // Pattern: "IG-XXXX (Bride)" or "NPF-XXX (Groom)" — replace with clean label
  const idNamePattern = /^(IG-\S+|NPF-\d+[a-z]?)\s*\((Bride|Groom)\)$/i;
  if (idNamePattern.test(name.trim())) {
    const genderLabel = p.gender === 'male' ? 'Groom' : 'Bride';
    const nationalityLabel = p.nationality ? `${p.nationality} ` : '';
    name = `${nationalityLabel}${genderLabel}`;
    if (p.maritalStatus && p.maritalStatus !== 'Never Married') {
      name += ` (${p.maritalStatus})`;
    }
  }

  return { ...p, about, name };
});

console.log(`Cleared useless Instagram alt-text from ${aboutCleared} profiles`);

// Step 5: Sort by ID number (NPF first numerically, then IG chronologically)
cleaned.sort((a, b) => {
  const isNpfA = a.id.startsWith('NPF-');
  const isNpfB = b.id.startsWith('NPF-');
  if (isNpfA && isNpfB) {
    const numA = parseInt(a.id.replace('NPF-', '')) || 0;
    const numB = parseInt(b.id.replace('NPF-', '')) || 0;
    return numB - numA; // highest NPF first (newest)
  }
  if (isNpfA) return -1; // NPF before IG
  if (isNpfB) return 1;
  return a.id.localeCompare(b.id);
});

// Write back
fs.writeFileSync(DATA_PATH, JSON.stringify(cleaned, null, 2), 'utf-8');
console.log(`\n✅ Saved ${cleaned.length} clean profiles to server/data/profiles.json`);

// Sync to client
fs.writeFileSync(CLIENT_DATA_PATH, JSON.stringify(cleaned, null, 2), 'utf-8');
console.log(`✅ Synced to client/src/data/profiles.json`);
console.log(`\nFinal count: ${cleaned.length} profiles`);
