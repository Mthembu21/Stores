import { useMemo } from 'react';
import { Table } from '../components/Table';
import { useConsumablesTracking, useRestockSparePart } from '../services/spareParts';
import { formatDateTime } from '../utils/format';

function stockBadge(part) {
  if (part.stockOnHand <= 0) return { label: 'OUT OF STOCK', className: 'text-red-600 font-semibold' };
  if (part.stockOnHand <= part.minimumStockLevel) return { label: 'LOW STOCK', className: 'text-epiroc-yellow font-semibold' };
  return { label: 'OK', className: 'text-green-600 font-semibold' };
}

export default function ConsumablesPage() {
  const { data, isLoading, isError } = useConsumablesTracking();
  const consumables = data?.consumables || [];
  const restock = useRestockSparePart();

  function handleRestock(part) {
    const raw = window.prompt(`Quantity received for ${part.partNumber} (${part.partDescription}):`);
    if (raw === null) return;
    const quantity = Number(raw);
    if (!(quantity > 0)) {
      window.alert('Enter a quantity greater than 0');
      return;
    }
    const reason = window.prompt('Reason / PO reference (optional):', '') || undefined;
    restock.mutate({ id: part._id, quantity, reason });
  }

  const columns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      {
        key: 'stockOnHand',
        header: 'Remaining',
        render: (p) => (
          <div className="flex items-center gap-2">
            <span>{p.stockOnHand}</span>
            <span className={stockBadge(p).className}>{stockBadge(p).label}</span>
          </div>
        ),
      },
      { key: 'minimumStockLevel', header: 'Min Level' },
      { key: 'unitOfMeasure', header: 'UoM' },
      {
        key: 'lastRestockedAt',
        header: 'Last Restocked',
        render: (p) => (p.lastRestockedAt ? formatDateTime(p.lastRestockedAt) : 'Never'),
      },
      { key: 'lastRestockedQuantity', header: 'Qty Received' },
      {
        key: 'daysSinceRestock',
        header: 'Days Since Restock',
        render: (p) => (p.daysSinceRestock === null ? '—' : p.daysSinceRestock),
      },
      { key: 'issuedSinceRestock', header: 'Issued Since Restock' },
      { key: 'storageLocation', header: 'Location' },
      {
        key: 'actions',
        header: '',
        render: (p) => (
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
            onClick={() => handleRestock(p)}
            disabled={restock.isPending}
          >
            Restock
          </button>
        ),
      },
    ],
    [restock]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Consumables</div>
        <div className="text-sm text-slate-600">
          Track consumption of items that are issued but never returned (oils, filters, PPE, etc.). Mark a part as
          "Consumable" on the Parts Inventory page to see it here.
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading consumables...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load consumables</div>
      ) : (
        <Table
          emptyLabel="No consumable parts yet. Mark parts as Consumable in Parts Inventory to track them here."
          columns={columns}
          rows={consumables}
          maxHeight="600px"
        />
      )}
    </div>
  );
}
