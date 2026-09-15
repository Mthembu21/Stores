import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useConsumablePartIssues() {
  return useQuery({
    queryKey: ['consumable-part-issues'],
    queryFn: async () => {
      const { data } = await http.get('/consumable-part-issues');
      return data;
    },
    staleTime: 5_000,
  });
}

export function useCreateConsumablePartIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sparePartId, quantity, personName, zNumber, foremanName, issueDate }) => {
      const { data } = await http.post('/consumable-part-issues', {
        sparePartId,
        quantity,
        personName,
        zNumber,
        foremanName,
        issueDate,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumable-part-issues'] });
      qc.invalidateQueries({ queryKey: ['spare-parts'], exact: false });
      qc.invalidateQueries({ queryKey: ['parts-dashboard'] });
      qc.invalidateQueries({ queryKey: ['consumables-tracking'] });
      toast.success('Consumable issued');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not issue consumable');
    },
  });
}
