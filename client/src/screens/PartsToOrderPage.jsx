import { useMemo } from 'react';
import { Table } from '../components/Table';
import { useStoreIssues } from '../services/storeIssues';
import { formatDateTime } from '../utils/format';
import { flattenIssueItems } from '../utils/storeIssues';

export default function PartsToOrderPage() {
  const { data, isLoading, isError } = useStoreIssues();
  const lines = useMemo(() => flattenIssueItems(data?.issues || []), [data]);

  const toOrder = useMemo(
    () => lines.filter((i) => i.quantityToOrder > 0 && i.issueStatus !== 'Closed' && i.status !== 'Returned'),
    [lines]
  );

  const columns = useMemo(
    () => [
      { key: 'issueNumber', header: 'Issue #' },
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'quantityToOrder', header: 'Qty To Order' },
      { key: 'serviceOrderNumber', header: 'Service Order' },
      { key: 'workOrderNumber', header: 'Work Order' },
      { key: 'requestorName', header: 'Requestor', render: (i) => `${i.requestorName} ${i.requestorSurname}` },
      { key: 'issueDate', header: 'Date', render: (i) => formatDateTime(i.issueDate) },
      { key: 'status', header: 'Status' },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Parts To Order</div>
        <div className="text-sm text-slate-600">Outstanding quantities that still need to be ordered from a supplier.</div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load store issues</div>
      ) : (
        <Table emptyLabel="Nothing awaiting order" columns={columns} rows={toOrder} maxHeight="600px" />
      )}
    </div>
  );
}
