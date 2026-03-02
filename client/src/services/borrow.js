import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useBorrowings(status) {
  return useQuery({
    queryKey: ['borrowings', status || 'all'],
    queryFn: async () => {
      const { data } = await http.get('/borrow', { params: status ? { status } : undefined });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useBorrowTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ toolId, borrowerId, expectedReturnAt, jobNumber }) => {
      const { data } = await http.post('/borrow', { toolId, borrowerId, expectedReturnAt, jobNumber });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['borrowings'], exact: false });
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool borrowed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not borrow tool');
    },
  });
}
