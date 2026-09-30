import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useLegalAppointments(filters) {
  return useQuery({
    queryKey: ['legal-appointments', filters || {}],
    queryFn: async () => {
      const { data } = await http.get('/legal-appointments', { params: filters || undefined });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreateLegalAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post('/legal-appointments', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-appointments'] });
      toast.success('Appointment added');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not add appointment');
    },
  });
}

export function useUpdateLegalAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await http.patch(`/legal-appointments/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-appointments'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update appointment');
    },
  });
}

export function useDeleteLegalAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/legal-appointments/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-appointments'] });
      toast.success('Appointment removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove appointment');
    },
  });
}
