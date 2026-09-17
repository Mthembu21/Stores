import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useMachines() {
  return useQuery({
    queryKey: ['machines'],
    queryFn: async () => {
      const { data } = await http.get('/machines');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ machineNumber, machineType }) => {
      const { data } = await http.post('/machines', { machineNumber, machineType });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine added');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not add machine');
    },
  });
}

export function useUpdateMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await http.patch(`/machines/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['machines'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update machine');
    },
  });
}

export function useDeleteMachine() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/machines/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['machines'] });
      toast.success('Machine removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove machine');
    },
  });
}
