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
      if (storedUser) {
        try {
          return JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing stored user data:', e);
        }
      }
      
      // If no stored user, try to fetch from API
      const { data } = await http.get('/auth/me');
      return data;
    },
    staleTime: 30_000,
    retry: false, // Don't retry on 401 errors
    refetchOnWindowFocus: false, // Don't refetch on window focus
    onError: (error) => {
      console.log('useMe error:', error);
      // Handle all errors including connection issues
      if (error.response?.status === 401) {
        // Token is invalid, clear it and let the interceptor handle redirect
        console.log('Authentication token expired or invalid');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      } else if (error.code === 'ECONNABORTED' || error.message.includes('Network Error')) {
        // Connection error, clear token and redirect to login
        console.log('Connection error, clearing authentication');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
  });
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = '/login';
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
