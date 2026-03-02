import { useQuery } from '@tanstack/react-query';
import { http } from './http';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data } = await http.get('/dashboard');
      return data;
    },
    staleTime: 10_000,
  });
}
