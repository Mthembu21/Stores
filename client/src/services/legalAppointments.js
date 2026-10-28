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
    // Apply the change to the cached list straight away so the checkbox, date and
    // status badge react immediately; roll back if the server rejects it.
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: ['legal-appointments'] });
      const previous = qc.getQueriesData({ queryKey: ['legal-appointments'] });
      const optimistic = { ...patch };
      if (patch.noExpiry) optimistic.dueDate = null;
      if (patch.dueDate) optimistic.noExpiry = false;
      qc.setQueriesData({ queryKey: ['legal-appointments'] }, (old) =>
        old?.appointments
          ? { ...old, appointments: old.appointments.map((a) => (a._id === id ? { ...a, ...optimistic } : a)) }
          : old
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success('Appointment updated');
    },
    onError: (err, _vars, context) => {
      context?.previous?.forEach(([key, data]) => qc.setQueryData(key, data));
      toast.error(err?.response?.data?.message || 'Could not update appointment');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['legal-appointments'] });
    },
  });
}

export function useUploadLegalAppointmentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }) => {
      const { data } = await http.put(`/legal-appointments/${id}/document`, file, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'X-File-Name': encodeURIComponent(file.name),
          'X-File-Type': file.type || 'application/octet-stream',
        },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-appointments'] });
      toast.success('Document uploaded');
    },
    onError: (err) => {
      const message = err?.response?.status === 413 ? 'File is too large (max 10 MB)' : err?.response?.data?.message;
      toast.error(message || 'Could not upload document');
    },
  });
}

export function useDeleteLegalAppointmentDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await http.delete(`/legal-appointments/${id}/document`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-appointments'] });
      toast.success('Document removed');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not remove document');
    },
  });
}

// The download endpoint needs the auth header, so the file is fetched as a blob
// and handed to the browser through an object URL rather than a plain link.
export async function openLegalAppointmentDocument(appointment, { download = false } = {}) {
  try {
    const { data } = await http.get(`/legal-appointments/${appointment._id}/document`, { responseType: 'blob' });
    const blob = new Blob([data], { type: appointment.document?.mimeType || data.type });
    const url = URL.createObjectURL(blob);
    if (download) {
      const link = document.createElement('a');
      link.href = url;
      link.download = appointment.document?.fileName || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
    } else {
      window.open(url, '_blank', 'noopener');
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch {
    toast.error('Could not open document');
  }
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
