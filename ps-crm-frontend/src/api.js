import axios from 'axios';

// ✅ PRODUCTION FIX: Use environment variable for backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

console.log('[API] Using backend URL:', API_BASE_URL);

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 second timeout
});

API.interceptors.request.use((req) => {
  const user = localStorage.getItem('user');
  if (user) {
    try {
      req.headers.Authorization = `Bearer ${JSON.parse(user).token}`;
    } catch (e) {
      console.warn('[API] Failed to parse user token');
    }
  }
  return req;
});

// ✅ Add response error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout - backend may be slow or unreachable');
    } else if (!error.response) {
      console.error('[API] Network error - could not reach backend:', error.message);
    }
    return Promise.reject(error);
  }
);

export default API;