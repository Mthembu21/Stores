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
      console.log('useLogin: login success, data:', data);
      if (data.token) {
        console.log('useLogin: storing token in localStorage');
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('useLogin: token stored, verifying:', localStorage.getItem('token') ? 'exists' : 'missing');
      }
      console.log('useLogin: invalidating me query');
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
      const token = localStorage.getItem('token');
      console.log('useMe: token from localStorage:', token ? 'exists' : 'none');
      
      if (!token) {
        return null;
      }

      try {
        console.log('useMe: making request to /auth/me');
        const response = await http.get('/auth/me');
        console.log('useMe: response data:', response.data);
        return response.data;
      } catch (error) {
        console.log('useMe: error:', error.response?.status, error.response?.data);
        // Don't throw errors, just return null to prevent crashes
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
    refetchOnWindowFocus: false,
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
