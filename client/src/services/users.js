import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await http.get('/users');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ fullName, employeeNumber, role, department, contactNumber, password }) => {
      const { data } = await http.post('/users', {
        fullName,
        employeeNumber,
        role,
        department,
        contactNumber,
        password,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User created');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not create user');
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/users/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not delete user');
    },
  });
}
