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
      console.log('UPDATE TOOL: Starting update:', { id, patch });
      
      try {
        const { data } = await http.patch(`/tools/${id}`, patch);
        console.log('UPDATE TOOL: API response:', data);
        console.log('UPDATE TOOL: Update successful');
        return data;
      } catch (error) {
        console.error('UPDATE TOOL: API error:', error);
        console.error('UPDATE TOOL: Error response:', error.response);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('UPDATE TOOL: Success callback:', data);
      qc.invalidateQueries({ queryKey: ['tools'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] }); // Also refresh dashboard
      toast.success('Tool updated');
    },
    onError: (err) => {
      console.error('UPDATE TOOL: Error callback:', err);
      console.error('UPDATE TOOL: Error response:', err.response);
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
