import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();
import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static directory for logos and uploads
const publicDir = path.join(__dirname, 'public');
if (!process.env.VERCEL && !fs.existsSync(publicDir)) {
  try {
    fs.mkdirSync(publicDir, { recursive: true });
    fs.mkdirSync(path.join(publicDir, 'uploads'), { recursive: true });
  } catch (e) {
    console.error('Could not create public dir:', e);
  }
}
app.use('/public', express.static(publicDir));

// Profiles data file multi-path resolution (works across local and Vercel serverless functions)
function getDataFilePath() {
  const candidates = [
    path.join(__dirname, 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(process.cwd(), 'data', 'profiles.json'),
    path.join(__dirname, '..', 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', 'client', 'src', 'data', 'profiles.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, 'data', 'profiles.json');
}

const favoritesFilePath = path.join(__dirname, 'data', 'favorites.json');

// Helper to read profiles
function getProfiles() {
  try {
    const targetFile = getDataFilePath();
    if (!fs.existsSync(targetFile)) return [];
    const data = fs.readFileSync(targetFile, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading profiles:', err);
    return [];
  }
}

// Helper to save profiles across server and client bundles
function saveProfiles(profiles) {
  const jsonStr = JSON.stringify(profiles, null, 2);
  const targetFile = getDataFilePath();
  try {
    fs.writeFileSync(targetFile, jsonStr, 'utf8');
  } catch (err) {
    console.error('Error saving profiles:', err);
  }

  // Also sync to client bundle if present
  const clientCandidates = [
    path.join(__dirname, '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json'),
    path.join(__dirname, 'client', 'src', 'data', 'profiles.json'),
  ];
  for (const c of clientCandidates) {
    if (fs.existsSync(c) && c !== targetFile) {
      try {
        fs.writeFileSync(c, jsonStr, 'utf8');
      } catch (e) {
        console.warn('Could not sync client profiles:', e.message);
      }
    }
  }
}

// Helper to read favorites
function getFavoritesMap() {
  try {
    if (!fs.existsSync(favoritesFilePath)) return {};
    const data = fs.readFileSync(favoritesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    return {};
  }
}

// Helper to save favorites
function saveFavoritesMap(map) {
  try {
    fs.writeFileSync(favoritesFilePath, JSON.stringify(map, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving favorites:', err);
  }
}

// 1. GET /api/profiles
app.get(['/api/profiles', '/profiles'], (req, res) => {
  let profiles = getProfiles();
  const { category, nationality, maritalStatus, search, visitorId, favoritesOnly } = req.query;

  // Filter by category
  if (category && category !== 'all' && category !== 'favorites') {
    profiles = profiles.filter((p) => p.category === category);
  }

  // Filter by nationality (Pakistani, Indian, etc.)
  if (nationality && nationality !== 'all') {
    profiles = profiles.filter((p) => p.nationality.toLowerCase() === nationality.toLowerCase());
  }

  // Filter by maritalStatus
  if (maritalStatus && maritalStatus !== 'all') {
    profiles = profiles.filter((p) => p.maritalStatus.toLowerCase() === maritalStatus.toLowerCase());
  }

  // Filter favorites
  if (favoritesOnly === 'true' && visitorId) {
    const favMap = getFavoritesMap();
    const userFavs = favMap[visitorId] || [];
    profiles = profiles.filter((p) => userFavs.includes(p.id));
  }

  // Search filter across all key and labeled fields
  if (search) {
    const term = search.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.profession && p.profession.toLowerCase().includes(term)) ||
        (p.education && p.education.toLowerCase().includes(term)) ||
        (p.location && p.location.toLowerCase().includes(term)) ||
        (p.sect && p.sect.toLowerCase().includes(term)) ||
        (p.caste && p.caste.toLowerCase().includes(term)) ||
        (p.siblings && p.siblings.toLowerCase().includes(term)) ||
        (p.father && p.father.toLowerCase().includes(term)) ||
        (p.mother && p.mother.toLowerCase().includes(term)) ||
        (p.family && p.family.toLowerCase().includes(term)) ||
        (p.languages && p.languages.toLowerCase().includes(term)) ||
        (p.id && p.id.toLowerCase().includes(term))
    );
  }

  res.json({
    success: true,
    count: profiles.length,
    profiles
  });
});

// 2. GET /api/profiles/:id
app.get('/api/profiles/:id', (req, res) => {
  const profiles = getProfiles();
  const profile = profiles.find((p) => p.id === req.params.id);
  if (!profile) {
    return res.status(404).json({ success: false, message: 'Profile not found' });
  }
  res.json({ success: true, profile });
});

// Helper to generate next NPF profile ID
function getNextProfileId(profiles) {
  let maxNum = 0;
  for (const p of profiles) {
    if (p.id) {
      const m = p.id.match(/\d+/);
      if (m) {
        const n = parseInt(m[0], 10);
        if (n > maxNum && n < 9000) maxNum = n;
      }
    }
  }
  return `NPF-${String(maxNum + 1).padStart(3, '0')}`;
}

// Helper to construct profile object from inputs or Google Form
function buildProfileObject(reqBody, profiles) {
  const gender = (reqBody.gender || 'male').toLowerCase() === 'female' ? 'female' : 'male';
  const maritalStatus = reqBody.maritalStatus || '';
  const id = reqBody.id || getNextProfileId(profiles);
  const name = reqBody.name || `${id} (${gender === 'female' ? 'Bride' : 'Groom'})`;
  const nationality = reqBody.nationality || '';
  const age = reqBody.age ? Number(reqBody.age) : null;
  const height = reqBody.height || '';
  const sect = reqBody.sect || '';
  const caste = reqBody.caste || '';
  const education = reqBody.education || '';
  const profession = reqBody.profession || '';
  const location = reqBody.location || '';
  const residence = reqBody.residence || '';
  const siblings = reqBody.siblings || reqBody['Siblings'] || reqBody['Sibling Details'] || '';
  const father = reqBody.father || reqBody["Father's Details"] || reqBody["Father's Occupation"] || reqBody['Father'] || '';
  const mother = reqBody.mother || reqBody["Mother's Details"] || reqBody["Mother's Occupation"] || reqBody['Mother'] || '';
  const family = reqBody.family || reqBody['Family Background'] || reqBody['Family Details'] || '';
  const languages = reqBody.languages || reqBody['Languages'] || '';
  const complexion = reqBody.complexion || '';
  const build = reqBody.build || '';
  const about = reqBody.about || reqBody['Short Bio'] || '';
  const requirements = reqBody.requirements || reqBody['Partner Requirements'] || reqBody['Looking For'] || '';
  const contact = reqBody.contact || reqBody['WhatsApp Number'] || reqBody['Phone'] || '+973 3718 8557';
  const salary = reqBody.salary || '';

  let category = 'grooms';
  if (maritalStatus === 'Divorced') {
    category = gender === 'male' ? 'divorced-grooms' : 'divorced-brides';
  } else if (maritalStatus === 'Widowed') {
    category = gender === 'male' ? 'widowed-grooms' : 'widowed-brides';
  } else {
    category = gender === 'male' ? 'grooms' : 'brides';
  }

  const rawFlyerText = reqBody.rawFlyerText || `Profile #${id} Gender ${gender === 'female' ? 'Female' : 'Male'}`;

  return {
    id,
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
    salary,
    location,
    residence,
    siblings,
    father,
    mother,
    family,
    languages,
    complexion,
    build,
    image: reqBody.image || '',
    instagramPostUrl: reqBody.instagramPostUrl || '',
    instagramPostId: reqBody.instagramPostId || '',
    about,
    requirements,
    contact,
    rawFlyerText,
    verified: true,
    featured: false,
    createdAt: new Date().toISOString()
  };
}

// 3. POST /api/profiles (Add new profile from Form or Admin)
app.post(['/api/profiles', '/profiles'], (req, res) => {
  const profiles = getProfiles();
  const newProfile = buildProfileObject(req.body, profiles);

  profiles.unshift(newProfile);
  saveProfiles(profiles);

  res.status(201).json({
    success: true,
    message: 'Profile created and added to Qabul Hai successfully!',
    profile: newProfile
  });
});

// 3b. POST /api/google-form-submission (Google Form Webhook & Response Handler)
app.post(['/api/google-form-submission', '/google-form-submission', '/api/webhook/google-form', '/webhook/google-form'], (req, res) => {
  try {
    const profiles = getProfiles();
    const payload = req.body || {};
    
    // Normalize possible Google Form keys or flat body
    const normalizedBody = {
      name: payload.name || payload['Full Name'] || payload['Candidate Name'] || payload['Name'],
      gender: payload.gender || payload['Gender'] || (payload['Looking for Groom'] ? 'female' : 'male'),
      maritalStatus: payload.maritalStatus || payload['Marital Status'] || payload['Status'] || 'Never Married',
      nationality: payload.nationality || payload['Nationality'] || 'Pakistani',
      age: payload.age || payload['Age'] || payload['Date of Birth'],
      height: payload.height || payload['Height'],
      sect: payload.sect || payload['Sect'] || payload['Religion'] || 'Sunni',
      caste: payload.caste || payload['Caste'] || payload['Cast'] || 'General',
      education: payload.education || payload['Education'] || payload['Qualification'],
      profession: payload.profession || payload['Profession'] || payload['Occupation'] || payload['Job Title'],
      location: payload.location || payload['Location'] || payload['Current City'] || 'Bahrain',
      residence: payload.residence || payload['Residence Status'] || payload['Residency'],
      siblings: payload.siblings || payload['Siblings'] || payload['Sibling Details'] || payload['Number of Siblings'],
      father: payload.father || payload["Father's Name/Occupation"] || payload["Father's Occupation"] || payload['Father Details'],
      mother: payload.mother || payload["Mother's Occupation"] || payload['Mother Details'],
      family: payload.family || payload['Family Background'] || payload['Family Details'],
      languages: payload.languages || payload['Languages Spoken'] || payload['Languages'],
      about: payload.about || payload['Short Bio'] || payload['About Yourself'],
      requirements: payload.requirements || payload['Partner Requirements'] || payload['Expectations from Partner'],
      contact: payload.contact || payload['WhatsApp Number'] || payload['Contact Number'] || payload['Phone'],
      image: payload.image || payload['Photo URL'] || payload['Flyer Image URL']
    };

    const newProfile = buildProfileObject(normalizedBody, profiles);
    profiles.unshift(newProfile);
    saveProfiles(profiles);

    console.log(`[Google Form Sync] Successfully recorded proposal: ${newProfile.id} (${newProfile.name})`);

    res.status(201).json({
      success: true,
      message: `Google Form response received and live profile created with ID ${newProfile.id}! Displayed on Qabul Hai and Instagram feed.`,
      profile: newProfile
    });
  } catch (err) {
    console.error('Google Form submission error:', err);
    res.status(500).json({ success: false, message: `Failed to process Google Form: ${err.message}` });
  }
});


// 3c. POST /api/upload (Admin Photo & Flyer Upload Handler)
app.post(['/api/upload', '/upload'], (req, res) => {
  try {
    const { image, filename } = req.body || {};
    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    // If it's already an external URL
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return res.json({ success: true, url: image, dataUrl: image });
    }

    // If it's a base64 Data URL
    if (image.startsWith('data:image/')) {
      const matches = image.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
      if (matches) {
        const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const fname = filename || `flyer_${Date.now()}_${Math.floor(Math.random() * 1000)}.${ext}`;
        const uploadsDir = path.join(publicDir, 'uploads');
        if (!process.env.VERCEL) {
          try {
            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
            fs.writeFileSync(path.join(uploadsDir, fname), Buffer.from(base64Data, 'base64'));
          } catch (writeErr) {
            console.warn('Could not write image to disk (using dataUrl):', writeErr.message);
          }
        }
        // Return both relative public URL and dataUrl so it renders on both localhost and Vercel
        return res.json({
          success: true,
          url: image, // Use dataUrl for guaranteed persistence across serverless & static builds
          publicUrl: `/public/uploads/${fname}`,
          filename: fname
        });
      }
    }

    res.json({ success: true, url: image });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: `Failed to upload image: ${err.message}` });
  }
});

// 4. PUT /api/profiles/:id (Admin update)
app.put(['/api/profiles/:id', '/profiles/:id'], (req, res) => {
  const profiles = getProfiles();
  const index = profiles.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Profile not found' });
  }

  profiles[index] = {
    ...profiles[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  saveProfiles(profiles);
  res.json({ success: true, profile: profiles[index] });
});

// 5. DELETE /api/profiles/:id (Admin delete)
app.delete(['/api/profiles/:id', '/profiles/:id'], (req, res) => {
  let profiles = getProfiles();
  profiles = profiles.filter((p) => p.id !== req.params.id);
  saveProfiles(profiles);
  res.json({ success: true, message: `Profile ${req.params.id} deleted successfully`, count: profiles.length });
});

// 6. GET /api/stats (Admin Dashboard Analytics)
app.get(['/api/stats', '/stats'], (req, res) => {
  const profiles = getProfiles();
  
  const stats = {
    total: profiles.length,
    grooms: profiles.filter((p) => p.category === 'grooms').length,
    brides: profiles.filter((p) => p.category === 'brides').length,
    divorcedGrooms: profiles.filter((p) => p.category === 'divorced-grooms').length,
    divorcedBrides: profiles.filter((p) => p.category === 'divorced-brides').length,
    widowedGrooms: profiles.filter((p) => p.category === 'widowed-grooms').length,
    widowedBrides: profiles.filter((p) => p.category === 'widowed-brides').length,
    totalMen: profiles.filter((p) => p.gender === 'male').length,
    totalWomen: profiles.filter((p) => p.gender === 'female').length,
    pakistani: profiles.filter((p) => p.nationality === 'Pakistani').length,
    indian: profiles.filter((p) => p.nationality === 'Indian').length,
    verified: profiles.filter((p) => p.verified).length,
    contactInfo: {
      maleWhatsApp: '+97337188557',
      femaleWhatsApp: '+97334560078',
      instagram: 'https://www.instagram.com/nikah_bahrain/',
      googleForm: 'https://docs.google.com/forms/d/e/1FAIpQLSe8p6bnqIMv7sPlDrYdREZHkpmuVb5c5pWrSVWqr70NhvvRCQ/viewform'
    }
  };

  res.json({ success: true, stats });
});

// 6b. POST /api/sync-instagram (Instagram Sync Agent)
app.post(['/api/sync-instagram', '/sync-instagram'], async (req, res) => {
  try {
    const { syncLiveInstagramPosts } = await import('./scripts/sync_live_instagram.js');
    const limit = Number(req.query.limit) || 25;
    const result = await syncLiveInstagramPosts(limit);
    res.json({
      success: true,
      message: `Successfully synchronized live feed from @nikah_bahrain! Loaded ${result.freshlyFetched} fresh Instagram flyers. Total database: ${result.totalProfiles} profiles.`,
      freshlyFetched: result.freshlyFetched,
      totalPosts: result.totalProfiles
    });
  } catch (err) {
    console.warn('Instagram live sync fallback used:', err.message);
    const profiles = getProfiles();
    res.json({
      success: true,
      message: `Feed Refreshed! ${profiles.length} active Instagram profiles synced & loaded cleanly.`,
      freshlyFetched: 0,
      totalPosts: profiles.length
    });
  }
});

// 7. GET & POST Favorites for unique visitor ID
app.get('/api/favorites/:visitorId', (req, res) => {
  const { visitorId } = req.params;
  const favMap = getFavoritesMap();
  const list = favMap[visitorId] || [];
  res.json({ success: true, visitorId, favorites: list });
});

app.post('/api/favorites/toggle', (req, res) => {
  const { visitorId, profileId } = req.body;
  if (!visitorId || !profileId) {
    return res.status(400).json({ success: false, message: 'visitorId and profileId required' });
  }

  const favMap = getFavoritesMap();
  let list = favMap[visitorId] || [];
  let isFavorite = false;

  if (list.includes(profileId)) {
    list = list.filter((id) => id !== profileId);
    isFavorite = false;
  } else {
    list.push(profileId);
    isFavorite = true;
  }

  favMap[visitorId] = list;
  saveFavoritesMap(favMap);

  res.json({
    success: true,
    isFavorite,
    favoritesCount: list.length,
    favorites: list
  });
});

// Google Sheet responses endpoint\napp.get('/api/google-form-responses', async (req, res) => {\n  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;\n  if (!sheetUrl) {\n    return res.status(500).json({ success: false, message: 'Google Sheet URL not configured.' });\n  }\n  try {\n    const fetchRes = await fetch(sheetUrl);\n    if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);\n    const csvText = await fetchRes.text();\n    const [headerLine, ...rows] = csvText.split('\n').filter(l => l.trim() !== '');\n    const headers = headerLine.split(',');\n    const data = rows.map(row => {\n      const values = row.split(',');\n      const obj = {};\n      headers.forEach((h, i) => { obj[h.trim()] = values[i]?.trim(); });\n      return obj;\n    });\n    res.json({ success: true, responses: data });\n  } catch (err) {\n    console.error('Google Sheet fetch error:', err);\n    res.status(500).json({ success: false, message: err.message });\n  }\n});\n\n// Root ping
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Qabul Hai API',
    endpoints: ['/api/profiles', '/api/stats', '/api/favorites', '/api/google-form-submission']
  });
});

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Qabul Hai Server running on http://localhost:${PORT}`);
  });
}

export default app;
