import axios from 'axios';

const api = axios.create({
  // baseURL: 'http://localhost:5050/api', <--- Old Local URL
  baseURL: 'https://a1-backend-ztym.onrender.com/api', // <--- New Live URL
});

// Add token to every request if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;