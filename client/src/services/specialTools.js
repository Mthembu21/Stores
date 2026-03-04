import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

export function useSpecialTools() {
  return useQuery({
    queryKey: ['special-tools'],
    queryFn: async () => {
      const { data } = await http.get('/special-tools');
      return data;
    },
    staleTime: 10_000,
  });
}

export function useSpecialToolAssignments(status) {
  return useQuery({
    queryKey: ['special-tools', 'assignments', status || 'all'],
    queryFn: async () => {
      const { data } = await http.get('/special-tools/assignments', {
        params: status ? { status } : undefined,
      });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useSpecialToolDispatches(status) {
  return useQuery({
    queryKey: ['special-tools', 'dispatches', status || 'all'],
    queryFn: async () => {
      const { data } = await http.get('/special-tools/dispatches', {
        params: status ? { status } : undefined,
      });
      return data;
    },
    staleTime: 5_000,
  });
}

export function useAssignSpecialTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ toolId, technicianId, startAt, durationDays }) => {
      const { data } = await http.post(`/special-tools/${toolId}/assign`, {
        technicianId,
        startAt,
        durationDays,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['special-tools'], exact: false });
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Special tool assigned');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not assign tool');
    },
  });
}

export function useDispatchSpecialTool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ toolId, type, sentAt, expectedReturnAt, reference }) => {
      const { data } = await http.post(`/special-tools/${toolId}/dispatch`, {
        type,
        sentAt,
        expectedReturnAt,
        reference,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['special-tools'], exact: false });
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Tool dispatched');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not dispatch tool');
    },
  });
}

export function useReturnDispatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ dispatchId, returnedAt, reference }) => {
      const { data } = await http.post(`/special-tools/dispatch/${dispatchId}/return`, {
        returnedAt,
        reference,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['special-tools'], exact: false });
      qc.invalidateQueries({ queryKey: ['tools'] });
      toast.success('Dispatch returned');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not return dispatch');
    },
  });
}
