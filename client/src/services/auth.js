import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ employeeNumber, password }) => {
      const { data } = await http.post('/auth/login', { employeeNumber, password });
      return data;
    },
    onSuccess: (data) => {
      console.log('Login success:', data);
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        // Also store login timestamp for debugging
        localStorage.setItem('loginTimestamp', Date.now().toString());
      }
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Logged in');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Login failed');
    },
  });
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      // First check if we have user data in localStorage
      const storedUser = localStorage.getItem('user');
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      
      if (storedUser && loginTimestamp) {
        try {
          const userData = JSON.parse(storedUser);
          // Check if login is recent (within last 5 minutes)
          const loginTime = parseInt(loginTimestamp);
          const currentTime = Date.now();
          const timeDiff = currentTime - loginTime;
          
          if (timeDiff < 5 * 60 * 1000) { // 5 minutes
            console.log('Using cached user data, age:', Math.floor(timeDiff / 60000), 'minutes');
            return userData;
          }
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // If no recent cached data, try to fetch from API
      console.log('Fetching fresh user data from API');
      try {
        const { data } = await http.get('/auth/me');
        return data;
      } catch (error) {
        console.error('API fetch error:', error);
        // Return null instead of throwing to prevent crashes
        return null;
      }
    },
    staleTime: 30_000,
    retry: false, // Don't retry on 401 errors
    refetchOnWindowFocus: false, // Don't refetch on window focus
    onError: (error) => {
      console.error('useMe error:', error);
      
      // Handle all errors including connection issues
      if (error.response?.status === 401) {
        // Token is invalid, clear it and let the interceptor handle redirect
        console.log('Authentication token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
        // Connection error, clear token and redirect to login
        console.log('Connection error, clearing authentication');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
      } else {
        // For other errors, also clear auth data to be safe
        console.log('Other authentication error:', error.message);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
      }
    },
  });
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('loginTimestamp');
  // Redirect to login page
  window.location.href = '/login';
}

export function forceLogout() {
  console.log('Force logging out due to authentication issues');
  localStorage.clear();
  sessionStorage.clear();
  // Redirect to login page
  window.location.href = '/login';
}

export function getStoredToken() {
  return localStorage.getItem('token');
}

export function isTokenValid(token) {
  if (!token) return false;
  
  try {
    // Simple JWT validation - check if token is properly formatted
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Date.now() / 1000;
    
    // Check if token is expired (24 hours)
    if (payload.exp < currentTime - 86400) return false;
    
    return true;
  } catch (e) {
    return false;
  }
}

export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Force page reload to clear any cached state
  window.location.reload();
}

export function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token; // Returns true if token exists
}

export function getToken() {
  return localStorage.getItem('token');
}
