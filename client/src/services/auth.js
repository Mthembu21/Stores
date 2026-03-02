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
  });
}

export function logout() {
  localStorage.removeItem('token');
}
