-- Run this SQL in your Supabase SQL Editor to create the profiles table
-- Go to: https://app.supabase.com → Your Project → SQL Editor → New Query

CREATE TABLE IF NOT EXISTS profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  gender TEXT NOT NULL DEFAULT 'male',
  marital_status TEXT DEFAULT '',
  category TEXT DEFAULT 'grooms',
  nationality TEXT DEFAULT '',
  age INTEGER,
  height TEXT DEFAULT '',
  sect TEXT DEFAULT '',
  caste TEXT DEFAULT '',
  education TEXT DEFAULT '',
  profession TEXT DEFAULT '',
  salary TEXT DEFAULT '',
  location TEXT DEFAULT '',
  residence TEXT DEFAULT '',
  siblings TEXT DEFAULT '',
  father TEXT DEFAULT '',
  mother TEXT DEFAULT '',
  family TEXT DEFAULT '',
  languages TEXT DEFAULT '',
  complexion TEXT DEFAULT '',
  build TEXT DEFAULT '',
  about TEXT DEFAULT '',
  requirements TEXT DEFAULT '',
  contact TEXT DEFAULT '+973 3718 8557',
  image TEXT DEFAULT '',
  instagram_post_url TEXT DEFAULT '',
  instagram_post_id TEXT DEFAULT '',
  raw_flyer_text TEXT DEFAULT '',
  verified BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);

-- Allow public read access (anonymous users can view profiles)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Allow all operations for authenticated users (admin)
CREATE POLICY "Authenticated users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update profiles"
  ON profiles FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete profiles"
  ON profiles FOR DELETE
  USING (true);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_category ON profiles(category);
CREATE INDEX IF NOT EXISTS idx_profiles_nationality ON profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_profiles_gender ON profiles(gender);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at DESC);
