function cleanField(str) {
  if (!str) return '';
  return str
    .replace(/^[:\-–\s]+/, '')
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALL_HEADERS = [
  'Education', 'Qualification', 'Profession', 'Job', 'Occupation',
  'Short Bio', 'Bio', 'About', 'Family', "Father's", 'Father', 'Mother',
  'Siblings', 'Sibling', 'Seeking', 'Looking For', 'Looking', 'Requirements',
  'Height', 'Age', 'Birth Date', 'Location', 'Residence', 'Languages', 'Language',
  'Sect', 'Caste', 'Cast', 'Religion', 'Religious Sect', 'Nationality',
  'Marital Status', 'Interested In', 'Contact', 'Note', 'Gender', 'Complexion', 'Build'
];

export function extractFieldFromText(text, keyPattern) {
  if (!text) return '';
  const headerRegexStr = ALL_HEADERS.map(h => h.replace(/[']/g, "\\'")).join('|');
  const regex = new RegExp(`(?:${keyPattern})\\s*[:\\s-]+([\\s\\S]*?)(?=(?:${headerRegexStr})\\s*[:\\s-]|["“”]|\\bnikah_bahrain\\b|\\bqabulhai\\b|$)`, 'i');
  const match = text.match(regex);
  if (!match) return '';
  return cleanField(
    match[1]
      .replace(/["“”‎]/g, '')
      .replace(/\bnikah_bahrain\b/gi, '')
      .replace(/\bNikah\s*BAHRAIN\b/gi, '')
  );
}

export function parseProfileFromAltText(post) {
  const text = post.alt || post.rawFlyerText || '';

  // 1. Profile ID
  const idMatch = text.match(/NPF\s*[-_#]?\s*(\d+)/i) || (post.shortcode ? [null, post.shortcode] : null);
  const rawId = idMatch ? `NPF-${idMatch[1]}` : (post.id || `NB-${Date.now().toString().slice(-4)}`);

  // 2. Gender & Category
  const isBride = /\b(BRIDE|Female)\b/i.test(text.slice(0, 200)) || /Gender\s*:\s*Female/i.test(text);
  const gender = isBride ? 'female' : 'male';

  // 3. Marital Status
  let maritalStatus = 'Never Married';
  if (/Divorced/i.test(text)) {
    maritalStatus = 'Divorced';
  } else if (/Widow(ed)?/i.test(text)) {
    maritalStatus = 'Widowed';
  } else if (/Single/i.test(text) || /Never Married/i.test(text)) {
    maritalStatus = 'Never Married';
  }

  // 4. Category
  let category = 'grooms';
  if (maritalStatus === 'Divorced') {
    category = gender === 'male' ? 'divorced-grooms' : 'divorced-brides';
  } else if (maritalStatus === 'Widowed') {
    category = gender === 'male' ? 'widowed-grooms' : 'widowed-brides';
  } else {
    category = gender === 'male' ? 'grooms' : 'brides';
  }

  // 5. Age
  let age = gender === 'male' ? 30 : 26;
  const ageMatch = text.match(/\bAge\s*[:\s-]+\s*(?:Originally\s*)?(\d{2})/i) || text.match(/\b(\d{2})\s*years?/i);
  if (ageMatch) {
    const a = parseInt(ageMatch[1], 10);
    if (a >= 18 && a <= 80) age = a;
  } else {
    const yearMatch = text.match(/\b(19\d{2}|200\d)\b/);
    if (yearMatch) {
      const parsedYear = parseInt(yearMatch[1], 10);
      if (parsedYear >= 1960 && parsedYear <= 2008) age = 2026 - parsedYear;
    }
  }

  // 6. Height
  let height = gender === 'male' ? "5'10\"" : "5'4\"";
  const rawHeight = extractFieldFromText(text, 'Height');
  if (rawHeight) {
    const hm = rawHeight.match(/(\d\s*['’]\s*\d{1,2}(?:"|'')?|\d\.\d{1,2}|\d{3}\s*cm)/i);
    height = hm ? hm[1].replace(/["'’]/g, '').trim().replace(/\s+/, "'") : cleanField(rawHeight);
  }

  // 7. Nationality
  let nationality = 'Pakistani';
  const rawNat = extractFieldFromText(text, 'Nationality');
  if (rawNat) {
    if (/Bahraini/i.test(rawNat) && /Pakistani/i.test(rawNat)) nationality = 'Bahraini / Pakistani';
    else if (/Bahraini/i.test(rawNat)) nationality = 'Bahraini';
    else if (/Indian/i.test(rawNat)) nationality = 'Indian';
    else if (/Pakistani/i.test(rawNat)) nationality = 'Pakistani';
    else nationality = cleanField(rawNat);
  } else if (/Bahraini/i.test(text)) {
    nationality = 'Bahraini';
  } else if (/Indian/i.test(text)) {
    nationality = 'Indian';
  }

  // 8. Sect / Religion
  let sect = 'Sunni';
  const rawSect = extractFieldFromText(text, 'Religious Sect|Sect|Religion');
  if (rawSect) {
    sect = cleanField(rawSect);
  } else if (/Ahle\s*Hadith/i.test(text)) {
    sect = 'Sunni / Ahle Hadith';
  } else if (/Hanafi/i.test(text)) {
    sect = 'Sunni / Hanafi';
  } else if (/Shia/i.test(text)) {
    sect = 'Shia';
  }

  // 9. Caste
  let caste = 'General';
  const rawCaste = extractFieldFromText(text, 'Caste|Cast');
  if (rawCaste) {
    caste = cleanField(rawCaste);
  } else {
    const knownCastes = ['Syed', 'Arain', 'Awan', 'Sheikh', 'Malik', 'Khan', 'Qureshi', 'Siddiqui', 'Rajput', 'Jat', 'Merchant', 'Farooqui', 'Hashmi', 'Ansari'];
    for (const c of knownCastes) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        caste = c;
        break;
      }
    }
  }

  // 10. Education
  let education = gender === 'female' ? 'Bachelor / Graduate' : 'Graduate';
  const rawEdu = extractFieldFromText(text, 'Education|Qualification');
  if (rawEdu) {
    education = cleanField(rawEdu);
  } else if (/MBBS/i.test(text)) {
    education = 'MBBS Doctor';
  } else if (/Master|M\.S\.|MBA/i.test(text)) {
    education = 'Master Degree';
  }

  // 11. Profession
  let profession = gender === 'male' ? 'Professional in Bahrain' : 'Qualified Candidate';
  const rawProf = extractFieldFromText(text, 'Profession|Job|Occupation');
  if (rawProf) {
    profession = cleanField(rawProf);
  } else if (/Doctor|Physician/i.test(text)) {
    profession = 'Doctor / Healthcare';
  } else if (/Engineer/i.test(text)) {
    profession = 'Engineer';
  }

  // 12. Location & Residence
  let location = 'Bahrain';
  const rawLoc = extractFieldFromText(text, 'Location|City|Residing In');
  if (rawLoc) location = cleanField(rawLoc);

  let residence = 'Bahrain Resident';
  const rawRes = extractFieldFromText(text, 'Residence|Current Residence');
  if (rawRes) residence = cleanField(rawRes);

  // 13. SIBLINGS (Dedicated Field with Label)
  let siblings = extractFieldFromText(text, 'Siblings|Sibling');
  if (!siblings) {
    const sibMatch = text.match(/Siblings?\s*[:\-]?\s*([^.,\n]+(?:brothers?|sisters?|married|unmarried)[^.,\n]*)/i);
    if (sibMatch) siblings = cleanField(sibMatch[1]);
  }

  // 14. FATHER & MOTHER (Dedicated Fields with Labels)
  let father = extractFieldFromText(text, "Father\\'s Occupation|Father\\'s|Father|Parents Detail");
  let mother = extractFieldFromText(text, "Mother\\'s Occupation|Mother\\'s|Mother");

  // 15. FAMILY DETAILS (Dedicated Field with Label)
  let family = extractFieldFromText(text, 'Family Status|Family Background|Family');

  // 16. LANGUAGES (Dedicated Field with Label)
  let languages = extractFieldFromText(text, 'Languages|Language');
  if (!languages) {
    const langMatch = text.match(/Languages?\s*[:\-]?\s*([a-zA-Z\s,]+)(?=\b[A-Z][a-z]+:|$)/);
    if (langMatch) languages = cleanField(langMatch[1]);
  }

  // 17. COMPLEXION & BUILD
  let complexion = extractFieldFromText(text, 'Complexion');
  let build = extractFieldFromText(text, 'Build');

  // 18. ABOUT / SHORT BIO
  let about = extractFieldFromText(text, 'Short Bio|Bio|About');
  if (!about || about.length < 15) {
    about = `Deen-conscious, practicing Muslim candidate (${rawId}) from a noble and respected family settled in Bahrain. Values honesty, Islamic etiquettes, and strong moral character.`;
  }

  // 19. REQUIREMENTS / SEEKING
  let requirements = extractFieldFromText(text, 'Seeking|Looking For|Requirements');
  if (!requirements || requirements.length < 10) {
    requirements = `Seeking a righteous, well-mannered practicing ${nationality} partner with noble family background settled in Bahrain or GCC.`;
  }

  const nameTitle = `${rawId} (${gender === 'female' ? 'Bride' : 'Groom'})`;

  return {
    id: rawId,
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
    siblings: siblings || '',
    father: father || '',
    mother: mother || '',
    family: family || '',
    languages: languages || (nationality === 'Pakistani' ? 'English, Urdu' : nationality === 'Indian' ? 'English, Hindi, Urdu' : 'Arabic, English'),
    complexion: complexion || '',
    build: build || '',
    image: post.imageUrl || post.image || (gender === 'female'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'),
    instagramPostUrl: post.url || post.instagramPostUrl || `https://www.instagram.com/nikah_bahrain/`,
    instagramPostId: post.shortcode || post.instagramPostId || rawId,
    about,
    requirements,
    contact: post.contact || '+973 3718 8557',
    rawFlyerText: text,
    verified: true,
    featured: false,
    createdAt: post.createdAt || new Date().toISOString()
  };
}
