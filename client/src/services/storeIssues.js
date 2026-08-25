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
      toast.success('Store issue created');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not create store issue');
    },
  });
}
