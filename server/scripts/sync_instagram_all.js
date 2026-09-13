import { scrapeInstagramFeed } from './instagram_scraper.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function syncAll() {
  try {
    const posts = await scrapeInstagramFeed(1000); // attempt to get all posts
    const outputPath = path.join(__dirname, '..', 'data', 'profiles.json');
    fs.writeFileSync(outputPath, JSON.stringify(posts, null, 2), 'utf8');
    console.log(`Synced ${posts.length} Instagram posts to ${outputPath}`);
  } catch (err) {
    console.error('Error syncing Instagram:', err);
    process.exit(1);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  syncAll();
}
