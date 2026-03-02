import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMonthLabel } from '../utils/format';

export function PpePerTechnicianChart({ data }) {
  return (
    <div className="rounded-xl bg-white shadow-soft p-4">
      <div className="text-sm font-semibold text-epiroc-blue">PPE Usage per Technician</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="fullName" tick={{ fontSize: 12 }} interval={0} angle={-12} height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="PPE Taken" fill="#FFCD00" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function MonthlyBorrowTrendsChart({ data }) {
  const formatted = (data || []).map((d) => ({
    ...d,
    label: formatMonthLabel({ year: d.year, month: d.month }),
  }));

  return (
    <div className="rounded-xl bg-white shadow-soft p-4">
      <div className="text-sm font-semibold text-epiroc-blue">Monthly Borrowing Trends</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" name="Borrowings" stroke="#003A70" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
