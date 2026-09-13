const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// In local development, connect to the local Node backend on port 5000.
// On Vercel / production, use relative '/api' endpoint on the same host.
const API_BASE = import.meta.env.VITE_API_BASE || 
  (isLocal ? `http://${window.location.hostname}:5000/api` : '/api');

export default API_BASE;
