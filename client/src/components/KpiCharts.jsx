import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { KPI_DEFINITIONS, formatTarget, meetsTarget } from '../config/kpiDefinitions';

function shortDayLabel(iso) {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
}

export function KpiWeeklyCharts({ entries, days }) {
  const entryByDate = new Map((entries || []).map((e) => [new Date(e.date).toISOString().slice(0, 10), e]));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {KPI_DEFINITIONS.map((def) => {
        const data = (days || []).map((iso) => {
          const entry = entryByDate.get(iso);
          const raw = entry?.values?.[def.key];
          const actual = raw === null || raw === undefined ? null : Number(raw);
          return {
            label: shortDayLabel(iso),
            target: def.target,
            actual,
            ok: meetsTarget(def, actual),
          };
        });

        return (
          <div key={def.key} className="rounded-xl bg-white shadow-soft p-4">
            <div className="text-sm font-semibold text-epiroc-blue">{def.label}</div>
            <div className="text-xs text-slate-500 mb-2">Target: {formatTarget(def)}</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="target" name="Target" fill="#cbd5e1" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="actual" name="Actual" radius={[6, 6, 0, 0]}>
                    {data.map((d, i) => (
                      <Cell key={i} fill={d.actual === null ? '#e2e8f0' : d.ok ? '#16a34a' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
