const isLocal = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('192.168.') ||
  window.location.hostname.startsWith('10.') ||
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.endsWith('.local')
);

// In local development or local network, connect to the Node backend on port 5000 (or use relative /api with Vite proxy).
const API_BASE = import.meta.env.VITE_API_BASE || 
  (isLocal ? `http://${window.location.hostname}:5000/api` : '/api');

export default API_BASE;
