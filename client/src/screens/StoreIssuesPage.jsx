import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Table } from '../components/Table';
import { useStoreIssues } from '../services/storeIssues';
import { formatDateTime } from '../utils/format';
import { flattenIssueItems } from '../utils/storeIssues';

const STATUS_OPTIONS = ['Issued', 'Partially Issued', 'Awaiting Order', 'Returned', 'Closed'];

export default function StoreIssuesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');

  const filters = useMemo(
    () => ({ search: search || undefined, status: status || undefined }),
    [search, status]
  );

  const { data, isLoading, isError } = useStoreIssues(filters);
  const lines = useMemo(() => flattenIssueItems(data?.issues || []), [data]);

  const columns = useMemo(
    () => [
      { key: 'issueNumber', header: 'Issue #' },
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'quantityRequested', header: 'Requested' },
      { key: 'quantityIssued', header: 'Issued' },
      { key: 'quantityToOrder', header: 'To Order' },
      { key: 'quantityReturned', header: 'Returned' },
      { key: 'machineNumber', header: 'Machine #' },
      { key: 'serviceOrderNumber', header: 'Service Order' },
      { key: 'workOrderNumber', header: 'Work Order' },
      { key: 'requestorName', header: 'Requestor', render: (i) => `${i.requestorName} ${i.requestorSurname}` },
      { key: 'requestorClockNumber', header: 'Clock #' },
      { key: 'justification', header: 'Justification' },
      { key: 'issuedBy', header: 'Issued By', render: (i) => i.issuedBy?.fullName || '' },
      { key: 'issueDate', header: 'Date', render: (i) => formatDateTime(i.issueDate) },
      { key: 'status', header: 'Status' },
      {
        key: 'print',
        header: '',
        render: (i) => (
          <Link
            to={`/spare-parts/store-issues/${i.issueId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-epiroc-blue font-semibold hover:underline"
          >
            Print
          </Link>
        ),
      },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Store Issues</div>
        <div className="text-sm text-slate-600">All spare part issues recorded by the Parts Storeman.</div>
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="text-xs font-semibold text-slate-600">Search (issue #, part #, description)</label>
          <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Status</label>
          <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading store issues...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load store issues</div>
      ) : (
        <Table emptyLabel="No store issues found" columns={columns} rows={lines} maxHeight="600px" />
      )}
    </div>
  );
}
