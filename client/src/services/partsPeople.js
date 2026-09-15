import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function usePartsPeople(role) {
  return useQuery({
    queryKey: ['parts-people', role || 'all'],
    queryFn: async () => {
      const { data } = await http.get('/parts-people', { params: role ? { role } : undefined });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreatePartsPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, zNumber, role }) => {
      const { data } = await http.post('/parts-people', { name, zNumber, role });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts-people'], exact: false });
      toast.success('Person added');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not add person');
    },
  });
}

export function useDeletePartsPerson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/parts-people/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parts-people'], exact: false });
      toast.success('Person removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove person');
    },
  });
}
