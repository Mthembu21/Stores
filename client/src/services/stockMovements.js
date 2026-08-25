import { useQuery } from '@tanstack/react-query';
import { http } from './http';

export function useStockMovements(filters) {
  return useQuery({
    queryKey: ['stock-movements', filters || {}],
    queryFn: async () => {
      const { data } = await http.get('/stock-movements', { params: filters || undefined });
      return data;
    },
    staleTime: 5_000,
  });
}
