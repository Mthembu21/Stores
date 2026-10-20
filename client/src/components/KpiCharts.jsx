import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KPI_CATEGORIES, computeCategoryScore } from '../config/kpiDefinitions';
import { Gauge } from './Gauge';

// A calmer, more cohesive palette than default chart colors — one accent per category.
const CATEGORY_COLORS = {
  receiving: '#2563eb',
  dispatching: '#FFCD00',
  picking: '#16a34a',
  housekeeping: '#7c3aed',
  safety: '#dc2626',
};

function shortDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-xl bg-white shadow-soft border border-slate-200 p-3 text-xs space-y-1.5 min-w-[160px]">
      <div className="font-semibold text-slate-900 pb-1 border-b border-slate-100">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold" style={{ color: p.color }}>
            {p.value === null || p.value === undefined ? '—' : `${p.value}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function KpiOverviewChart({ entries, days }) {
  const entryByDate = new Map((entries || []).map((e) => [new Date(e.date).toISOString().slice(0, 10), e]));

  const data = (days || []).map((iso) => {
    const entry = entryByDate.get(iso);
    const row = { label: shortDayLabel(iso) };
    KPI_CATEGORIES.forEach((cat) => {
      row[cat.key] = entry ? computeCategoryScore(cat, entry.measures) : null;
    });
    return row;
  });

  const latest = data[data.length - 1] || {};

  return (
    <div className="rounded-xl bg-white shadow-soft p-5 space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-sm font-semibold text-epiroc-gray">Weekly KPI performance by category</div>
          <div className="text-xs text-slate-500 mt-0.5">
            Trend of each category's confirmed/ratio measures, averaged into a daily percentage.
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {KPI_CATEGORIES.map((cat) => (
            <Gauge key={cat.key} value={latest[cat.key] ?? null} size={60} strokeWidth={6} label={cat.label} />
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 10, right: 16, left: -16, bottom: 0 }}>
            <defs>
              {KPI_CATEGORIES.map((cat) => (
                <linearGradient key={cat.key} id={`kpi-fill-${cat.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CATEGORY_COLORS[cat.key]} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={CATEGORY_COLORS[cat.key]} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              unit="%"
              domain={[0, 100]}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" />
            <ReferenceLine y={100} stroke="#cbd5e1" strokeDasharray="4 4" />
            {KPI_CATEGORIES.map((cat) => (
              <Area
                key={`area-${cat.key}`}
                type="monotone"
                dataKey={cat.key}
                stroke="none"
                fill={`url(#kpi-fill-${cat.key})`}
                connectNulls
                legendType="none"
              />
            ))}
            {KPI_CATEGORIES.map((cat) => (
              <Line
                key={cat.key}
                type="monotone"
                dataKey={cat.key}
                name={cat.label}
                stroke={CATEGORY_COLORS[cat.key]}
                strokeWidth={2.5}
                dot={{ r: 3, strokeWidth: 0, fill: CATEGORY_COLORS[cat.key] }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
