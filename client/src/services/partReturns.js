import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export const RETURN_CONDITIONS = ['Good', 'Damaged', 'Faulty'];

export function usePartReturn(id) {
  return useQuery({
    queryKey: ['part-return', id],
    queryFn: async () => {
      const { data } = await http.get(`/part-returns/${id}`);
      return data;
    },
    enabled: Boolean(id),
    staleTime: 5_000,
  });
}

export function useCreatePartReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post('/part-returns', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-issues'], exact: false });
      qc.invalidateQueries({ queryKey: ['store-issue'], exact: false });
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      qc.invalidateQueries({ queryKey: ['stock-movements'], exact: false });
      toast.success('Return recorded');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not record return');
    },
  });
}
