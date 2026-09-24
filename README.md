# Qabul Hai (Matrimonial Platform)

**Qabul Hai** - Verified Muslim Matrimonial & Matchmaking Web Platform for Bahrain and GCC residents.

## Features
- **230+ Verified Profiles**: Fully synchronized profiles across Grooms, Brides, Divorced, and Widowed candidates.
- **Database-First Architecture**: All profiles are stored in the server database (Supabase PostgreSQL or persistent JSON fallback). No localStorage dependency — desktop, mobile, and every device see the exact same profile list.
- **Admin Panel CRUD**: Full Create, Read, Update, Delete operations from the Admin Panel. New profiles instantly appear on the website and all views (desktop & mobile).
- **Mobile & Desktop Sync**: API uses Vite's built-in proxy (`/api`) so mobile devices on the same WiFi automatically access the same backend without firewall issues.
- **Google Form & Live Synchronization**: Candidates submitted via the official Google Form webhook immediately appear on the live feed.
- **Search & Filters**: Multi-criteria filtering by nationality (Pakistani, Indian, Bahraini), marital status, sect, caste, education, and keywords. Category pills (All, Never Married, Divorced, 2nd Marriage, Late Wife) filter in real-time for admin-created profiles too.
- **Direct WhatsApp & Social Connect**: Direct one-click inquiry to family coordinators via WhatsApp and official Instagram reference.
- **Favorites & Shortlisting**: Save favorite profiles with the server persisting favorites per visitor.
- **Express Backend & Vite React Frontend**: Ultra-fast REST API with rich responsive UI.

## Tech Stack
- **Frontend**: React, Vite, Lucide Icons, Canvas Confetti, React Spring, CSS
- **Backend**: Node.js, Express, RESTful API
- **Database**: Supabase PostgreSQL (primary) with JSON file fallback (`server/data/profiles.json`)

## Getting Started

### 1. Install Dependencies
```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 2. Configure Supabase (Optional but Recommended)
Edit `server/.env`:
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
PORT=5001
```
Without Supabase configured, the app automatically uses the persistent `server/data/profiles.json` as the database.

### 3. Run Locally
```bash
# From the root directory:
npm run dev
```
Or double-click `start.bat`.

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001/api
- Admin Panel: http://localhost:5173/#admin (login: `admin` / `NikahBahrain@2026`)

### 4. Seed Supabase (if configured)
```bash
node server/seed_supabase.mjs
```

