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
