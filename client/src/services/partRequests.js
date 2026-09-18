import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function usePartRequests(filters) {
  return useQuery({
    queryKey: ['part-requests', filters || {}],
    queryFn: async () => {
      const { data } = await http.get('/part-requests', { params: filters || undefined });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useCreatePartRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post('/part-requests', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-requests'], exact: false });
      toast.success('Part flagged to order');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not flag part');
    },
  });
}

export function useUpdatePartRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await http.patch(`/part-requests/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-requests'], exact: false });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update part request');
    },
  });
}

export function useDeletePartRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/part-requests/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['part-requests'], exact: false });
      toast.success('Removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove part request');
    },
  });
}
