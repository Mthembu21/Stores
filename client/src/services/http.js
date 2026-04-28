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
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('HTTP: 401 error detected, clearing localStorage');
      console.log('HTTP: localStorage before clear:', JSON.stringify(localStorage));
      // Clear the invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('HTTP: localStorage after clear:', JSON.stringify(localStorage));
      
      // Only redirect if not already on login page to prevent infinite loops
      if (window.location.pathname !== '/login') {
        // Use replace to avoid history issues
        window.location.replace('/login');
      }
    }
    
    return Promise.reject(error);
  }
);
