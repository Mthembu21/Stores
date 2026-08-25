import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function LowStockChart({ data }) {
  const formatted = (data || []).map((p) => ({
    partNumber: p.partNumber,
    stockOnHand: p.stockOnHand,
    minimumStockLevel: p.minimumStockLevel,
  }));

  return (
    <div className="rounded-xl bg-white shadow-soft p-4">
      <div className="text-sm font-semibold text-epiroc-blue">Low Stock Parts</div>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="partNumber" tick={{ fontSize: 12 }} interval={0} angle={-12} height={60} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="stockOnHand" name="Stock On Hand" fill="#FFCD00" radius={[10, 10, 0, 0]} />
            <Bar dataKey="minimumStockLevel" name="Minimum Level" fill="#003A70" radius={[10, 10, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
