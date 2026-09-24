// Supabase client for direct browser-to-Supabase writes (fallback when server API unavailable)
// The anon key is safe to embed in the frontend - Supabase Row Level Security (RLS) governs access.
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

// Normalize profile to Supabase row format
export function profileToRow(p) {
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

// Normalize Supabase row back to profile format
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

// Direct upsert to Supabase (bypasses server API)
export async function supabaseUpsertProfile(profile) {
  const db = getSupabase();
  const row = profileToRow(profile);
  const { data, error } = await db
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToProfile(data);
}

// Direct delete from Supabase (bypasses server API)
export async function supabaseDeleteProfile(id) {
  const db = getSupabase();
  const { error } = await db.from('profiles').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return true;
}

// Fetch all profiles directly from Supabase
export async function supabaseFetchProfiles() {
  const db = getSupabase();
  const { data, error } = await db
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToProfile);
}
