import { parseProfileFromAltText } from './parse_profile.js';

const testPosts = [
  {
    shortcode: 'DdUNcFVIYZJ',
    alt: `Photo by Nikah Bahrain 🇧🇭 on September 15, 2026. May be an image of poster, magazine, banner, calendar and text that says 'ล NPF176 လစ GROOM 0 BAHRAINI I PAKISTANI NAME NPF176 Groom DOB: (Age 43) AGE: 43 LOOKING FOR HEIGHT: 5'6" (167 cm) A family-oriented woman who accepts being a second wife, NATIONALITY: Pakistani Bahraini RELIGION: Sunni Any nationality LANGUAGE: Urdu, English, Arabic 25-38 Age between 25 to 38 EDUCATION: Not mentioned PROFESSION: Business man SHORT BIO Happy with my family but seeking second marriage and willing to help. MARITAL STATUS: Married, seeking 2nd wife SIBLING: Not mentioned May Allah bring goodness and barakah in our future families. PARENTS DETAILS: Father: Not mentioned Nikah'.`,
    url: 'https://www.instagram.com/p/DdUNcFVIYZJ/',
    imageUrl: 'https://example.com/176.jpg'
  },
  {
    shortcode: 'DdUNaCBo62j',
    alt: `Photo by Nikah Bahrain 🇧🇭 on September 15, 2026. May be an image of card, magazine, poster, banner and text that says 'nΟ GROOM Bahraini Arab AGE 32 SECT: Sunni LOOKING FOR: NATIONALITY: Bahraini MARITAL STATUS: Separated (after an engagement) COMPLEXION: Fair Looking for a good wife EDUCATION: University graduate : 174 cm Any nationality KG WEIGHT: 78 78kg kg YOUR DETAILS OCCUPATION: Private sector (will disclose in dm) NO. OF CHILDREN: No children from previous marriage NIKAH BAHRAIN LANGUAGE: Arabic only'.`,
    url: 'https://www.instagram.com/p/DdUNaCBo62j/',
    imageUrl: 'https://example.com/175.jpg'
  },
  {
    shortcode: 'DdUNUXAocWf',
    alt: `Photo by Nikah Bahrain 🇧🇭 on September 15, 2026. May be an image of poster, banner, calendar, magazine and text that says 'NPF174 GROOM Bahraini Pakistani NAME: NPF174 GROOM QUALIFICATION: Degree Holder Quran Hafeez, Upon Manhaj as Salaf, Tawheed and Sunnah. PARTNER REQUIREMENT: OCCUPATION: Working in Ministry sector. PERSONALITY: Always with the people of truth and forbidding evil. AGE: 26 HEIGHT: Slim and normal height. DAWAH & SERVICE Calling people Islam and Islamic lectures. IMAM: Imam in Taraweeh prayer. FATHER'S OCCUPATION: Retired Police. RESIDENCE: Hamad Town. NATIONALITY: Pakistani Bahraini. NIKAH BAHRAIN'.`,
    url: 'https://www.instagram.com/p/DdUNUXAocWf/',
    imageUrl: 'https://example.com/174.jpg'
  },
  {
    shortcode: 'Nazia173',
    alt: `Photo by Nikah Bahrain 🇧🇭 on September 14, 2026. May be an image of magazine, poster, banner and text that says 'NPF173 BRIDE Nazia NAME: Nazia EDUCATION: MBA (Banking Finance) Equivalent to MPhil PARTNER REQUIREMENT: AGE: 30 EDUCATION: MBA (Banking & Finance) Equivalent to MPhil DATE OF BIRTH: (Not Mentioned) MARITAL STATUS: Single HEIGHT: 5 feet inches RELIGIOUS SECT: Sunni NATIONALITY: Saudi Arabia FATHER NAME (Not Mentioned) Occupation: Doctor LOOKING FOR A kind, caring, respectful and practicing Muslim man. MOTHER NAME Passed Away OCCUPATION BUSINESS: Own Business in UAE & America NO. SIBLINGS: Brothers Sister (Brothers married; sister studying) CASTE: Rana Rajput CURRENT RESIDENCE Dubai, UAE HER: Fair complexion, beautiful eyes, respectful, intelligent and peaceful times the nature. NIKAH BAHRAIN'.`,
    url: 'https://www.instagram.com/p/Nazia173/',
    imageUrl: 'https://example.com/173.jpg'
  }
];

testPosts.forEach(p => {
  const parsed = parseProfileFromAltText(p);
  console.log(`\n=== Profile ${parsed.id} (${parsed.name}) ===`);
  console.log('Gender:', parsed.gender, '| Marital:', parsed.maritalStatus, '| Category:', parsed.category);
  console.log('Age:', parsed.age, '| Height:', parsed.height, '| Nat:', parsed.nationality, '| Sect:', parsed.sect);
  console.log('Edu:', parsed.education);
  console.log('Prof:', parsed.profession);
  console.log('Father:', parsed.father);
  console.log('Seeking:', parsed.requirements);
});
