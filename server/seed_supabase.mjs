#!/usr/bin/env node
/**
 * Seed Supabase database with all existing profiles from profiles.json
 * Run: node server/seed_supabase.mjs
 * 
 * Requires SUPABASE_URL and SUPABASE_ANON_KEY in server/.env
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in server/.env');
  console.error('   Create server/.env with:');
  console.error('   SUPABASE_URL=https://xxxx.supabase.co');
  console.error('   SUPABASE_ANON_KEY=your-anon-key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Load profiles from JSON
const profilesPath = path.join(__dirname, 'data', 'profiles.json');
const profiles = JSON.parse(fs.readFileSync(profilesPath, 'utf8'));

console.log(`📦 Seeding ${profiles.length} profiles into Supabase...`);

function normalizeForDb(p) {
  return {
    id: p.id,
    name: p.name || '',
    gender: p.gender || 'male',
    marital_status: p.maritalStatus || '',
    category: p.category || 'grooms',
    nationality: p.nationality || '',
    age: p.age ? Number(p.age) : null,
    height: p.height || '',
    sect: p.sect || '',
    caste: p.caste || '',
    education: p.education || '',
    profession: p.profession || '',
    salary: p.salary || '',
    location: p.location || '',
    residence: p.residence || '',
    siblings: p.siblings || '',
    father: p.father || '',
    mother: p.mother || '',
    family: p.family || '',
    languages: p.languages || '',
    complexion: p.complexion || '',
    build: p.build || '',
    about: p.about || '',
    requirements: p.requirements || '',
    contact: p.contact || '+973 3718 8557',
    image: p.image || '',
    instagram_post_url: p.instagramPostUrl || '',
    instagram_post_id: p.instagramPostId || '',
    raw_flyer_text: p.rawFlyerText || '',
    verified: p.verified !== false,
    featured: p.featured === true,
    created_at: p.createdAt || new Date().toISOString(),
    updated_at: p.updatedAt || null,
  };
}

const rows = profiles.map(normalizeForDb);

// Upsert in batches of 100
const BATCH = 100;
let inserted = 0;
let errors = 0;

for (let i = 0; i < rows.length; i += BATCH) {
  const batch = rows.slice(i, i + BATCH);
  const { error } = await supabase.from('profiles').upsert(batch, { onConflict: 'id' });
  if (error) {
    console.error(`❌ Batch ${i}-${i + BATCH} error:`, error.message);
    errors++;
  } else {
    inserted += batch.length;
    process.stdout.write(`\r✓ Inserted ${inserted}/${rows.length} profiles...`);
  }
}

console.log(`\n\n✅ Seeding complete! ${inserted} profiles inserted, ${errors} errors.`);

// Verify
const { data, error } = await supabase.from('profiles').select('id', { count: 'exact' });
if (!error) {
  console.log(`📊 Supabase now has ${data.length} profiles in database.`);
}
