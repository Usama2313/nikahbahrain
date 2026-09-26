// Supabase client — Direct Database CRUD on 'profiles' table
// All operations (Create, Read, Update, Delete) are executed directly on the Supabase database.
// No local storage dependencies — guarantees real-time synchronization across mobile phones & desktops.
import { createClient } from '@supabase/supabase-js';

const RAW_URL = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL)) || '';
const RAW_KEY = (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)) || '';

const SUPABASE_URL = (RAW_URL && !RAW_URL.includes('awweckttcpgzxbvntiyv'))
  ? RAW_URL
  : 'https://qfjwpsglllvoztwgqitw.supabase.co';

const SUPABASE_ANON_KEY = (RAW_KEY && !RAW_KEY.includes('awweckttcpgzxbvntiyv') && !RAW_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2Vja3R0Y3Bnenhidm50aXl2'))
  ? RAW_KEY
  : 'sb_publishable_u1s9_wcNHOOUjYZXvt5dcw_VJveOlDz';

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

// Convert app profile object to Supabase 'profiles' table row
export function profileToRow(p) {
  let cleanAge = null;
  if (p.age !== null && p.age !== undefined && p.age !== '') {
    const parsed = parseInt(String(p.age).replace(/\D+/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0 && parsed < 120) {
      cleanAge = parsed;
    }
  }

  const gender = (p.gender || 'male').toLowerCase().trim() === 'female' ? 'female' : 'male';
  let cat = p.category || (gender === 'female' ? 'brides' : 'grooms');

  return {
    id: String(p.id || '').trim(),
    name: p.name || '',
    gender: gender,
    marital_status: p.maritalStatus || '',
    category: cat,
    nationality: p.nationality || '',
    age: cleanAge,
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
    updated_at: new Date().toISOString(),
  };
}

// Convert Supabase 'profiles' row back to app profile object
export function rowToProfile(row) {
  const gender = (row.gender || 'male').toLowerCase().trim() === 'female' ? 'female' : 'male';
  return {
    id: String(row.id || '').trim(),
    name: row.name || '',
    gender: gender,
    maritalStatus: row.marital_status || '',
    category: row.category || (gender === 'female' ? 'brides' : 'grooms'),
    nationality: row.nationality || '',
    age: row.age ? Number(row.age) : null,
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

// ─── Direct Database CRUD Operations ─────────────────────────────────────────

/**
 * READ: Fetch all profiles directly from Supabase database
 * Uses pagination to support 1,000+ profiles seamlessly.
 */
export async function supabaseFetchProfiles() {
  const db = getSupabase();
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

      if (error) {
        console.error('[Supabase DB] Fetch error:', error.message);
        break;
      }

      if (data && data.length > 0) {
        allRows = allRows.concat(data);
        from += BATCH_SIZE;
        hasMore = data.length === BATCH_SIZE;
      } else {
        hasMore = false;
      }
    }

    if (allRows.length > 0) {
      return allRows.map(rowToProfile);
    }
  } catch (err) {
    console.error('[Supabase DB] Exception fetching profiles:', err.message);
  }
  return [];
}

/**
 * CREATE / UPDATE: Upsert profile directly into Supabase database
 */
export async function supabaseUpsertProfile(profile) {
  const db = getSupabase();
  const cleanId = String(profile.id || '').trim();
  if (!cleanId) throw new Error('Profile must have an ID');

  const row = profileToRow(profile);
  const { data, error } = await db
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('[Supabase DB] Upsert error for ID:', cleanId, error.message, error.details || '');
    throw error;
  }

  const savedRow = Array.isArray(data) && data.length > 0 ? data[0] : row;
  console.log('[Supabase DB] Successfully upserted profile into database:', cleanId);
  return rowToProfile(savedRow);
}

/**
 * DELETE: Delete profile directly from Supabase database
 */
export async function supabaseDeleteProfile(id) {
  const db = getSupabase();
  const cleanId = String(id || '').trim();
  if (!cleanId) return true;

  const { error } = await db
    .from('profiles')
    .delete()
    .eq('id', cleanId);

  if (error) {
    console.error('[Supabase DB] Delete error for ID:', cleanId, error.message);
    throw error;
  }

  console.log('[Supabase DB] Successfully deleted profile from database:', cleanId);
  return true;
}
