import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../components/Table';
import { useStoreIssues } from '../services/storeIssues';
import { useCreatePartReturn } from '../services/partReturns';
import { formatDateTime } from '../utils/format';

export default function PartReturnsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useStoreIssues({ search: search || undefined });
  const issues = data?.issues || [];

  const outstandingIssues = useMemo(
    () => issues.filter((i) => i.quantityIssued - i.quantityReturned > 0),
    [issues]
  );

  const [selectedIssue, setSelectedIssue] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [reason, setReason] = useState('');

  const createReturn = useCreatePartReturn();

  const outstanding = selectedIssue ? selectedIssue.quantityIssued - selectedIssue.quantityReturned : 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedIssue) {
      toast.error('Select a store issue first');
      return;
    }
    const qty = Number(quantity);
    if (!(qty > 0) || qty > outstanding) {
      toast.error(`Enter a quantity between 1 and ${outstanding}`);
      return;
    }

    createReturn.mutate(
      { storeIssueId: selectedIssue._id, quantity: qty, reason },
      {
        onSuccess: () => {
          setSelectedIssue(null);
          setQuantity('1');
          setReason('');
        },
      }
    );
  }

  const columns = useMemo(
    () => [
      { key: 'issueNumber', header: 'Issue #' },
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'quantityIssued', header: 'Issued' },
      { key: 'quantityReturned', header: 'Already Returned' },
      { key: 'outstanding', header: 'Issued Out', render: (i) => i.quantityIssued - i.quantityReturned },
      { key: 'issueDate', header: 'Issue Date', render: (i) => formatDateTime(i.issueDate) },
      { key: 'status', header: 'Status' },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Returns</div>
        <div className="text-sm text-slate-600">Find a store issue and record returned stock.</div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Find store issue</div>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by issue number, part number or description..."
        />

        {isLoading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : isError ? (
          <div className="text-sm text-slate-600">Could not load store issues</div>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl">
            {outstandingIssues.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No parts issued out</div>
            ) : (
              outstandingIssues.map((issue) => (
                <div
                  key={issue._id}
                  className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 ${
                    selectedIssue?._id === issue._id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedIssue(issue)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">{issue.issueNumber} — {issue.partNumber}</div>
                      <div className="text-sm text-slate-600">{issue.partDescription}</div>
                    </div>
                    <div className="text-sm font-semibold text-epiroc-blue">
                      {issue.quantityIssued - issue.quantityReturned} issued out
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {selectedIssue && (
        <form className="rounded-xl bg-white shadow-soft p-6 space-y-4" onSubmit={handleSubmit}>
          <div className="text-sm font-semibold text-epiroc-blue">
            Record return for {selectedIssue.issueNumber} ({selectedIssue.partNumber})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Quantity to return (max {outstanding})</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                type="number"
                min="1"
                max={outstanding}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Reason (optional)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              disabled={createReturn.isPending}
            >
              {createReturn.isPending ? 'Recording return...' : 'Record return'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Parts issued out</div>
        <Table emptyLabel="No parts issued out" columns={columns} rows={outstandingIssues} maxHeight="400px" />
      </div>
    </div>
  );
}
