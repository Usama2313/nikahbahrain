import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
// Initialize Supabase client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
let memoryProfilesCache = null;

function getSupabase() {
  if (!supabase && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (e) {
      console.warn('[DB] Supabase init error:', e.message);
    }
  }
  return supabase;
}

// Export for use in other server modules (e.g. index.js upload handler)
export function getSupabaseClient() {
  return getSupabase();
}

export function isDbAvailable() {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
}

// ─── Fallback: read/write local / serverless JSON file ───────────────────────────
export function getLocalProfiles() {
  if (Array.isArray(memoryProfilesCache) && memoryProfilesCache.length > 0) {
    return memoryProfilesCache;
  }
  const candidates = [
    path.join(__dirname, 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json'),
    '/tmp/profiles.json',
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(c, 'utf8'));
        if (Array.isArray(parsed) && parsed.length > 0) {
          memoryProfilesCache = parsed;
          return parsed;
        }
      } catch (_) {}
    }
  }
  return [];
}

export function saveLocalProfiles(profiles) {
  memoryProfilesCache = profiles;
  const jsonStr = JSON.stringify(profiles, null, 2);
  const targets = [
    path.join(__dirname, 'data', 'profiles.json'),
    path.join(process.cwd(), 'server', 'data', 'profiles.json'),
    path.join(__dirname, '..', 'client', 'src', 'data', 'profiles.json'),
    path.join(process.cwd(), 'client', 'src', 'data', 'profiles.json'),
    '/tmp/profiles.json',
  ];
  for (const t of targets) {
    try {
      const dir = path.dirname(t);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(t, jsonStr, 'utf8');
    } catch (_) {}
  }
}

// ─── Database Operations ───────────────────────────────────────────────────────

export async function dbGetProfiles() {
  const db = getSupabase();
  if (db) {
    try {
      // Supabase defaults to 1000 rows max per request.
      // We paginate internally in batches of 1000 to fetch ALL records
      // regardless of whether there are 200, 10,000, or 1,000,000+ rows.
      const BATCH_SIZE = 1000;
      let allRows = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error } = await db
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, from + BATCH_SIZE - 1);

        if (error) {
          console.warn('[DB] Supabase read error:', error.message);
          break;
        }

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          from += BATCH_SIZE;
          // If we got fewer rows than the batch size, we've reached the end
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      if (allRows.length > 0) {
        const normalized = allRows.map(normalizeFromDb);
        memoryProfilesCache = normalized;
        console.log(`[DB] Fetched ${normalized.length} total profiles from Supabase`);
        return normalized;
      }

      console.warn('[DB] Supabase returned empty results, using local fallback');
    } catch (err) {
      console.warn('[DB] Supabase unavailable, using local fallback:', err.message);
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
  // Safely merge with existing local profiles instead of overwriting
  const all = getLocalProfiles();
  const existingIds = new Set(all.map(p => p.id));
  const newItems = [];
  const updatedAll = all.map(p => {
    const incoming = profiles.find(x => x.id === p.id);
    return incoming ? { ...p, ...incoming } : p;
  });
  for (const p of profiles) {
    if (p && p.id && !existingIds.has(p.id)) {
      newItems.push(p);
    }
  }
  const merged = [...newItems, ...updatedAll];
  saveLocalProfiles(merged);
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
  // IMPORTANT: Always use empty string fallbacks for string fields.
  // Supabase returns null for optional columns. If we pass null through,
  // client-side filters calling .toLowerCase() on null will throw a TypeError
  // and silently drop profiles — causing desktop vs mobile count mismatches.
  return {
    id: row.id || '',
    name: row.name || '',
    gender: row.gender || 'male',
    maritalStatus: row.marital_status || '',
    category: row.category || 'grooms',
    nationality: row.nationality || '',
    age: row.age || null,
    height: row.height || '',
    sect: row.sect || '',
    caste: row.caste || '',
    education: row.education || '',
    profession: row.profession || '',
    salary: row.salary || '',
    location: row.location || '',
    residence: row.residence || '',
    siblings: row.siblings || '',
    father: row.father || '',
    mother: row.mother || '',
    family: row.family || '',
    languages: row.languages || '',
    complexion: row.complexion || '',
    build: row.build || '',
    about: row.about || '',
    requirements: row.requirements || '',
    contact: row.contact || '+973 3718 8557',
    image: row.image || '',
    instagramPostUrl: row.instagram_post_url || '',
    instagramPostId: row.instagram_post_id || '',
    rawFlyerText: row.raw_flyer_text || '',
    verified: row.verified !== false,
    featured: row.featured === true,
    createdAt: row.created_at || '',
    updatedAt: row.updated_at || null,
  };
}
