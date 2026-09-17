import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useStoreIssues(filters) {
  return useQuery({
    queryKey: ['store-issues', filters || {}],
    queryFn: async () => {
      const { data } = await http.get('/store-issues', { params: filters || undefined });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useStoreIssue(id) {
  return useQuery({
    queryKey: ['store-issue', id],
    queryFn: async () => {
      const { data } = await http.get(`/store-issues/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 5_000,
  });
}

export function useUpdateStoreIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await http.patch(`/store-issues/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-issues'], exact: false });
      qc.invalidateQueries({ queryKey: ['store-issue'], exact: false });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update store issue');
    },
  });
}

export function useDeleteStoreIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/store-issues/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-issues'], exact: false });
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'], exact: false });
      toast.success('Store issue deleted, stock restored');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not delete store issue');
    },
  });
}

export function useCreateStoreIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post('/store-issues', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-issues'], exact: false });
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'], exact: false });
      qc.invalidateQueries({ queryKey: ['consumables-tracking'] });
      toast.success('Store issue created');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not create store issue');
    },
  });
}
