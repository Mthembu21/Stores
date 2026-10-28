import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useImsAudits(year) {
  return useQuery({
    queryKey: ['ims-audits', year],
    queryFn: async () => {
      const { data } = await http.get('/ims-audits', { params: { year } });
      return data;
    },
    staleTime: 10_000,
  });
}

export function useCreateImsAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await http.post('/ims-audits', payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ims-audits'] });
      toast.success('Audit added to the programme');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not add audit');
    },
  });
}

export function useUpdateImsAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await http.patch(`/ims-audits/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ims-audits'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update audit');
    },
  });
}

export function useDeleteImsAudit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/ims-audits/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ims-audits'] });
      toast.success('Audit removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove audit');
    },
  });
}
