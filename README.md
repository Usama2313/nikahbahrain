# Qabul Hai (Matrimonial Platform)

**Qabul Hai** - Verified Muslim Matrimonial & Matchmaking Web Platform for Bahrain and GCC residents.

## Features
- **All 227 Instagram Matrimonial Records**: Fully synchronized profiles across Grooms, Brides, Divorced, and Widowed candidates with complete flyer labels.
- **Detailed Instagram Labels**: Explicit labeled fields for **Siblings**, **Father's Details**, **Mother's Details**, **Family Background**, **Languages**, **Caste**, **Sect**, **Complexion & Build**, **Education**, and **Profession**.
- **Google Form & Live Synchronization**: Seamless integration where candidates submitted via the official Google Form or Webhook immediately appear on the live feed.
- **Search & Filters**: Multi-criteria filtering by nationality (Pakistani, Indian, Bahraini), marital status, sect, caste, siblings, education, and keywords.
- **Direct WhatsApp & Social Connect**: Direct one-click inquiry to family coordinators via WhatsApp and official Instagram reference.
- **Favorites & Shortlisting**: Save favorite profiles locally with animated confetti reactions.
- **Express Backend & Vite React Frontend**: Ultra-fast REST API with rich responsive UI.

## Tech Stack
- **Frontend**: React, Vite, Lucide Icons, Canvas Confetti, React Spring, CSS
- **Backend**: Node.js, Express, RESTful API
- **Data Storage**: JSON file database (`server/data/profiles.json`)

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

### 2. Run Locally
```bash
# From the root directory:
npm run dev
```
Or double-click `start.bat`.

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
