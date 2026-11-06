import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDaaKpiDefinitions, useUpdateDaaKpiDefinition } from '../services/daaKpis';

const CAPTURE_LABELS = {
  ratio: 'Daily · X of Y lines',
  checklist: 'Daily · checklist',
  count: 'Daily · count (target per month)',
  progress: 'Daily · locations counted (target per quarter)',
  value: 'Monthly · one figure',
};

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';

function TargetRow({ def }) {
  const update = useUpdateDaaKpiDefinition();
  const [form, setForm] = useState(null);

  useEffect(() => {
    setForm({
      label: def.label,
      responsible: def.responsible || '',
      target: def.target ?? '',
      targetDirection: def.targetDirection,
      unit: def.unit || '',
      progressBase: def.progressBase ?? '',
      active: def.active,
    });
  }, [def]);

  if (!form) return null;
  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  function handleSave(e) {
    e.preventDefault();
    const patch = {
      label: form.label,
      responsible: form.responsible,
      target: form.target === '' ? null : form.target,
      targetDirection: form.targetDirection,
      unit: form.unit,
      active: form.active,
    };
    if (def.captureType === 'progress') patch.progressBase = form.progressBase === '' ? null : form.progressBase;
    update.mutate({ id: def._id, ...patch });
  }

  return (
    <form onSubmit={handleSave} className={`rounded-xl bg-white shadow-soft p-4 space-y-3 ${form.active ? '' : 'opacity-60'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="text-xs font-semibold uppercase text-slate-500">{CAPTURE_LABELS[def.captureType]}</div>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} />
          In use
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-700">KPI</label>
          <input className={inputClass} value={form.label} onChange={(e) => set({ label: e.target.value })} required />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-medium text-slate-700">Responsible</label>
          <input className={inputClass} value={form.responsible} onChange={(e) => set({ responsible: e.target.value })} />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">Target must be</label>
          <select className={inputClass} value={form.targetDirection} onChange={(e) => set({ targetDirection: e.target.value })}>
            <option value="min">At least (≥)</option>
            <option value="max">At most (≤)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-slate-700">
            Target{def.captureType === 'value' ? '' : def.captureType === 'count' ? ' (per month)' : ' (%)'}
          </label>
          <input type="number" step="any" className={inputClass} value={form.target} onChange={(e) => set({ target: e.target.value })} placeholder="None" />
        </div>
        {def.captureType === 'value' && (
          <div>
            <label className="text-xs font-medium text-slate-700">Unit</label>
            <input className={inputClass} value={form.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="e.g. %, R" />
          </div>
        )}
        {def.captureType === 'progress' && (
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-slate-700">Total bin locations in the warehouse</label>
            <input type="number" min="1" step="1" className={inputClass} value={form.progressBase} onChange={(e) => set({ progressBase: e.target.value })} placeholder="Required to show progress" />
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-slate-400">
          {def.lastChangedByName ? `Last changed by ${def.lastChangedByName} · ${new Date(def.lastChangedAt).toLocaleString()}` : ''}
        </div>
        <button
          type="submit"
          className="rounded-xl bg-epiroc-yellow px-4 py-1.5 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
          disabled={update.isPending}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}

export default function DaaTargetsPage() {
  const { data, isLoading } = useDaaKpiDefinitions({ includeInactive: true });
  const definitions = data?.definitions || [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-2xl font-semibold text-epiroc-gray">DAA Warehouse — KPI Targets</div>
          <div className="text-sm text-slate-600">
            Changing a target re-scores every period on the dashboard, past ones included, and records who changed it.
            Untick "In use" to retire a KPI without losing its history.
          </div>
        </div>
        <Link to="/daa/dashboard" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          KPI Dashboard
        </Link>
      </div>
      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-6 text-sm text-slate-600">Loading…</div>
      ) : (
        definitions.map((def) => <TargetRow key={def._id} def={def} />)
      )}
    </div>
  );
}
