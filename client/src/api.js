// Single unified API_BASE for all views (desktop, mobile via LAN WiFi, and production).
// In local dev, Vite automatically proxies /api to http://127.0.0.1:5001 (see vite.config.js).
// In production (e.g. Vercel or Node), /api routes directly to the backend.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default API_BASE;

