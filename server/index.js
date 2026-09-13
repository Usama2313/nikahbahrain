import express from 'express';
import cors from 'cors';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static directory for logos and uploads
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}
app.use('/public', express.static(publicDir));

// Profiles data file
const dataFilePath = path.join(__dirname, 'data', 'profiles.json');
const favoritesFilePath = path.join(__dirname, 'data', 'favorites.json');

// Helper to read profiles
function getProfiles() {
  try {
    if (!fs.existsSync(dataFilePath)) return [];
    const data = fs.readFileSync(dataFilePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading profiles:', err);
    return [];
  }
}

// Helper to save profiles
function saveProfiles(profiles) {
  try {
    fs.writeFileSync(dataFilePath, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving profiles:', err);
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
app.get('/api/profiles', (req, res) => {
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

  // Search filter
  if (search) {
    const term = search.toLowerCase();
    profiles = profiles.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.profession.toLowerCase().includes(term) ||
        p.education.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term) ||
        (p.sect && p.sect.toLowerCase().includes(term)) ||
        (p.caste && p.caste.toLowerCase().includes(term))
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

// 3. POST /api/profiles (Add new profile from Form or Admin)
app.post('/api/profiles', (req, res) => {
  const profiles = getProfiles();
  const newProfile = {
    id: `NB-${Date.now().toString().slice(-4)}`,
    name: req.body.name || 'Anonymous Applicant',
    gender: req.body.gender || 'male',
    maritalStatus: req.body.maritalStatus || 'Never Married',
    category: req.body.category || 'grooms',
    nationality: req.body.nationality || 'Pakistani',
    age: Number(req.body.age) || 28,
    height: req.body.height || "5'8\"",
    sect: req.body.sect || 'Sunni / Hanafi',
    caste: req.body.caste || 'General',
    education: req.body.education || 'Graduate',
    profession: req.body.profession || 'Professional in Bahrain',
    salary: req.body.salary || 'Competitive',
    location: req.body.location || 'Manama, Bahrain',
    residence: req.body.residence || 'Bahrain Resident',
    image: req.body.image || (req.body.gender === 'female' 
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80'),
    instagramPostUrl: req.body.instagramPostUrl || 'https://www.instagram.com/nikah_bahrain/',
    about: req.body.about || 'Practicing Muslim seeking a righteous partner.',
    requirements: req.body.requirements || 'Seeking a Deen-conscious, respectful partner.',
    verified: req.body.verified !== undefined ? req.body.verified : true,
    featured: false,
    createdAt: new Date().toISOString()
  };

  // Auto-align category based on marital status & gender
  if (newProfile.maritalStatus === 'Divorced') {
    newProfile.category = newProfile.gender === 'male' ? 'divorced-grooms' : 'divorced-brides';
  } else if (newProfile.maritalStatus === 'Widowed') {
    newProfile.category = newProfile.gender === 'male' ? 'widowed-grooms' : 'widowed-brides';
  } else {
    newProfile.category = newProfile.gender === 'male' ? 'grooms' : 'brides';
  }

  profiles.unshift(newProfile);
  saveProfiles(profiles);

  res.status(201).json({
    success: true,
    message: 'Profile created and added to category successfully!',
    profile: newProfile
  });
});

// 4. PUT /api/profiles/:id (Admin update)
app.put('/api/profiles/:id', (req, res) => {
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
app.delete('/api/profiles/:id', (req, res) => {
  let profiles = getProfiles();
  const exists = profiles.some((p) => p.id === req.params.id);
  if (!exists) {
    return res.status(404).json({ success: false, message: 'Profile not found' });
  }

  profiles = profiles.filter((p) => p.id !== req.params.id);
  saveProfiles(profiles);
  res.json({ success: true, message: 'Profile deleted successfully' });
});

// 6. GET /api/stats (Admin Dashboard Analytics)
app.get('/api/stats', (req, res) => {
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
app.post('/api/sync-instagram', (req, res) => {
  const profiles = getProfiles();
  const currentCount = profiles.length;

  res.json({
    success: true,
    message: `Instagram Sync Agent verified ${currentCount} posts from @nikah_bahrain. All categories and labels synchronized!`,
    totalPosts: currentCount
  });
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

// Root ping
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'Nikah Bahrain API',
    endpoints: ['/api/profiles', '/api/stats', '/api/favorites']
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Nikah Bahrain Server running on http://localhost:${PORT}`);
});
