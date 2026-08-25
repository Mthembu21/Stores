import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useStockMovements } from '../services/stockMovements';
import { formatDateTime } from '../utils/format';

const MOVEMENT_TYPES = ['Issue', 'Return', 'Receipt', 'Adjustment'];

export default function StockMovementsPage() {
  const [movementType, setMovementType] = useState('');
  const { data, isLoading, isError } = useStockMovements({ movementType: movementType || undefined });
  const movements = data?.movements || [];

  const columns = useMemo(
    () => [
      { key: 'movementId', header: 'Movement ID' },
      { key: 'partNumber', header: 'Part Number' },
      { key: 'movementType', header: 'Type' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'previousStock', header: 'Previous Stock' },
      { key: 'newStock', header: 'New Stock' },
      { key: 'storeIssue', header: 'Issue #', render: (m) => m.storeIssue?.issueNumber || '' },
      { key: 'serviceOrderNumber', header: 'Service Order' },
      { key: 'workOrderNumber', header: 'Work Order' },
      { key: 'user', header: 'User', render: (m) => m.user?.fullName || '' },
      { key: 'createdAt', header: 'Date/Time', render: (m) => formatDateTime(m.createdAt) },
      { key: 'reason', header: 'Reason' },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Stock Movements</div>
        <div className="text-sm text-slate-600">Full audit trail of every stock change.</div>
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 max-w-xs">
        <label className="text-xs font-semibold text-slate-600">Movement type</label>
        <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={movementType} onChange={(e) => setMovementType(e.target.value)}>
          <option value="">All</option>
          {MOVEMENT_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load stock movements</div>
      ) : (
        <Table emptyLabel="No stock movements yet" columns={columns} rows={movements} maxHeight="600px" />
      )}
    </div>
  );
}
