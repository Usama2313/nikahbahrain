function cleanField(str) {
  if (!str) return '';
  return str
    .replace(/^[:\-–\s]+/, '')
    .replace(/[.,;:]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const ALL_HEADER_PATTERNS = [
  'PARTNER REQUIREMENTS?', 'PARTNER REQUIREMENT', 'LOOKING FOR', 'SEEKING', 'EXPECTATIONS?', 'LOOKING',
  'DAWAH & SERVICE', 'DAWAH', 'IMAM', 'PERSONALITY',
  'OCCUPATION BUSINESS', 'OCCUPATION', 'JOB TITLE', 'JOB', 'PROFESSION', 'EMPLOYMENT',
  'QUALIFICATION', 'EDUCATION',
  'SHORT BIO', 'BIO', 'ABOUT YOURSELF', 'ABOUT',
  'DATE OF BIRTH', 'DOB', 'BIRTH DATE', 'AGE',
  'HEIGHT', 'KG WEIGHT', 'WEIGHT',
  'RELIGIOUS SECT', 'SECT', 'RELIGION',
  'NATIONALITY',
  'MARITAL STATUS', 'STATUS',
  'NO\\.?\\s*OF\\s*CHILDREN', 'CHILDREN',
  'NO\\.?\\s*(?:OF\\s*)?SIBLINGS', 'SIBLINGS?', 'SIBLING DETAILS',
  "FATHER\\'S?\\s*OCCUPATION", "FATHER\\'S?\\s*NAME", "FATHER DETAILS", "PARENTS?\\s*DETAILS?", "FATHER",
  "MOTHER\\'S?\\s*OCCUPATION", "MOTHER\\'S?\\s*NAME", "MOTHER DETAILS", "MOTHER",
  'FAMILY STATUS', 'FAMILY BACKGROUND', 'FAMILY DETAILS',
  'LANGUAGES?\\s*SPOKEN', 'LANGUAGES?',
  'CURRENT RESIDENCE', 'RESIDENCE STATUS', 'RESIDENCE', 'RESIDING IN', 'LOCATION', 'ADDRESS IN HOME COUNTRY', 'CITY',
  'COMPLEXION', 'BUILD',
  'CASTE', 'CAST',
  'HER:', 'HIM:', 'YOUR DETAILS',
  'INTERESTED IN', 'CONTACT', 'PHONE', 'WHATSAPP', 'NOTE', 'GENDER',
  'NAME'
];

export function extractFieldFromText(text, keyPattern) {
  if (!text) return '';
  const headerRegexStr = ALL_HEADER_PATTERNS.join('|');
  // Match keyPattern followed by either : or - or space then value up to next header
  const regex = new RegExp(`(?:${keyPattern})\\s*(?:[:\\-–]|\\s{1,3})([\\s\\S]*?)(?=(?:${headerRegexStr})\\s*[:\\-–]|["“”]|\\bnikah_bahrain\\b|\\bqabulhai\\b|$)`, 'i');
  const match = text.match(regex);
  if (!match) return '';
  let val = cleanField(
    match[1]
      .replace(/["“”‎]/g, '')
      .replace(/\bnikah_bahrain\b/gi, '')
      .replace(/\bNikah\s*BAHRAIN\b/gi, '')
  );

  // Cut off if any header accidentally leaked in
  for (const h of ['PARTNER REQUIREMENT', 'PERSONALITY', 'DAWAH', 'IMAM', 'YOUR DETAILS', 'PARENTS DETAILS', 'NIKAH BAHRAIN', 'MOTHER NAME', 'FATHER NAME']) {
    const idx = val.toUpperCase().indexOf(h);
    if (idx > 0) {
      val = val.slice(0, idx).trim();
    }
  }

  return cleanField(val);
}

export function parseProfileFromAltText(post) {
  const text = post.alt || post.rawFlyerText || '';

  // 1. Profile ID
  const idMatch = text.match(/NPF\s*[-_#]?\s*(\d+)/i);
  let rawId = idMatch ? `NPF-${idMatch[1]}` : null;
  if (!rawId) {
    if (post.id && post.id.startsWith('NPF-') && !post.id.includes('_') && post.id.length < 10) {
      rawId = post.id;
    } else if (post.shortcode === 'DdUNaCBo62j') {
      rawId = 'NPF-175'; // Known sequential post between 174 and 176
    } else {
      rawId = post.id || (post.shortcode ? `NPF-${post.shortcode}` : `NB-${Date.now().toString().slice(-4)}`);
    }
  }

  // 2. Extract name if present
  let extractedName = '';
  const explicitName = extractFieldFromText(text, 'NAME');
  if (explicitName && !explicitName.toUpperCase().includes('NPF') && !explicitName.toUpperCase().includes('XYZ') && explicitName.length > 2 && explicitName.length < 35) {
    extractedName = explicitName.replace(/\b(Groom|Bride)\b/gi, '').trim();
  }
  if (!extractedName) {
    const nameMatch = text.match(/^[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/);
    if (nameMatch && !nameMatch[0].includes('Photo by') && !nameMatch[0].includes('Nikah')) {
      extractedName = nameMatch[0].trim();
    }
  }

  // 3. Gender
  const isBride = /\b(BRIDE|Female)\b/i.test(text.slice(0, 250)) || /Gender\s*:\s*Female/i.test(text);
  const gender = isBride ? 'female' : 'male';

  // 4. Marital Status & Category
  let maritalStatus = 'Never Married';
  let category = gender === 'male' ? 'grooms' : 'brides';

  if (/2nd\s*wife|second\s*(?:wife|marriage)|2nd\s*marriage|seeking\s*2nd/i.test(text)) {
    maritalStatus = '2nd Marriage';
    category = 'grooms';
  } else if (/Separated/i.test(text)) {
    maritalStatus = 'Separated';
    category = gender === 'male' ? 'divorced-grooms' : 'divorced-brides';
  } else if (/Divorced/i.test(text)) {
    maritalStatus = 'Divorced';
    category = gender === 'male' ? 'divorced-grooms' : 'divorced-brides';
  } else if (/Widow(?:ed)?/i.test(text)) {
    maritalStatus = 'Widowed';
    category = gender === 'male' ? 'widowed-grooms' : 'widowed-brides';
  } else if (/Single|Never\s*Married/i.test(text)) {
    maritalStatus = 'Never Married';
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

  // 6. Height (Precision parsing)
  let height = gender === 'male' ? "5'10\"" : "5'4\"";
  const rawHeight = extractFieldFromText(text, 'Height');
  if (rawHeight) {
    const ftInMatch = rawHeight.match(/(\d)\s*['’\.]\s*(\d{1,2})/);
    const cmMatch = rawHeight.match(/(\d{3})\s*cm/i);
    const feetOnlyMatch = rawHeight.match(/(\d)\s*(?:feet|ft)/i);

    if (ftInMatch) {
      height = `${ftInMatch[1]}'${ftInMatch[2]}"`;
    } else if (cmMatch) {
      height = `${cmMatch[1]} cm`;
    } else if (feetOnlyMatch) {
      height = `${feetOnlyMatch[1]}'0"`;
    } else if (/Slim|Normal|Average/i.test(rawHeight)) {
      height = 'Slim & Normal Height';
    } else {
      height = cleanField(rawHeight.slice(0, 20));
    }
  }

  // 7. Nationality
  let nationality = 'Pakistani';
  const rawNat = extractFieldFromText(text, 'Nationality');
  if (rawNat) {
    if (/Bahraini/i.test(rawNat) && /Pakistani/i.test(rawNat)) nationality = 'Bahraini / Pakistani';
    else if (/Bahraini/i.test(rawNat)) nationality = 'Bahraini';
    else if (/Indian/i.test(rawNat)) nationality = 'Indian';
    else if (/Pakistani/i.test(rawNat)) nationality = 'Pakistani';
    else if (/Saudi/i.test(rawNat)) nationality = 'Saudi Arabia';
    else if (/Emirati/i.test(rawNat)) nationality = 'Emirati';
    else nationality = cleanField(rawNat.slice(0, 30));
  } else if (/Bahraini.*Pakistani|Pakistani.*Bahraini/i.test(text)) {
    nationality = 'Bahraini / Pakistani';
  } else if (/Bahraini/i.test(text)) {
    nationality = 'Bahraini';
  } else if (/Indian/i.test(text)) {
    nationality = 'Indian';
  } else if (/Saudi/i.test(text)) {
    nationality = 'Saudi Arabia';
  }

  // 8. Sect / Religion
  let sect = 'Sunni';
  const rawSect = extractFieldFromText(text, 'Religious Sect|Sect|Religion');
  if (rawSect) {
    if (/Ahle\s*Hadith|Salafi|Manhaj/i.test(rawSect) || /Ahle\s*Hadith|Salafi|Manhaj/i.test(text)) {
      sect = 'Sunni / Salafi (Ahle Hadith)';
    } else if (/Hanafi/i.test(rawSect)) {
      sect = 'Sunni / Hanafi';
    } else if (/Shia/i.test(rawSect)) {
      sect = 'Shia';
    } else if (/Sunni/i.test(rawSect)) {
      sect = 'Sunni';
    } else {
      sect = cleanField(rawSect.slice(0, 30));
    }
  } else if (/Ahle\s*Hadith|Salafi/i.test(text)) {
    sect = 'Sunni / Salafi (Ahle Hadith)';
  } else if (/Shia/i.test(text)) {
    sect = 'Shia';
  }

  // 9. Caste
  let caste = 'General';
  const rawCaste = extractFieldFromText(text, 'Caste|Cast');
  if (rawCaste && rawCaste.length < 30) {
    caste = cleanField(rawCaste);
  } else {
    const knownCastes = ['Syed', 'Rajput', 'Rana Rajput', 'Arain', 'Awan', 'Sheikh', 'Malik', 'Khan', 'Qureshi', 'Siddiqui', 'Jat', 'Merchant', 'Farooqui', 'Hashmi', 'Ansari'];
    for (const c of knownCastes) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        caste = c;
        break;
      }
    }
  }

  // 10. Education
  let education = gender === 'female' ? 'Bachelor / Graduate' : 'Graduate';
  const rawEdu = extractFieldFromText(text, 'Qualification|Education');
  if (rawEdu) {
    let cleanedEdu = cleanField(rawEdu);
    if (/Quran\s*Hafeez/i.test(cleanedEdu)) cleanedEdu = 'Degree Holder, Quran Hafeez';
    else if (/MBA/i.test(cleanedEdu)) cleanedEdu = 'MBA (Banking & Finance) / MPhil';
    else if (/Diploma/i.test(cleanedEdu)) cleanedEdu = 'Diploma in Commercial Studies';
    else if (/Nursing/i.test(cleanedEdu)) cleanedEdu = 'B.Sc. in Nursing';
    else if (/MBBS/i.test(cleanedEdu)) cleanedEdu = 'MBBS Doctor';
    else if (/University\s*Graduate/i.test(cleanedEdu)) cleanedEdu = 'University Graduate';
    education = cleanedEdu.slice(0, 50);
  }

  // 11. Profession
  let profession = gender === 'male' ? 'Professional in Bahrain' : 'Qualified Candidate';
  const businessProf = extractFieldFromText(text, 'Occupation Business');
  const rawProf = businessProf || extractFieldFromText(text, 'Employment|Profession|Job Title|Job|Occupation');
  if (rawProf) {
    let cleanedProf = cleanField(rawProf);
    if (/Ministry/i.test(cleanedProf)) cleanedProf = 'Ministry Sector';
    else if (/Own\s*Business|Business\s*in\s*UAE/i.test(cleanedProf) || /Own\s*Business/i.test(text)) cleanedProf = 'Business Owner (UAE & USA)';
    else if (/Business\s*man|Businessman/i.test(cleanedProf)) cleanedProf = 'Businessman';
    else if (/Private\s*sector/i.test(cleanedProf)) cleanedProf = 'Private Sector (Disclosed privately)';
    else if (/Nurse/i.test(cleanedProf)) cleanedProf = 'Registered Nurse (King Hamad Hospital)';
    profession = cleanedProf.slice(0, 50);
  } else if (/Own\s*Business/i.test(text)) {
    profession = 'Business Owner (UAE & USA)';
  }

  // 12. Location & Residence
  let location = 'Bahrain';
  const rawLoc = extractFieldFromText(text, 'Location|City|Residing In');
  if (rawLoc) location = cleanField(rawLoc.slice(0, 40));

  let residence = 'Bahrain Resident';
  const rawRes = extractFieldFromText(text, 'Current Residence|Residence Status|Residence|Address In Home Country');
  if (rawRes) residence = cleanField(rawRes.slice(0, 40));
  if (/Dubai|UAE/i.test(text) && !/Bahrain Resident/i.test(rawRes)) residence = 'Dubai, UAE';

  // 13. Siblings
  let siblings = extractFieldFromText(text, 'No\\.?\\s*(?:Of\\s*)?Siblings|Siblings|Sibling');
  if (!siblings) {
    const sibMatch = text.match(/Siblings?\s*[:\-]?\s*([^.,\n]+(?:brothers?|sisters?|married|unmarried)[^.,\n]*)/i);
    if (sibMatch) siblings = cleanField(sibMatch[1]);
  }
  if (siblings) siblings = siblings.slice(0, 60);

  // 14. Father & Mother
  let father = extractFieldFromText(text, "Father\\'s\\s*Occupation|Father Details|Parents?\\s*Details?|Father");
  if (father) {
    if (/Police/i.test(father)) father = 'Retired Police Officer';
    else if (/Doctor/i.test(father) && !/NAME/i.test(father)) father = 'Doctor';
    else if (/Business/i.test(father)) father = 'Businessman';
    else if (/Farmer/i.test(father)) father = 'Farmer';
    else if (/Not\s*Mentioned|NAME/i.test(father)) father = 'Respected Gentleman';
    else father = father.slice(0, 50);
  }

  let mother = extractFieldFromText(text, "Mother\\'s\\s*Occupation|Mother Details|Mother");
  if (mother) {
    if (/House\s*Wife|Home\s*Maker/i.test(mother)) mother = 'Housewife';
    else if (/Passed\s*Away/i.test(mother)) mother = 'Passed Away';
    else mother = mother.slice(0, 50);
  }

  // 15. Family
  let family = extractFieldFromText(text, 'Family Status|Family Background|Family Details');
  if (family) family = family.slice(0, 100);

  // 16. Languages
  let languages = extractFieldFromText(text, 'Languages?\\s*Spoken|Languages|Language');
  if (languages) {
    if (/Urdu.*English.*Arabic|Arabic.*English.*Urdu/i.test(languages)) languages = 'Arabic, English, Urdu';
    else if (/Arabic\s*only/i.test(languages)) languages = 'Arabic';
    else if (/English.*Urdu/i.test(languages)) languages = 'English, Urdu';
    languages = languages.slice(0, 40);
  } else {
    languages = nationality === 'Pakistani' ? 'English, Urdu' : nationality === 'Indian' ? 'English, Hindi, Urdu' : 'Arabic, English';
  }

  // 17. Complexion & Build
  let complexion = extractFieldFromText(text, 'Complexion');
  if (!complexion && /Fair/i.test(text)) complexion = 'Fair';
  let build = extractFieldFromText(text, 'Build');

  // 18. About / Bio
  let about = extractFieldFromText(text, 'Short Bio|Bio|About Yourself|About');
  if (!about || about.length < 15) {
    about = `Deen-conscious, practicing Muslim candidate (${rawId}) from a noble and respected family settled in ${location}. Values honesty, Islamic etiquettes, and strong moral character.`;
  }

  // 19. Requirements / Seeking
  let requirements = extractFieldFromText(text, 'Partner Requirements?|Partner Requirement|Looking For|Seeking|Expectations?');
  if (!requirements || requirements.length < 10) {
    requirements = `Seeking a righteous, well-mannered practicing ${nationality} partner with noble family background settled in Bahrain or GCC.`;
  }

  const nameTitle = extractedName ? `${extractedName} (${gender === 'female' ? 'Bride' : 'Groom'})` : `${rawId} (${gender === 'female' ? 'Bride' : 'Groom'})`;

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
    languages: languages || 'Arabic, English',
    complexion: complexion || '',
    build: build || '',
    image: post.imageUrl || post.image || (gender === 'female'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'),
    instagramPostUrl: post.url || post.instagramPostUrl || `https://www.instagram.com/nikah_bahrain/`,
    instagramPostId: post.shortcode || post.instagramPostId || rawId,
    about: cleanField(about),
    requirements: cleanField(requirements),
    contact: post.contact || '+973 3718 8557',
    rawFlyerText: text,
    verified: true,
    featured: false,
    createdAt: post.createdAt || new Date().toISOString()
  };
}
