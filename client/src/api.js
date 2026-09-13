const hostname = typeof window !== 'undefined' && window.location.hostname 
  ? window.location.hostname 
  : 'localhost';

const API_BASE = `http://${hostname}:5000/api`;

export default API_BASE;
