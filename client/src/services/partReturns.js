import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useCreatePartReturn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ storeIssueId, quantity, reason }) => {
      const { data } = await http.post('/part-returns', { storeIssueId, quantity, reason });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-issues'], exact: false });
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
