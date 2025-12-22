import axios from 'axios';

const API = axios.create({
  // Default order of precedence for API base URL:
  // 1. Vite env `VITE_API_URL` (set in your deployment platform)
  // 2. Deployed backend on Render (fallback for demo)
  // 3. Local development server
  baseURL: import.meta.env.VITE_API_URL || 'https://car-inventory1-uu7v.onrender.com/api' || 'http://localhost:5000/api',
});

// Add request interceptor
API.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  console.log('API Request:', config.method.toUpperCase(), config.baseURL + config.url);
  return config;
}, error => {
  console.error('API Request Error:', error);
  return Promise.reject(error);
});

// Add response interceptor
API.interceptors.response.use(response => {
  console.log('API Response:', response.status, response.config.method.toUpperCase(), response.config.url || response.config.baseURL + response.config.url);
  return response;
}, error => {
  console.error('API Response Error:', error.response?.status || 'Network Error', error.response?.data || error.message);
  return Promise.reject(error);
});

export default API;
