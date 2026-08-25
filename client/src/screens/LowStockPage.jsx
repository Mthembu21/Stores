import { useMemo } from 'react';
import { Table } from '../components/Table';
import { useSpareParts } from '../services/spareParts';

export default function LowStockPage() {
  const { data, isLoading, isError } = useSpareParts();
  const parts = data?.parts || [];

  const lowStockParts = useMemo(
    () => parts.filter((p) => p.stockOnHand <= p.minimumStockLevel).sort((a, b) => a.stockOnHand - b.stockOnHand),
    [parts]
  );

  const columns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'stockOnHand', header: 'Stock On Hand' },
      { key: 'minimumStockLevel', header: 'Minimum Stock Level' },
      { key: 'storageLocation', header: 'Storage Location' },
      {
        key: 'status',
        header: 'Status',
        render: (p) => (p.stockOnHand <= 0 ? 'OUT OF STOCK' : 'LOW STOCK'),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Low Stock</div>
        <div className="text-sm text-slate-600">Parts at or below their minimum stock level.</div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load parts</div>
      ) : (
        <Table
          emptyLabel="No low stock parts"
          getRowClassName={(p) => (p.stockOnHand <= 0 ? 'bg-red-50' : 'bg-epiroc-yellow/15')}
          columns={columns}
          rows={lowStockParts}
          maxHeight="600px"
        />
      )}
    </div>
  );
}
