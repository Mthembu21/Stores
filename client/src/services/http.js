import axios from 'axios';

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    // Debug: Log when token is being sent
    console.log('Sending request with token:', token.substring(0, 20) + '...');
  } else {
    console.log('Sending request without token');
  }
  return config;
});

// Add response interceptor to handle 401 errors
http.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('Request failed:', error.response?.status, error.config?.url);
    
    // Handle 401 Unauthorized errors
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - clearing token and redirecting to login');
      
      // Clear the invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login page...');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);
