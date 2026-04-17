// Utility functions for debugging authentication issues

export function debugAuthState() {
  console.log('=== Authentication Debug Info ===');
  
  // Check if we're in browser environment
  if (typeof window === 'undefined') {
    console.log('Not in browser environment');
    return;
  }
  
  // Check token
  const token = localStorage.getItem('token');
  console.log('Token exists:', !!token);
  if (token) {
    console.log('Token length:', token.length);
    console.log('Token starts with:', token.substring(0, 20) + '...');
    console.log('Token ends with:', '...' + token.substring(token.length - 20));
    
    // Try to decode JWT payload (if it's a JWT)
    try {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('JWT payload:', payload);
        console.log('Token expires at:', new Date(payload.exp * 1000).toLocaleString());
        console.log('Token is expired:', Date.now() > payload.exp * 1000);
      }
    } catch (e) {
      console.log('Token is not a valid JWT or cannot be decoded');
    }
  }
  
  // Check user data
  const user = localStorage.getItem('user');
  console.log('User data exists:', !!user);
  if (user) {
    try {
      console.log('User data:', JSON.parse(user));
    } catch (e) {
      console.log('User data is not valid JSON');
    }
  }
  
  // Check current URL
  console.log('Current URL:', window.location.href);
  console.log('Current path:', window.location.pathname);
  
  console.log('=== End Debug Info ===');
}

export function forceClearAuth() {
  console.log('Force clearing authentication data...');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  console.log('Auth data cleared. Redirecting to login...');
  window.location.href = '/login';
}

export function checkApiConnection() {
  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  console.log('API Base URL:', baseURL);
  
  // Try to make a simple request to check connectivity
  fetch(`${baseURL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    console.log('API connectivity check response:', response.status);
    if (response.status === 401) {
      console.log('API is accessible but requires authentication');
    }
  })
  .catch(error => {
    console.error('API connectivity check failed:', error);
  });
}
