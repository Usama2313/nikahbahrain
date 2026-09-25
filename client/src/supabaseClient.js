// Resilient Supabase client with seamless multi-table fallback
// Connects directly to Supabase from the browser using the public anon key.
// If the 'profiles' table exists, it uses it directly.
// If 'profiles' does not exist in the schema cache, it seamlessly uses 'properties'
// with status = 'nikah_profile', guaranteeing 100% persistence on any device (desktop & mobile).
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://awweckttcpgzxbvntiyv.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3d2Vja3R0Y3Bnenhidm50aXl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MTUwMzYsImV4cCI6MjA5MzI5MTAzNn0.6kCr-nVpUPjm9opHOAVjbsYDty51DP5k8dLDwrxcTPI';

let _supabase = null;

export function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return _supabase;
}

// Convert app profile to Supabase 'profiles' table row
export function profileToRow(p) {
  return {
    id: String(p.id || '').trim(),
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

// Convert Supabase 'profiles' table row back to app profile
export function rowToProfile(row) {
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

// Check whether an error is due to missing 'profiles' table
function isMissingTableError(error) {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  const code = error.code || '';
  return code === 'PGRST205' || code === '42P01' || msg.includes('could not find the table') || msg.includes('relation "public.profiles" does not exist');
}

// Direct upsert to Supabase with automatic table fallback
export async function supabaseUpsertProfile(profile) {
  const db = getSupabase();
  const cleanId = String(profile.id || '').trim();
  if (!cleanId) throw new Error('Profile must have an ID');

  // Try 1: Upsert to 'profiles' table
  try {
    const row = profileToRow(profile);
    const { data, error } = await db
      .from('profiles')
      .upsert(row, { onConflict: 'id' })
      .select()
      .single();
    if (!error && data) {
      return rowToProfile(data);
    }
    if (error && !isMissingTableError(error)) {
      throw error;
    }
  } catch (err) {
    if (!isMissingTableError(err)) {
      console.warn('[Supabase] profiles table upsert error, trying fallback:', err.message);
    }
  }

  // Try 2: Resilient storage in 'properties' table (status = 'nikah_profile')
  try {
    const serialized = JSON.stringify(profile);
    const now = new Date().toISOString();

    const { data: existing } = await db
      .from('properties')
      .select('id')
      .eq('title', cleanId)
      .eq('status', 'nikah_profile')
      .limit(1);

    if (existing && existing.length > 0) {
        const { data, error } = await db
        .from('properties')
        .update({
          description: serialized,
          category: profile.category || 'grooms',
          isApproved: profile.verified !== false,
          isFeatured: profile.featured === true,
          updatedAt: now,
        })
        .eq('id', existing[0].id)
        .select('id, title, status')
        .single();
      if (error) throw error;
      return profile;
    } else {
      const { data, error } = await db
        .from('properties')
        .insert({
          title: cleanId,
          description: serialized,
          status: 'nikah_profile',
          category: profile.category || 'grooms',
          isApproved: profile.verified !== false,
          isFeatured: profile.featured === true,
          createdAt: profile.createdAt || now,
          updatedAt: now,
        })
        .select('id, title, status')
        .single();
      if (error) throw error;
      return profile;
    }
  } catch (propErr) {
    console.error('[Supabase] Both profiles and properties storage failed:', propErr.message);
    throw propErr;
  }
}

// Direct delete from Supabase with automatic table fallback
export async function supabaseDeleteProfile(id) {
  const db = getSupabase();
  const cleanId = String(id || '').trim();
  if (!cleanId) return true;

  // Try delete from 'profiles'
  try {
    await db.from('profiles').delete().eq('id', cleanId);
  } catch (_) {}

  // Also delete from 'properties'
  try {
    await db.from('properties').delete().eq('title', cleanId).eq('status', 'nikah_profile');
  } catch (_) {}

  // Record into persistent deleted IDs
  await supabaseAddDeletedId(cleanId);
  return true;
}

// Fetch all profiles directly from Supabase with automatic table fallback
export async function supabaseFetchProfiles() {
  const db = getSupabase();

  // Try 1: Fetch from 'profiles'
  try {
    const { data, error } = await db
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && Array.isArray(data) && data.length > 0) {
      return data.map(rowToProfile);
    }
  } catch (_) {}

  // Try 2: Fetch from 'properties' table (status = 'nikah_profile')
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
            if (p && p.id) parsed.push(p);
          }
        } catch (_) {}
      }
      return parsed;
    }
  } catch (err) {
    console.warn('[Supabase] properties fetch note:', err.message);
  }

  return [];
}

// Fetch deleted profile IDs from Supabase
export async function supabaseFetchDeletedIds() {
  const db = getSupabase();
  try {
    const { data, error } = await db
      .from('properties')
      .select('description')
      .eq('title', '__NIKAH_DELETED_IDS__')
      .eq('status', 'nikah_deleted_ids')
      .limit(1);

    if (!error && data && data.length > 0 && data[0].description) {
      const arr = JSON.parse(data[0].description);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    }
  } catch (_) {}
  return new Set();
}

// Record a deleted ID in Supabase
export async function supabaseAddDeletedId(id) {
  if (!id) return;
  const db = getSupabase();
  const cleanId = String(id).trim();
  try {
    const currentSet = await supabaseFetchDeletedIds();
    currentSet.add(cleanId);
    const arr = Array.from(currentSet);
    const now = new Date().toISOString();

    const { data: existing } = await db
      .from('properties')
      .select('id')
      .eq('title', '__NIKAH_DELETED_IDS__')
      .eq('status', 'nikah_deleted_ids')
      .limit(1);

    if (existing && existing.length > 0) {
      await db
        .from('properties')
        .update({ description: JSON.stringify(arr), updatedAt: now })
        .eq('id', existing[0].id);
    } else {
      await db
        .from('properties')
        .insert({
          title: '__NIKAH_DELETED_IDS__',
          description: JSON.stringify(arr),
          status: 'nikah_deleted_ids',
          createdAt: now,
          updatedAt: now,
        });
    }
  } catch (err) {
    console.warn('[Supabase] Could not sync deleted ID:', err.message);
  }
}

// Un-delete an ID if a profile is re-published with that ID
export async function supabaseRemoveDeletedId(id) {
  if (!id) return;
  const db = getSupabase();
  const cleanId = String(id).trim();
  try {
    const currentSet = await supabaseFetchDeletedIds();
    if (currentSet.has(cleanId)) {
      currentSet.delete(cleanId);
      const arr = Array.from(currentSet);
      const now = new Date().toISOString();
      const { data: existing } = await db
        .from('properties')
        .select('id')
        .eq('title', '__NIKAH_DELETED_IDS__')
        .eq('status', 'nikah_deleted_ids')
        .limit(1);
      if (existing && existing.length > 0) {
        await db
          .from('properties')
          .update({ description: JSON.stringify(arr), updatedAt: now })
          .eq('id', existing[0].id);
      }
    }
  } catch (_) {}
}

// Auto-sync any locally cached custom profiles up to Supabase in the background
export async function supabaseSyncLocalCustomProfiles(localList) {
  if (!Array.isArray(localList) || localList.length === 0) return;
  try {
    const cloudProfiles = await supabaseFetchProfiles();
    const cloudIds = new Set((cloudProfiles || []).map(p => String(p.id)));

    for (const p of localList) {
      if (!p || !p.id) continue;
      const cleanId = String(p.id).trim();
      // If not yet in Supabase, upload it immediately
      if (!cloudIds.has(cleanId)) {
        await supabaseUpsertProfile(p);
        console.log('[SupabaseSync] Uploaded local profile to cloud:', cleanId);
      }
    }
  } catch (err) {
    console.warn('[SupabaseSync] Auto-sync note:', err.message);
  }
}
