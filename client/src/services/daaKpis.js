import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { http } from './http';

// The warehouse's own calendar day — sent to the server so "today" never shifts with
// the server's time zone.
export function todayIso() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function useDaaKpiDefinitions({ includeInactive = false } = {}) {
  return useQuery({
    queryKey: ['daa-kpi-definitions', includeInactive],
    queryFn: async () => {
      const { data } = await http.get('/daa-kpis/definitions', { params: includeInactive ? { includeInactive: 'true' } : undefined });
      return data;
    },
    staleTime: 30_000,
  });
}

export function useUpdateDaaKpiDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }) => {
      const { data } = await http.patch(`/daa-kpis/definitions/${id}`, patch);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daa-kpi-definitions'], exact: false });
      qc.invalidateQueries({ queryKey: ['daa-kpi-summary'], exact: false });
      toast.success('KPI updated');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not update KPI');
    },
  });
}

export function useDaaKpiEntries(day) {
  return useQuery({
    queryKey: ['daa-kpi-entries', day],
    queryFn: async () => {
      const { data } = await http.get('/daa-kpis/entries', { params: { day } });
      return data;
    },
    enabled: Boolean(day),
    staleTime: 5_000,
  });
}

export function useSaveDaaKpiEntries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ day, entries }) => {
      const { data } = await http.post('/daa-kpis/entries', { day, today: todayIso(), entries });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daa-kpi-entries'], exact: false });
      qc.invalidateQueries({ queryKey: ['daa-kpi-summary'], exact: false });
      toast.success('KPIs saved');
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Could not save KPIs');
    },
  });
}

export function useDaaKpiSummary(period) {
  return useQuery({
    queryKey: ['daa-kpi-summary', period],
    queryFn: async () => {
      const { data } = await http.get('/daa-kpis/summary', { params: { period, today: todayIso() } });
      return data;
    },
    staleTime: 10_000,
  });
}

export function formatKpiValue(def, value) {
  if (value === null || value === undefined) return '—';
  const shown = Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 });
  if (def.captureType === 'count') return shown;
  if (def.unit === '%' || def.captureType !== 'value') return `${shown}%`;
  if (def.unit === 'R' || def.unit === '$') return `${def.unit} ${shown}`; // currency goes in front
  return def.unit ? `${shown} ${def.unit}` : shown;
}

// e.g. "≥ 90%", "≤ 40", "≥ 1 per month", "87% of locations per quarter"
export function describeTarget(def) {
  if (def.target === null || def.target === undefined) return 'No target set';
  const sign = def.targetDirection === 'max' ? '≤' : '≥';
  if (def.captureType === 'count') return `${sign} ${def.target} per month`;
  if (def.captureType === 'progress') return `${def.target}% of locations per quarter`;
  return `${sign} ${formatKpiValue(def, def.target)}`;
}
