import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useNonStockItems(filters) {
  return useQuery({
    queryKey: ['non-stock-items', filters || {}],
    queryFn: async () => {
      const { data } = await http.get('/non-stock-items', { params: filters || undefined });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useBulkImportNonStockItems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items) => {
      const { data } = await http.post('/non-stock-items/bulk', { items });
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['non-stock-items'], exact: false });
      if (data.upsertedCount > 0 || data.modifiedCount > 0) {
        toast.success(`${data.upsertedCount} added, ${data.modifiedCount} updated${data.errorCount ? `, ${data.errorCount} skipped` : ''}`);
      } else {
        toast.error('No items were imported');
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Bulk import failed');
    },
  });
}

export function useDeleteNonStockItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/non-stock-items/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['non-stock-items'], exact: false });
      toast.success('Removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove item');
    },
  });
}
