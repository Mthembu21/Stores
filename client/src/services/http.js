import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://stores-backend.onrender.com/api',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle 401 errors
http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('HTTP: Response error:', error.response?.status, error.response?.data);
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('HTTP: 401 error detected, checking if login was recent');
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      const now = Date.now();
      const timeSinceLogin = loginTimestamp ? now - parseInt(loginTimestamp) : Infinity;
      
      console.log('HTTP: time since login:', timeSinceLogin, 'ms');
      
      // Only clear token if login was more than 5 seconds ago (to handle race conditions)
      if (timeSinceLogin > 5000) {
        console.log('HTTP: clearing localStorage due to old 401 error');
        console.log('HTTP: localStorage before clear:', JSON.stringify(localStorage));
        // Clear the invalid token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
        console.log('HTTP: localStorage after clear:', JSON.stringify(localStorage));
        
        // Only redirect if not already on login page to prevent infinite loops
        if (window.location.pathname !== '/login') {
          // Use replace to avoid history issues
          window.location.replace('/login');
        }
      } else {
        console.log('HTTP: recent login detected, not clearing token for 401 error');
      }
    }
    
    return Promise.reject(error);
  }
);
