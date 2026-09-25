import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client with real configuration check
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfjwpsglllvoztwgqitw.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_u1s9_wcNHOOUjYZXvt5dcw_VJveOlDz';

function isConfiguredSupabase(url, key) {
  return (
    !!url &&
    !!key &&
    !url.includes('your-project') &&
    !key.includes('your_supabase') &&
    url.startsWith('https://')
  );
}

let supabase = null;
let memoryProfilesCache = null;

function getSupabase() {
  if (!supabase && isConfiguredSupabase(SUPABASE_URL, SUPABASE_ANON_KEY)) {
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
  return isConfiguredSupabase(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ─── Deleted Profiles Persistent Registry ─────────────────────────────────────
function getDeletedIdsFilePath() {
  const candidates = [
    path.join(__dirname, 'data', 'deleted_ids.json'),
    path.join(process.cwd(), 'server', 'data', 'deleted_ids.json'),
    path.join(process.cwd(), 'data', 'deleted_ids.json'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, 'data', 'deleted_ids.json');
}

export function getDeletedProfileIds() {
  try {
    const file = getDeletedIdsFilePath();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (Array.isArray(data)) return new Set(data.map(String));
    }
  } catch (_) {}
  return new Set();
}

export function addDeletedProfileId(id) {
  if (!id) return;
  try {
    const current = getDeletedProfileIds();
    current.add(String(id));
    const arr = Array.from(current);
    const file = getDeletedIdsFilePath();
    const dir = path.dirname(file);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');

    // Also sync to client bundle if present
    const clientFile = path.join(__dirname, '..', 'client', 'src', 'data', 'deleted_ids.json');
    try {
      const cdir = path.dirname(clientFile);
      if (fs.existsSync(cdir)) {
        fs.writeFileSync(clientFile, JSON.stringify(arr, null, 2), 'utf8');
      }
    } catch (_) {}
  } catch (err) {
    console.warn('[DB] Could not record deleted ID:', err.message);
  }
}

export function removeDeletedProfileId(id) {
  if (!id) return;
  try {
    const current = getDeletedProfileIds();
    if (current.has(String(id))) {
      current.delete(String(id));
      const arr = Array.from(current);
      const file = getDeletedIdsFilePath();
      const dir = path.dirname(file);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, JSON.stringify(arr, null, 2), 'utf8');

      // Also sync to client bundle if present
      const clientFile = path.join(__dirname, '..', 'client', 'src', 'data', 'deleted_ids.json');
      try {
        const cdir = path.dirname(clientFile);
        if (fs.existsSync(cdir)) {
          fs.writeFileSync(clientFile, JSON.stringify(arr, null, 2), 'utf8');
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('[DB] Could not remove deleted ID:', err.message);
  }
}

// ─── Fallback: read/write local / serverless JSON file ───────────────────────────
export function getLocalProfiles() {
  const deletedIds = getDeletedProfileIds();
  if (Array.isArray(memoryProfilesCache) && memoryProfilesCache.length > 0) {
    return memoryProfilesCache.filter(p => p && p.id && !deletedIds.has(String(p.id)));
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
  const deletedIds = getDeletedProfileIds();
  const safeList = (profiles || []).filter(p => p && p.id && !deletedIds.has(String(p.id)));
  memoryProfilesCache = safeList;
  const jsonStr = JSON.stringify(safeList, null, 2);
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
  const deletedIds = getDeletedProfileIds();
  const db = getSupabase();
  if (db) {
    // 1. Try 'profiles' table
    try {
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

        if (error) break;

        if (data && data.length > 0) {
          allRows = allRows.concat(data);
          from += BATCH_SIZE;
          hasMore = data.length === BATCH_SIZE;
        } else {
          hasMore = false;
        }
      }

      if (allRows.length > 0) {
        const normalized = allRows
          .map(normalizeFromDb)
          .filter(p => p && p.id && !deletedIds.has(String(p.id)));
        memoryProfilesCache = normalized;
        console.log(`[DB] Fetched ${normalized.length} total profiles from Supabase profiles table`);
        return normalized;
      }
    } catch (_) {}

    // 2. Fallback: Try 'properties' table (status = 'nikah_profile')
    try {
      const { data, error } = await db
        .from('properties')
        .select('id, title, description, status, createdAt, updatedAt')
        .eq('status', 'nikah_profile')
        .order('createdAt', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        const parsed = [];
        for (const item of data) {
          try {
            if (item.description) {
              const p = JSON.parse(item.description);
              if (p && p.id && !deletedIds.has(String(p.id))) {
                parsed.push(p);
              }
            }
          } catch (_) {}
        }
        if (parsed.length > 0) {
          const localList = getLocalProfiles();
          const customIds = new Set(parsed.map(p => String(p.id)));
          const combined = [
            ...parsed,
            ...localList.filter(p => !customIds.has(String(p.id)) && !deletedIds.has(String(p.id)))
          ];
          memoryProfilesCache = combined;
          console.log(`[DB] Merged ${parsed.length} custom cloud profiles with ${localList.length} local profiles`);
          return combined;
        }
      }
    } catch (err) {
      console.warn('[DB] properties fetch note:', err.message);
    }
  }
  return getLocalProfiles();
}

export async function dbGetProfileById(id) {
  if (!id) return null;
  const deletedIds = getDeletedProfileIds();
  if (deletedIds.has(String(id))) return null;

  const db = getSupabase();
  if (db) {
    try {
      const { data, error } = await db.from('profiles').select('*').eq('id', id).single();
      if (!error && data) return normalizeFromDb(data);
    } catch (_) {}

    try {
      const { data, error } = await db
        .from('properties')
        .select('description')
        .eq('title', id)
        .eq('status', 'nikah_profile')
        .limit(1);
      if (!error && data && data.length > 0 && data[0].description) {
        return JSON.parse(data[0].description);
      }
    } catch (_) {}
  }
  return getLocalProfiles().find(p => p.id === id) || null;
}

export async function dbInsertProfile(profile) {
  if (!profile || !profile.id) return profile;
  removeDeletedProfileId(profile.id);

  const db = getSupabase();
  const row = normalizeForDb(profile);
  if (db) {
    // Try profiles table
    try {
      const { data, error } = await db
        .from('profiles')
        .upsert(row, { onConflict: 'id' })
        .select()
        .single();
      if (!error && data) {
        console.log(`[DB] Inserted/updated profile ${profile.id} in Supabase profiles`);
        const all = getLocalProfiles();
        const idx = all.findIndex(p => p.id === profile.id);
        if (idx >= 0) all[idx] = profile; else all.unshift(profile);
        saveLocalProfiles(all);
        return normalizeFromDb(data);
      }
    } catch (_) {}

    // Resilient fallback: store in properties table
    try {
      const now = new Date().toISOString();
      const { data: existing } = await db
        .from('properties')
        .select('id')
        .eq('title', profile.id)
        .eq('status', 'nikah_profile')
        .limit(1);

      if (existing && existing.length > 0) {
        await db
          .from('properties')
          .update({
            description: JSON.stringify(profile),
            category: profile.category || 'grooms',
            isApproved: profile.verified !== false,
            isFeatured: profile.featured === true,
            updatedAt: now,
          })
          .eq('id', existing[0].id);
      } else {
        await db
          .from('properties')
          .insert({
            title: profile.id,
            description: JSON.stringify(profile),
            status: 'nikah_profile',
            category: profile.category || 'grooms',
            isApproved: profile.verified !== false,
            isFeatured: profile.featured === true,
            createdAt: profile.createdAt || now,
            updatedAt: now,
          });
      }
      console.log(`[DB] Saved profile ${profile.id} to Supabase properties table`);
      const all = getLocalProfiles();
      const idx = all.findIndex(p => p.id === profile.id);
      if (idx >= 0) all[idx] = profile; else all.unshift(profile);
      saveLocalProfiles(all);
      return profile;
    } catch (propErr) {
      console.warn('[DB] Supabase insert failed on both tables:', propErr.message);
    }
  }

  const all = getLocalProfiles();
  const idx = all.findIndex(p => p.id === profile.id);
  if (idx >= 0) all[idx] = profile; else all.unshift(profile);
  saveLocalProfiles(all);
  return profile;
}

export async function dbUpdateProfile(id, updates) {
  if (!id) return null;
  removeDeletedProfileId(id);

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
        console.log(`[DB] Updated profile ${id} in Supabase profiles`);
        const all = getLocalProfiles();
        const idx = all.findIndex(p => p.id === id);
        if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; saveLocalProfiles(all); }
        return normalizeFromDb(data);
      }
    } catch (_) {}

    // Resilient fallback: update in properties table
    try {
      const now = new Date().toISOString();
      const { data: existing } = await db
        .from('properties')
        .select('id, description')
        .eq('title', id)
        .eq('status', 'nikah_profile')
        .limit(1);

      if (existing && existing.length > 0) {
        let merged = { ...updates, id, updatedAt: now };
        try {
          if (existing[0].description) {
            merged = { ...JSON.parse(existing[0].description), ...updates, id, updatedAt: now };
          }
        } catch (_) {}

        await db
          .from('properties')
          .update({
            description: JSON.stringify(merged),
            category: merged.category || 'grooms',
            isApproved: merged.verified !== false,
            isFeatured: merged.featured === true,
            updatedAt: now,
          })
          .eq('id', existing[0].id);

        console.log(`[DB] Updated profile ${id} in Supabase properties table`);
        const all = getLocalProfiles();
        const idx = all.findIndex(p => p.id === id);
        if (idx >= 0) { all[idx] = merged; saveLocalProfiles(all); }
        return merged;
      }
    } catch (_) {}
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
  if (!id) return false;
  addDeletedProfileId(id);

  const db = getSupabase();
  if (db) {
    try {
      await db.from('profiles').delete().eq('id', id);
    } catch (_) {}
    try {
      await db.from('properties').delete().eq('title', id).eq('status', 'nikah_profile');
    } catch (_) {}
    try {
      const { data: existing } = await db
        .from('properties')
        .select('id, description')
        .eq('title', '__NIKAH_DELETED_IDS__')
        .eq('status', 'nikah_deleted_ids')
        .limit(1);

      let currentArr = [String(id)];
      if (existing && existing.length > 0 && existing[0].description) {
        try {
          const arr = JSON.parse(existing[0].description);
          if (Array.isArray(arr)) {
            const set = new Set(arr.map(String));
            set.add(String(id));
            currentArr = Array.from(set);
          }
        } catch (_) {}
        await db
          .from('properties')
          .update({ description: JSON.stringify(currentArr), updatedAt: new Date().toISOString() })
          .eq('id', existing[0].id);
      } else {
        await db
          .from('properties')
          .insert({
            title: '__NIKAH_DELETED_IDS__',
            description: JSON.stringify(currentArr),
            status: 'nikah_deleted_ids',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
      }
    } catch (_) {}
  }

  // Remove from memory and file stores
  const current = getLocalProfiles().filter(p => p.id !== id);
  memoryProfilesCache = current;
  saveLocalProfiles(current);
  console.log(`[DB] Successfully purged profile ${id}. Remaining: ${current.length}`);
  return true;
}

export async function dbUpsertProfiles(profiles) {
  if (!Array.isArray(profiles) || profiles.length === 0) return;
  const deletedIds = getDeletedProfileIds();
  // Filter out any incoming profile that has been deleted
  const safeProfiles = profiles.filter(p => p && p.id && !deletedIds.has(String(p.id)));
  if (safeProfiles.length === 0) return;

  const db = getSupabase();
  if (db) {
    try {
      const rows = safeProfiles.map(normalizeForDb);
      const BATCH = 100;
      for (let i = 0; i < rows.length; i += BATCH) {
        const { error } = await db
          .from('profiles')
          .upsert(rows.slice(i, i + BATCH), { onConflict: 'id' });
        if (error) console.warn(`[DB] Batch ${i} upsert error:`, error.message);
      }
      console.log(`[DB] Upserted ${safeProfiles.length} profiles into Supabase`);
    } catch (err) {
      console.warn('[DB] Bulk upsert failed:', err.message);
    }
  }

  // Safely merge with existing local profiles, excluding deleted
  const all = getLocalProfiles();
  const existingIds = new Set(all.map(p => p.id));
  const newItems = [];
  const updatedAll = all.map(p => {
    const incoming = safeProfiles.find(x => x.id === p.id);
    return incoming ? { ...p, ...incoming } : p;
  });
  for (const p of safeProfiles) {
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
