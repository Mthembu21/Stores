import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KPI_CATEGORIES, computeCategoryScore } from '../config/kpiDefinitions';
import { Gauge } from './Gauge';

// A curated palette rather than five competing primary colors: Epiroc yellow as the
// one bright accent, a dark neutral, a calm teal and a warm taupe alongside it, and
// red reserved for Safety only, where it actually carries meaning.
const CATEGORY_COLORS = {
  receiving: '#FFCD00',
  dispatching: '#3B4252',
  picking: '#5B8C85',
  housekeeping: '#A8A29E',
  safety: '#DC2626',
};

function shortDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function barLabelFormatter(value) {
  return value === null || value === undefined ? '' : `${value}%`;
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
            Each bar is the category's confirmed/ratio measures for that day, averaged into a percentage.
          </div>
        </div>
        <div className="flex gap-3 flex-wrap">
          {KPI_CATEGORIES.map((cat) => (
            <Gauge key={cat.key} value={latest[cat.key] ?? null} size={60} strokeWidth={6} label={cat.label} />
          ))}
        </div>
      </div>

      <div className="h-[30rem]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
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
            <ReferenceLine
              y={100}
              stroke="#54565B"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{ value: 'Target — 100%', position: 'insideTopRight', fontSize: 11, fill: '#54565B', fontWeight: 600 }}
            />
            {KPI_CATEGORIES.map((cat) => (
              <Bar key={cat.key} dataKey={cat.key} name={cat.label} fill={CATEGORY_COLORS[cat.key]} radius={[4, 4, 0, 0]} maxBarSize={28}>
                <LabelList dataKey={cat.key} position="top" formatter={barLabelFormatter} style={{ fontSize: 9, fill: '#334155' }} />
              </Bar>
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
