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
      localStorage.setItem('token', data.token);
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
      const { data } = await http.get('/auth/me');
      return data;
    },
    staleTime: 30_000,
    retry: false, // Don't retry on 401 errors
    refetchOnWindowFocus: false, // Don't refetch on window focus
    onError: (error) => {
      // Only handle 401 errors, let other errors bubble up
      if (error.response?.status === 401) {
        // Token is invalid, clear it and let the interceptor handle redirect
        console.log('Authentication token expired or invalid');
      }
    },
  });
}

export function logout() {
  localStorage.removeItem('token');
  // Clear any other auth-related data if needed
  localStorage.removeItem('user');
  // Redirect to login page
  window.location.href = '/login';
}

export function isAuthenticated() {
  const token = localStorage.getItem('token');
  return !!token; // Returns true if token exists
}

export function getToken() {
  return localStorage.getItem('token');
}
