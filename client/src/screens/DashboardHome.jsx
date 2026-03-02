import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { MonthlyBorrowTrendsChart, PpePerTechnicianChart } from '../components/Charts';
import { useDashboard } from '../services/dashboard';
import { formatDateTime } from '../utils/format';

export default function DashboardHome() {
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-epiroc-blue font-semibold">Loading dashboard…</div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Could not load dashboard</div>
        <div className="mt-1 text-sm text-slate-600">
          Check that the API is running and you are logged in.
        </div>
      </div>
    );
  }

  const { cards, tables, charts, meta } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="text-2xl font-semibold text-epiroc-blue">Dashboard</div>
          <div className="text-sm text-slate-600">Month: {meta?.month}/{meta?.year}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Total Users" value={cards.totalUsers} />
        <Card title="Total Tools" value={cards.totalTools} />
        <Card title="Borrowed Tools" value={cards.borrowedTools} />
        <Card title="Overdue Tools (24+ hrs)" value={cards.overdueTools} tone="warning" />
        <Card title="Damaged Tools" value={cards.damagedTools} tone="danger" />
        <Card title="Missing Tools" value={cards.missingTools} tone="danger" />
        <Card title="PPE Taken This Month" value={cards.ppeTakenThisMonth} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <PpePerTechnicianChart data={charts?.ppeUsagePerTechnician || []} />
        <MonthlyBorrowTrendsChart data={charts?.monthlyBorrowingTrends || []} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Overdue Tools</div>
          <Table
            emptyLabel="No overdue tools"
            getRowClassName={() => 'bg-epiroc-yellow/15'}
            columns={[
              { key: 'tool', header: 'Tool', render: (r) => r.tool?.toolName || '' },
              { key: 'borrower', header: 'Borrower', render: (r) => r.borrower?.fullName || '' },
              { key: 'borrowedAt', header: 'Borrowed', render: (r) => formatDateTime(r.borrowedAt) },
              { key: 'expectedReturnAt', header: 'Expected', render: (r) => formatDateTime(r.expectedReturnAt) },
            ]}
            rows={tables?.overdueTools || []}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Recent Borrowings</div>
          <Table
            emptyLabel="No borrowings yet"
            columns={[
              { key: 'tool', header: 'Tool', render: (r) => r.tool?.toolName || '' },
              { key: 'borrower', header: 'Borrower', render: (r) => r.borrower?.fullName || '' },
              { key: 'borrowedAt', header: 'Borrowed', render: (r) => formatDateTime(r.borrowedAt) },
              {
                key: 'status',
                header: 'Status',
                render: (r) => (r.returnedAt ? 'Returned' : 'Open'),
              },
            ]}
            rows={tables?.recentBorrowings || []}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Damaged Tools</div>
          <Table
            emptyLabel="No damaged tools"
            columns={[
              { key: 'toolName', header: 'Tool Name' },
              { key: 'toolCode', header: 'Tool Code' },
              { key: 'category', header: 'Category' },
              { key: 'status', header: 'Status' },
            ]}
            rows={tables?.damagedTools || []}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Missing Tools</div>
          <Table
            emptyLabel="No missing tools"
            columns={[
              { key: 'toolName', header: 'Tool Name' },
              { key: 'toolCode', header: 'Tool Code' },
              { key: 'category', header: 'Category' },
              { key: 'status', header: 'Status' },
            ]}
            rows={tables?.missingTools || []}
          />
        </div>
      </div>
    </div>
  );
}
