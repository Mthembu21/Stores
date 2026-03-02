import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useTools() {
  return useQuery({
    queryKey: ['tools'],
    queryFn: async () => {
      const { data } = await http.get('/tools');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useUpdateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }) => {
      const { data } = await http.patch(`/tools/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool updated');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update tool');
    },
  });
}

export function useDeleteTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/tools/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool deleted');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not delete tool');
    },
  });
}

export function useCreateTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ toolName, toolCode, category, quantityTotal, quantityAvailable }) => {
      const { data } = await http.post('/tools', {
        toolName,
        toolCode,
        category,
        quantityTotal,
        quantityAvailable,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool created');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not create tool');
    },
  });
}
