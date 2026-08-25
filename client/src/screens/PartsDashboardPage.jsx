import { Card } from '../components/Card';
import { Table } from '../components/Table';
import { LowStockChart } from '../components/PartsCharts';
import { usePartsDashboard } from '../services/partsDashboard';
import { formatDateTime } from '../utils/format';

export default function PartsDashboardPage() {
  const { data, isLoading, isError } = usePartsDashboard();
  const { cards, tables } = data || {};

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
        <div className="mt-1 text-sm text-slate-600">Check that the API is running and you are logged in.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Spare Parts & Stores</div>
        <div className="text-sm text-slate-600">Overview of parts inventory, issues and stock health.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Total Parts" value={cards.totalParts} />
        <Card title="Active Parts" value={cards.activeParts} />
        <Card title="Low Stock Parts" value={cards.lowStockParts} tone="warning" />
        <Card title="Out of Stock Parts" value={cards.outOfStockParts} tone="danger" />
        <Card title="Parts Issued Today" value={cards.partsIssuedToday} />
        <Card title="Parts Issued This Month" value={cards.partsIssuedThisMonth} />
        <Card title="Parts Awaiting Order" value={cards.partsAwaitingOrder} tone="warning" />
        <Card title="Parts Returned" value={cards.partsReturned} />
      </div>

      <LowStockChart data={tables?.lowStockParts || []} />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Low Stock Parts</div>
          <Table
            emptyLabel="No low stock parts"
            getRowClassName={(p) => (p.stockOnHand <= 0 ? 'bg-red-50' : 'bg-epiroc-yellow/15')}
            columns={[
              { key: 'partNumber', header: 'Part Number' },
              { key: 'partDescription', header: 'Description' },
              { key: 'stockOnHand', header: 'Stock On Hand' },
              { key: 'minimumStockLevel', header: 'Minimum Level' },
              { key: 'storageLocation', header: 'Location' },
              {
                key: 'status',
                header: 'Status',
                render: (p) => (p.stockOnHand <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'),
              },
            ]}
            rows={tables?.lowStockParts || []}
          />
        </div>

        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Recent Issues</div>
          <Table
            emptyLabel="No issues yet"
            columns={[
              { key: 'issueNumber', header: 'Issue #' },
              { key: 'partNumber', header: 'Part Number' },
              { key: 'partDescription', header: 'Description' },
              { key: 'quantityIssued', header: 'Qty' },
              { key: 'machineNumber', header: 'Machine #' },
              { key: 'serviceOrderNumber', header: 'Service Order' },
              { key: 'workOrderNumber', header: 'Work Order' },
              { key: 'requestorName', header: 'Requestor', render: (i) => `${i.requestorName} ${i.requestorSurname}` },
              { key: 'issueDate', header: 'Date', render: (i) => formatDateTime(i.issueDate) },
              { key: 'status', header: 'Status' },
            ]}
            rows={tables?.recentIssues || []}
          />
        </div>
      </div>
    </div>
  );
}
