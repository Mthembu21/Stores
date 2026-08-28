import { useEffect, useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { KpiOverviewChart } from '../components/KpiCharts';
import { useKpiEntries, useSaveKpiEntry } from '../services/kpiEntries';
import { KPI_DEFINITIONS, formatTarget, meetsTarget } from '../config/kpiDefinitions';

function todayIso() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function dateOnly(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function statusClass(ok) {
  if (ok === null) return 'text-slate-400';
  return ok ? 'text-green-700 font-semibold' : 'text-red-600 font-semibold';
}

export default function KpiTrackerPage() {
  const { data, isLoading, isError } = useKpiEntries(60);
  const entries = data?.entries || [];
  const saveEntry = useSaveKpiEntry();

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [values, setValues] = useState({});
  const [comments, setComments] = useState({});

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i)), []);

  const existingEntry = useMemo(
    () => entries.find((e) => dateOnly(e.date) === selectedDate),
    [entries, selectedDate]
  );

  useEffect(() => {
    if (existingEntry) {
      setValues({ ...existingEntry.values });
      setComments({ ...existingEntry.comments });
    } else {
      setValues({});
      setComments({});
    }
  }, [selectedDate, existingEntry]);

  function updateValue(key, val) {
    setValues((prev) => ({ ...prev, [key]: val }));
  }

  function updateComment(key, val) {
    setComments((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave(e) {
    e.preventDefault();
    saveEntry.mutate({ date: selectedDate, values, comments });
  }

  const historyColumns = useMemo(
    () => [
      { key: 'date', header: 'Date', render: (row) => new Date(row.date).toLocaleDateString() },
      ...KPI_DEFINITIONS.map((def) => ({
        key: def.key,
        header: def.label,
        render: (row) => {
          const val = row.values?.[def.key];
          const comment = row.comments?.[def.key];
          const ok = meetsTarget(def, val);
          return (
            <span className={statusClass(ok)} title={comment || undefined}>
              {val === null || val === undefined ? '—' : val}
              {comment ? ' *' : ''}
            </span>
          );
        },
      })),
      { key: 'recordedBy', header: 'Recorded by', render: (row) => row.recordedBy?.fullName || '' },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Daily KPI Tracker</div>
        <div className="text-sm text-slate-600">Capture today's warehouse operations KPIs and review recent history.</div>
      </div>

      <form className="rounded-xl bg-white shadow-soft p-6 space-y-4" onSubmit={handleSave}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm font-semibold text-epiroc-blue">
            {existingEntry ? 'Edit KPIs for' : 'Capture KPIs for'}
          </div>
          <input
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={selectedDate}
            max={todayIso()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="space-y-4">
          {KPI_DEFINITIONS.map((def) => {
            const val = values[def.key];
            const ok = meetsTarget(def, val);
            return (
              <div key={def.key} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_140px] gap-3 items-center">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{def.label}</div>
                    <div className="text-xs text-slate-500">{def.description}</div>
                  </div>
                  <div className="text-xs text-slate-500">Target: {formatTarget(def)}</div>
                  <input
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    type="number"
                    step="any"
                    value={val ?? ''}
                    onChange={(e) => updateValue(def.key, e.target.value)}
                    placeholder={def.unit}
                  />
                  <div className={`text-sm text-center ${statusClass(ok)}`}>
                    {ok === null ? 'No entry' : ok ? 'On target' : 'Below target'}
                  </div>
                </div>
                <input
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs"
                  value={comments[def.key] || ''}
                  onChange={(e) => updateComment(def.key, e.target.value)}
                  placeholder="Add a comment (optional)"
                />
              </div>
            );
          })}
        </div>

        <div className="flex justify-center pt-2">
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            disabled={saveEntry.isPending}
          >
            {saveEntry.isPending ? 'Saving...' : 'Save KPIs'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Weekly progress (target vs actual)</div>
        {isLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading KPI history...</div>
        ) : isError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load KPI history</div>
        ) : (
          <KpiOverviewChart entries={entries} days={last7Days} />
        )}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Recent history</div>
        <div className="text-xs text-slate-500">Values marked with * have a comment attached — hover to read it.</div>
        {isLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading KPI history...</div>
        ) : isError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load KPI history</div>
        ) : (
          <Table emptyLabel="No KPI entries recorded yet" columns={historyColumns} rows={entries} maxHeight="500px" />
        )}
      </div>
    </div>
  );
}
