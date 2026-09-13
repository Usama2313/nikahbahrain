function cleanField(str) {
  if (!str) return '';
  return str.replace(/[.,;:]+$/, '').replace(/\s+/g, ' ').trim();
}

export function parseProfileFromAltText(post) {
  const text = post.alt || '';

  // 1. Extract Profile ID
  const idMatch = text.match(/NPF\s*[-_]?\s*(\d+)/i);
  const rawId = idMatch ? `NPF-${idMatch[1]}` : `NB-${post.shortcode}`;

  // 2. Gender
  const isBride = /\b(BRIDE|Female)\b/i.test(text);
  const gender = isBride ? 'female' : 'male';

  // 3. Marital Status
  let maritalStatus = 'Never Married';
  if (/Divorced/i.test(text)) {
    maritalStatus = 'Divorced';
  } else if (/Widow/i.test(text)) {
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
  const ageMatch = text.match(/\bAge\s*:\s*(?:Originally\s*)?(\d{2})/i) || text.match(/\b(\d{2})\s*years?/i);
  if (ageMatch) {
    age = parseInt(ageMatch[1], 10);
  } else {
    const yearMatch = text.match(/\b(19\d{2}|200\d)\b/);
    if (yearMatch) {
      age = 2026 - parseInt(yearMatch[1], 10);
    }
  }

  // 6. Height
  let height = gender === 'male' ? "5'10\"" : "5'4\"";
  const heightMatch = text.match(/Height\s*:\s*([0-9]['"’.\s-]+[0-9]*["’]?|[0-9]\.[0-9]+)/i);
  if (heightMatch) {
    height = cleanField(heightMatch[1]);
  }

  // 7. Nationality
  let nationality = 'Pakistani';
  const natMatch = text.match(/Nationality\s*:?\s*([^]+?)(?=\b(Marital|Languages|Sect|Religion|Education|Profession|Height|Age|Residence)\b|[.,\n]|$)/i);
  if (natMatch && natMatch[1].trim()) {
    nationality = cleanField(natMatch[1]);
  } else if (/Bahraini/i.test(text)) {
    nationality = 'Bahraini';
  } else if (/Indian/i.test(text)) {
    nationality = 'Indian';
  } else if (/Pakistani/i.test(text)) {
    nationality = 'Pakistani';
  }

  // 8. Sect
  let sect = 'Sunni';
  const sectMatch = text.match(/(?:Sect|Religion)\s*:?\s*([^]+?)(?=\b(Education|Profession|Cast|Caste|Languages|Nationality)\b|[.,\n]|$)/i);
  if (sectMatch && sectMatch[1].trim()) {
    sect = cleanField(sectMatch[1]);
  } else if (/Ahle\s*Hadith/i.test(text)) {
    sect = 'Sunni / Ahle Hadith';
  } else if (/Hanafi/i.test(text)) {
    sect = 'Sunni / Hanafi';
  } else if (/Shia/i.test(text)) {
    sect = 'Shia';
  }

  // 9. Caste
  let caste = 'General';
  const casteMatch = text.match(/Cast[e]?\s*:?\s*([^]+?)(?=\b(Marital|Religion|Sect|Education|Profession|Residence)\b|[.,\n]|$)/i);
  if (casteMatch && casteMatch[1].trim()) {
    caste = cleanField(casteMatch[1]);
  } else {
    const knownCastes = ['Syed', 'Arain', 'Awan', 'Sheikh', 'Malik', 'Khan', 'Qureshi', 'Siddiqui', 'Rajput', 'Jat', 'Merchant', 'Farooqui', 'Hashmi'];
    for (const c of knownCastes) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        caste = c;
        break;
      }
    }
  }

  // 10. Education
  let education = 'Graduate';
  const eduMatch = text.match(/Education\s*:?\s*([^]+?)(?=\b(Profession|Job|Occupation|Short\s*Bio|Bio|Family|Seeking|Interested|Note|DM)\b|[.\n]|$)/i);
  if (eduMatch && eduMatch[1].trim()) {
    education = cleanField(eduMatch[1]);
  } else if (/MBBS/i.test(text)) {
    education = 'MBBS Doctor';
  }

  // 11. Profession
  let profession = gender === 'male' ? 'Professional in Bahrain' : 'Qualified Candidate';
  const profMatch = text.match(/(?:Profession|Job|Occupation)\s*:?\s*([^]+?)(?=\b(Short\s*Bio|Bio|Family|Seeking|Looking|Interested|Note|DM|Location|Residence)\b|[.\n]|$)/i);
  if (profMatch && profMatch[1].trim()) {
    profession = cleanField(profMatch[1]);
  }

  // 12. Location & Residence
  let location = 'Bahrain';
  const locMatch = text.match(/Location\s*:?\s*([^]+?)(?=\b(Height|Age|Nationality|Marital|Education|Profession)\b|[.,\n]|$)/i);
  if (locMatch && locMatch[1].trim()) {
    location = cleanField(locMatch[1]);
  }
  let residence = 'Bahrain Resident';
  const resMatch = text.match(/Residence\s*:?\s*([^]+?)(?=\b(Nationality|Education|Profession|Looking|Seeking|Age)\b|[.,\n]|$)/i);
  if (resMatch && resMatch[1].trim()) {
    residence = cleanField(resMatch[1]);
  }

  // 13. About / Bio
  let about = `Verified marriage candidate from Instagram @nikah_bahrain (${rawId}).`;
  const bioMatch = text.match(/(?:Short\s*Bio|Bio|About)\s*:?\s*([^]+?)(?=\b(Family|Seeking|Looking|Interested|Note|DM|WhatsApp)\b|$)/i);
  if (bioMatch && bioMatch[1].trim()) {
    about = cleanField(bioMatch[1]);
  }
  const famMatch = text.match(/Family\s*:?\s*([^]+?)(?=\b(Seeking|Looking|Interested|Note|DM|WhatsApp)\b|$)/i);
  if (famMatch && famMatch[1].trim()) {
    about += `. Family details: ${cleanField(famMatch[1])}`;
  }

  // 14. Requirements / Seeking
  let requirements = 'Seeking a righteous, practicing partner with noble family background settled in Bahrain or GCC.';
  const seekMatch = text.match(/(?:Seeking|Looking\s*For|Requirements)\s*:?\s*([^]+?)(?=\b(Interested|Note|DM|WhatsApp|Contact)\b|$)/i);
  if (seekMatch && seekMatch[1].trim()) {
    requirements = cleanField(seekMatch[1]);
  }

  const name = `${rawId} (${gender === 'female' ? 'Bride' : 'Groom'})`;

  return {
    id: rawId,
    name,
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
    salary: 'Confidential / Direct Inquiries',
    location,
    residence,
    image: post.imageUrl,
    instagramPostUrl: post.url,
    instagramPostId: post.shortcode,
    about,
    requirements,
    rawFlyerText: text,
    verified: true,
    featured: false,
    createdAt: new Date().toISOString()
  };
}
