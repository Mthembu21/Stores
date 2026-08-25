import { useQuery } from '@tanstack/react-query';
import { http } from './http';

export function usePartsDashboard() {
  return useQuery({
    queryKey: ['parts-dashboard'],
    queryFn: async () => {
      const { data } = await http.get('/parts-dashboard');
      return data;
    },
    staleTime: 10_000,
  });
}
