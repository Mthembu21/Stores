import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useSpareParts(filters) {
  return useQuery({
    queryKey: ['spare-parts', filters || {}],
    queryFn: async () => {
      const { data } = await http.get('/spare-parts', { params: filters || undefined });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useCreateSparePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post('/spare-parts', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      toast.success('Spare part created');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not create spare part');
    },
  });
}

export function useBulkCreateSpareParts() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (parts) => {
      const { data } = await http.post('/spare-parts/bulk', { parts });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      if (data.createdCount > 0) {
        toast.success(`${data.createdCount} part(s) added${data.errorCount ? `, ${data.errorCount} skipped` : ''}`);
      } else {
        toast.error('No parts were added');
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Bulk upload failed');
    },
  });
}

export function useUpdateSparePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      const { data } = await http.patch(`/spare-parts/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      toast.success('Spare part updated');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update spare part');
    },
  });
}

export function useConsumablesTracking() {
  return useQuery({
    queryKey: ['consumables-tracking'],
    queryFn: async () => {
      const { data } = await http.get('/spare-parts/consumables');
      return data;
    },
    staleTime: 5_000,
  });
}

export function useRestockSparePart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity, reason }) => {
      const { data } = await http.post(`/spare-parts/${id}/restock`, { quantity, reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      qc.invalidateQueries({ queryKey: ['consumables-tracking'] });
      toast.success('Stock restocked');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not restock part');
    },
  });
}
