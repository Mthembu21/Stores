import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useReturnTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ recordId, condition }) => {
      const { data } = await http.post('/return', { recordId, condition });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['borrowings'], exact: false });
      qc.invalidateQueries({ queryKey: ['tools'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Tool returned');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not return tool');
    },
  });
}
