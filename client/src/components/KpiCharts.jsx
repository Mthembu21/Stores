import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KPI_DEFINITIONS } from '../config/kpiDefinitions';

const LINE_COLORS = ['#003A70', '#FFCD00', '#16a34a', '#dc2626', '#7c3aed', '#0891b2', '#ea580c', '#db2777'];

function shortDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

function achievementPercent(def, actual) {
  if (actual === null || actual === undefined || actual === '') return null;
  const num = Number(actual);
  if (Number.isNaN(num)) return null;
  const pct = def.direction === 'lower' ? (num <= 0 ? 200 : (def.target / num) * 100) : (num / def.target) * 100;
  return Math.max(0, Math.min(200, Math.round(pct)));
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg bg-white shadow-soft border border-slate-200 p-3 text-xs space-y-1">
      <div className="font-semibold text-slate-900">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value === null || p.value === undefined ? 'No entry' : `${p.value}% of target`}
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
    KPI_DEFINITIONS.forEach((def) => {
      row[def.key] = achievementPercent(def, entry?.values?.[def.key]);
    });
    return row;
  });

  return (
    <div className="rounded-xl bg-white shadow-soft p-4">
      <div className="text-sm font-semibold text-epiroc-blue">Weekly KPI performance (% of target)</div>
      <div className="text-xs text-slate-500 mb-2">
        Each line is a KPI's actual value as a percentage of its target for that day. The dashed line at 100% is target achieved.
      </div>
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 'dataMax']} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <ReferenceLine y={100} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'Target', fontSize: 10, fill: '#64748b' }} />
            {KPI_DEFINITIONS.map((def, i) => (
              <Line
                key={def.key}
                type="monotone"
                dataKey={def.key}
                name={def.label}
                stroke={LINE_COLORS[i % LINE_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
