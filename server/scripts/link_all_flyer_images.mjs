import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverProfilesPath = path.join(__dirname, '..', 'data', 'profiles.json');
const clientProfilesPath = path.join(__dirname, '..', '..', 'client', 'src', 'data', 'profiles.json');
const clientUploadsDir = path.join(__dirname, '..', '..', 'client', 'public', 'uploads');
const serverUploadsDir = path.join(__dirname, '..', 'public', 'uploads');

const clientUploads = new Set(fs.readdirSync(clientUploadsDir));
const serverUploads = new Set(fs.readdirSync(serverUploadsDir));

function updateProfilesFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let updatedCount = 0;

  for (const profile of data) {
    if (!profile.image && profile.instagramPostId) {
      const filename = `ig_${profile.instagramPostId}.jpg`;
      if (clientUploads.has(filename) || serverUploads.has(filename)) {
        profile.image = `/uploads/${filename}`;
        updatedCount++;
      }
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Updated ${updatedCount} profiles in ${filePath}`);
}

updateProfilesFile(serverProfilesPath);
updateProfilesFile(clientProfilesPath);
