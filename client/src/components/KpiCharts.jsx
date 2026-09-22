import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KPI_CATEGORIES, computeCategoryScore } from '../config/kpiDefinitions';

const BAR_COLORS = ['#54565B', '#FFCD00', '#16a34a', '#dc2626', '#7c3aed'];

function shortDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg bg-white shadow-soft border border-slate-200 p-3 text-xs space-y-1">
      <div className="font-semibold text-slate-900">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value === null || p.value === undefined ? 'No entry' : `${p.value}%`}
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

  return (
    <div className="rounded-xl bg-white shadow-soft p-4">
      <div className="text-sm font-semibold text-epiroc-gray">Weekly KPI performance by category</div>
      <div className="text-xs text-slate-500 mb-2">
        Each bar is the category's confirmed/ratio measures for that day, averaged into a percentage. The dashed
        line at 100% is fully on-target.
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 10, fill: '#64748b' }} />
            {KPI_CATEGORIES.map((cat, i) => (
              <Bar
                key={cat.key}
                dataKey={cat.key}
                name={cat.label}
                fill={BAR_COLORS[i % BAR_COLORS.length]}
                radius={[3, 3, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
