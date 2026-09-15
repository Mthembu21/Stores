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
    mutationFn: async ({ fullName, employeeNumber, role, department, contactNumber, zNumber, allowedPages, password }) => {
      const { data } = await http.post('/users', {
        fullName,
        employeeNumber,
        role,
        department,
        contactNumber,
        zNumber,
        allowedPages,
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

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      const { data } = await http.patch(`/users/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User updated');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update user');
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
