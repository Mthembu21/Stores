import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useDaaKpiSummary, describeTarget, formatKpiValue } from '../services/daaKpis';

const PERIODS = [
  { key: 'week', label: 'Weekly', noun: 'week' },
  { key: 'month', label: 'Monthly', noun: 'month' },
  { key: 'quarter', label: 'Quarterly', noun: 'quarter' },
];

const INK = '#54565B'; // Epiroc gray — the actual line
const TARGET_INK = '#94a3b8'; // recessive dashed target line

function shortDate(day) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
}

function StatusPill({ status, hasTarget, hasActual }) {
  const base = 'shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold';
  if (status === true) return <span className={`${base} bg-green-50 text-green-700`}>✓ On target</span>;
  if (status === false) return <span className={`${base} bg-red-50 text-red-700`}>✗ Below target</span>;
  if (hasActual && !hasTarget) return null; // e.g. weekly incident count: monthly target only
  return <span className={`${base} bg-slate-100 text-slate-500`}>{hasTarget ? 'No data yet' : 'No target'}</span>;
}

// Change since the previous period, coloured by whether it moved the right way.
function Delta({ def, current, previous }) {
  if (current === null || previous === null || previous === undefined) return null;
  const diff = Math.round((current - previous) * 10) / 10;
  if (diff === 0) return <span className="text-xs text-slate-500">no change</span>;
  const better = def.targetDirection === 'max' ? diff < 0 : diff > 0;
  const unit = def.captureType === 'count' || (def.captureType === 'value' && def.unit !== '%') ? '' : ' pts';
  return (
    <span className={`text-xs font-semibold ${better ? 'text-green-700' : 'text-red-700'}`}>
      {diff > 0 ? '▲' : '▼'} {Math.abs(diff).toLocaleString()}
      {unit} vs last
    </span>
  );
}

function ChartTooltip({ active, payload, label, def }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg bg-white shadow-soft border border-slate-200 px-3 py-2 text-xs space-y-0.5">
      <div className="font-semibold text-slate-900">{label}</div>
      <div className="text-slate-700">Actual: <span className="font-semibold">{formatKpiValue(def, row.actual)}</span></div>
      {row.target !== null && <div className="text-slate-500">Target: {formatKpiValue(def, row.target)}</div>}
    </div>
  );
}

function TrendChart({ def, data }) {
  const hasAny = data.some((d) => d.actual !== null);
  if (!hasAny) {
    return <div className="h-28 grid place-items-center text-xs text-slate-400">No figures captured in this range</div>;
  }
  return (
    <div className="h-28">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis hide domain={['auto', 'auto']} />
          <Tooltip content={<ChartTooltip def={def} />} cursor={{ stroke: '#cbd5e1' }} />
          <Line type="linear" dataKey="target" stroke={TARGET_INK} strokeWidth={1.5} strokeDasharray="5 4" dot={false} isAnimationActive={false} connectNulls />
          <Line type="linear" dataKey="actual" stroke={INK} strokeWidth={2} dot={{ r: 4, fill: INK, stroke: '#fff', strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function KpiCard({ def, periods }) {
  const current = periods[periods.length - 1].kpis[def.key];
  const previous = periods.length > 1 ? periods[periods.length - 2].kpis[def.key] : null;
  const data = periods.map((p) => ({ label: p.label, actual: p.kpis[def.key].actual, target: p.kpis[def.key].target }));

  if (!current.applicable) {
    return (
      <div className="self-start rounded-xl border border-dashed border-slate-200 p-4 space-y-1">
        <div className="text-sm font-semibold text-slate-900">{def.label}</div>
        <div className="text-xs text-slate-500">Captured monthly — switch to Monthly or Quarterly to see it.</div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-soft p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900">{def.label}</div>
          <div className="text-xs text-slate-500">{def.responsible || '—'}</div>
        </div>
        <StatusPill status={current.status} hasTarget={current.target !== null} hasActual={current.actual !== null} />
      </div>
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div className="text-3xl font-semibold text-slate-900">{formatKpiValue(def, current.actual)}</div>
        <Delta def={def} current={current.actual} previous={previous?.actual ?? null} />
      </div>
      <div className="text-xs text-slate-500">
        Target {current.target !== null && def.captureType !== 'value' && def.captureType !== 'ratio' && def.captureType !== 'checklist'
          ? `${formatKpiValue(def, current.target)} for this period`
          : describeTarget(def)}
        {current.detail ? ` · ${current.detail}` : ''}
      </div>
      <TrendChart def={def} data={data} />
    </div>
  );
}

export default function DaaDashboardPage() {
  const [period, setPeriod] = useState('week');
  const { data, isLoading, isError } = useDaaKpiSummary(period);
  const periodInfo = PERIODS.find((p) => p.key === period);

  const definitions = useMemo(() => data?.definitions || [], [data]);
  const periods = useMemo(() => data?.periods || [], [data]);
  const current = periods[periods.length - 1];

  const scored = current ? definitions.filter((d) => current.kpis[d.key].applicable && current.kpis[d.key].status !== null) : [];
  const onTarget = scored.filter((d) => current.kpis[d.key].status === true).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-2xl font-semibold text-epiroc-gray">DAA Warehouse — KPI Dashboard</div>
          <div className="text-sm text-slate-600">Built from the daily captures. Ratios add up the actual lines, not daily percentages.</div>
        </div>
        <div className="flex gap-2">
          <Link to="/daa/targets" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            Targets
          </Link>
          <Link to="/daa/capture" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            &larr; Daily Capture
          </Link>
        </div>
      </div>

      <div className="inline-flex rounded-xl bg-slate-100 p-1">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${p.key === period ? 'bg-white text-epiroc-black shadow-soft' : 'text-slate-600 hover:text-slate-900'}`}
            onClick={() => setPeriod(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-6 text-sm text-slate-600">Loading KPIs…</div>
      ) : isError || !current ? (
        <div className="rounded-xl bg-white shadow-soft p-6 text-sm text-slate-600">Could not load KPI data</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white shadow-soft p-5">
              <div className="text-xs font-semibold uppercase text-slate-500">This {periodInfo.noun} · {current.label}</div>
              <div className="mt-1 text-4xl font-semibold text-slate-900">
                {onTarget} <span className="text-xl text-slate-500">of {scored.length} KPIs on target</span>
              </div>
            </div>
            <div className="rounded-xl bg-white shadow-soft p-5 space-y-2">
              <div className="text-xs font-semibold uppercase text-slate-500">Working days captured</div>
              <div className="text-4xl font-semibold text-slate-900">
                {current.capturedDays} <span className="text-xl text-slate-500">of {current.workingDays}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${current.capturedDays === current.workingDays ? 'bg-green-600' : 'bg-epiroc-yellow'}`}
                  style={{ width: `${current.workingDays ? (current.capturedDays / current.workingDays) * 100 : 0}%` }}
                />
              </div>
              {current.missedDays.length > 0 && (
                <div className="text-xs text-slate-600">
                  Not captured:{' '}
                  {current.missedDays.slice(-6).map(shortDate).join(', ')}
                  {current.missedDays.length > 6 ? ` and ${current.missedDays.length - 6} more` : ''}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {definitions.map((def) => (
              <KpiCard key={def.key} def={def} periods={periods} />
            ))}
          </div>

          <div className="rounded-xl bg-white shadow-soft p-5 space-y-3">
            <div className="text-sm font-semibold text-epiroc-gray">KPI status — {current.label}</div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2 pr-3">KPI</th>
                    <th className="py-2 pr-3">Responsible</th>
                    <th className="py-2 pr-3">Target</th>
                    <th className="py-2 pr-3">Actual</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Comments / Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {definitions.map((def) => {
                    const k = current.kpis[def.key];
                    const comment = data.latestComments?.[def.key];
                    return (
                      <tr key={def.key} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-3 font-medium text-slate-900">{def.label}</td>
                        <td className="py-2 pr-3 text-slate-600">{def.responsible || '—'}</td>
                        <td className="py-2 pr-3 text-slate-600 whitespace-nowrap">{describeTarget(def)}</td>
                        <td className="py-2 pr-3 font-semibold text-slate-900 whitespace-nowrap">{k.applicable ? formatKpiValue(def, k.actual) : 'Monthly'}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{k.applicable && <StatusPill status={k.status} hasTarget={k.target !== null} hasActual={k.actual !== null} />}</td>
                        <td className="py-2 text-slate-600">
                          {comment ? (
                            <>
                              {comment.comment}
                              <span className="text-xs text-slate-400"> — {comment.by}, {shortDate(comment.day)}</span>
                            </>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
