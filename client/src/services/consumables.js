import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useConsumableItems() {
  return useQuery({
    queryKey: ['consumables', 'items'],
    queryFn: async () => {
      const { data } = await http.get('/consumables/items');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreateConsumableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, unitOfMeasure, stockOnHand }) => {
      const { data } = await http.post('/consumables/items', { name, unitOfMeasure, stockOnHand });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumables', 'items'] });
      toast.success('Consumable added');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not add consumable');
    },
  });
}

export function useRestockConsumableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, quantity }) => {
      const { data } = await http.post(`/consumables/items/${id}/restock`, { quantity });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumables', 'items'] });
      toast.success('Consumable restocked');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not restock consumable');
    },
  });
}

export function useDeleteConsumableItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/consumables/items/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumables', 'items'] });
      toast.success('Consumable removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove consumable');
    },
  });
}

export function useConsumables() {
  return useQuery({
    queryKey: ['consumables', 'records'],
    queryFn: async () => {
      const { data } = await http.get('/consumables');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useIssueConsumable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ technicianId, consumableId, quantity }) => {
      const { data } = await http.post('/consumables', { technicianId, consumableId, quantity });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consumables'], exact: false });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Consumable booked out');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not book out consumable');
    },
  });
}
