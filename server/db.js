import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;

function getSupabase() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabase;
}

export function isDbAvailable() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ─── Fallback: read/write local JSON file ─────────────────────────────────────
function getLocalProfiles() {
  const candidates = [
    path.join(__dirname, 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', 'client', 'src', 'data', 'profiles.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try { return JSON.parse(fs.readFileSync(c, 'utf8')); } catch (_) {}
    }
  }
  return [];
}

function saveLocalProfiles(profiles) {
  const jsonStr = JSON.stringify(profiles, null, 2);
  const targets = [
    path.join(__dirname, 'data', 'profiles.json'),
    path.join(__dirname, '..', 'client', 'src', 'data', 'profiles.json'),
  ];
  for (const t of targets) {
    try {
      if (fs.existsSync(path.dirname(t))) fs.writeFileSync(t, jsonStr, 'utf8');
    } catch (_) {}
  }
}

// ─── Database Operations ───────────────────────────────────────────────────────

export async function dbGetProfiles() {
  const db = getSupabase();
  if (db) {
    try {
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data.map(normalizeFromDb);
      console.warn('[DB] Supabase read error, using JSON fallback:', error?.message);
    } catch (err) {
      console.warn('[DB] Supabase unavailable, using JSON fallback:', err.message);
    }
  }
  return getLocalProfiles();
}

export async function dbGetProfileById(id) {
  const db = getSupabase();
  if (db) {
    try {
      const { data, error } = await db.from('profiles').select('*').eq('id', id).single();
      if (!error && data) return normalizeFromDb(data);
    } catch (_) {}
  }
  return getLocalProfiles().find(p => p.id === id) || null;
}

export async function dbInsertProfile(profile) {
  const db = getSupabase();
  const row = normalizeForDb(profile);
  if (db) {
    try {
      const { data, error } = await db
        .from('profiles')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) {
        console.log(`[DB] Inserted/updated profile ${profile.id} in Supabase`);
        const all = getLocalProfiles();
        const idx = all.findIndex(p => p.id === profile.id);
        if (idx >= 0) all[idx] = profile; else all.unshift(profile);
        saveLocalProfiles(all);
        return normalizeFromDb(data);
      }
      console.warn('[DB] Supabase insert error:', error?.message);
    } catch (err) {
      console.warn('[DB] Supabase insert failed:', err.message);
    }
  }
  const all = getLocalProfiles();
  const idx = all.findIndex(p => p.id === profile.id);
  if (idx >= 0) all[idx] = profile; else all.unshift(profile);
  saveLocalProfiles(all);
  return profile;
}

export async function dbUpdateProfile(id, updates) {
  const db = getSupabase();
  const row = normalizeForDb({ ...updates, id, updatedAt: new Date().toISOString() });
  if (db) {
    try {
      const { data, error } = await db
        .from('profiles')
        .update(row)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        console.log(`[DB] Updated profile ${id} in Supabase`);
        const all = getLocalProfiles();
        const idx = all.findIndex(p => p.id === id);
        if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; saveLocalProfiles(all); }
        return normalizeFromDb(data);
      }
      console.warn('[DB] Supabase update error:', error?.message);
    } catch (err) {
      console.warn('[DB] Supabase update failed:', err.message);
    }
  }
  const all = getLocalProfiles();
  const idx = all.findIndex(p => p.id === id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLocalProfiles(all);
    return all[idx];
  }
  return null;
}

export async function dbDeleteProfile(id) {
  const db = getSupabase();
  if (db) {
    try {
      const { error } = await db.from('profiles').delete().eq('id', id);
      if (!error) {
        console.log(`[DB] Deleted profile ${id} from Supabase`);
        saveLocalProfiles(getLocalProfiles().filter(p => p.id !== id));
        return true;
      }
      console.warn('[DB] Supabase delete error:', error?.message);
    } catch (err) {
      console.warn('[DB] Supabase delete failed:', err.message);
    }
  }
  saveLocalProfiles(getLocalProfiles().filter(p => p.id !== id));
  return true;
}

export async function dbUpsertProfiles(profiles) {
  const db = getSupabase();
  if (db) {
    try {
      const rows = profiles.map(normalizeForDb);
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await db
          .from('profiles')
          .upsert(rows.slice(i, i + BATCH), { onConflict: 'id' });
        if (error) console.warn(`[DB] Batch ${i} upsert error:`, error.message);
      }
      console.log(`[DB] Upserted ${profiles.length} profiles into Supabase`);
    } catch (err) {
      console.warn('[DB] Bulk upsert failed:', err.message);
    }
  }
  saveLocalProfiles(profiles);
}

// ─── Normalizers ──────────────────────────────────────────────────────────────
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

function normalizeFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    gender: row.gender,
    maritalStatus: row.marital_status,
    category: row.category,
    nationality: row.nationality,
    age: row.age,
    height: row.height,
    sect: row.sect,
    caste: row.caste,
    education: row.education,
    profession: row.profession,
    salary: row.salary,
    location: row.location,
    residence: row.residence,
    siblings: row.siblings,
    father: row.father,
    mother: row.mother,
    family: row.family,
    languages: row.languages,
    complexion: row.complexion,
    build: row.build,
    about: row.about,
    requirements: row.requirements,
    contact: row.contact,
    image: row.image,
    instagramPostUrl: row.instagram_post_url,
    instagramPostId: row.instagram_post_id,
    rawFlyerText: row.raw_flyer_text,
    verified: row.verified,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
