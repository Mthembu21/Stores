import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useKpiEntries(limit) {
  return useQuery({
    queryKey: ['kpi-entries', limit || 30],
    queryFn: async () => {
      const { data } = await http.get('/kpi-entries', { params: { limit: limit || 30 } });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useSaveKpiEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, values }) => {
      const { data } = await http.post('/kpi-entries', { date, values });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpi-entries'], exact: false });
      toast.success('KPIs saved');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not save KPIs');
    },
  });
}
