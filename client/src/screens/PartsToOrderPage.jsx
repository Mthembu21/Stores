import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useStoreIssues } from '../services/storeIssues';
import { useSpareParts } from '../services/spareParts';
import { usePartRequests, useCreatePartRequest, useUpdatePartRequest, useDeletePartRequest } from '../services/partRequests';
import { useNonStockItems } from '../services/nonStockItems';
import { formatDateTime } from '../utils/format';
import { flattenIssueItems } from '../utils/storeIssues';
import toast from 'react-hot-toast';

function daysOld(dateStr) {
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (24 * 60 * 60 * 1000)));
}

export default function PartsToOrderPage() {
  const { data: issuesData, isLoading: issuesLoading, isError: issuesError } = useStoreIssues();
  const lines = useMemo(() => flattenIssueItems(issuesData?.issues || []), [issuesData]);
  const fromIssues = useMemo(
    () => lines.filter((i) => i.quantityToOrder > 0 && i.issueStatus !== 'Closed' && i.status !== 'Returned'),
    [lines]
  );

  const { data: partsData } = useSpareParts({ partType: 'Returnable' });
  const parts = partsData?.parts || [];

  const { data: nonStockData } = useNonStockItems();
  const nonStockItems = nonStockData?.items || [];

  const [statusFilter, setStatusFilter] = useState('Open');
  const { data: requestsData, isLoading: requestsLoading, isError: requestsError } = usePartRequests(
    statusFilter ? { status: statusFilter } : undefined
  );
  const requests = requestsData?.requests || [];

  const createRequest = useCreatePartRequest();
  const updateRequest = useUpdatePartRequest();
  const deleteRequest = useDeletePartRequest();

  const [partSearch, setPartSearch] = useState('');
  const [selectedPartId, setSelectedPartId] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualPartNumber, setManualPartNumber] = useState('');
  const [manualPartDescription, setManualPartDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [machineNumber, setMachineNumber] = useState('');
  const [requestorName, setRequestorName] = useState('');
  const [notes, setNotes] = useState('');

  const combinedCatalog = useMemo(
    () => [
      ...parts.map((p) => ({ ...p, _key: `stock:${p._id}`, _source: 'stock' })),
      ...nonStockItems.map((p) => ({ ...p, _key: `nonstock:${p._id}`, _source: 'nonStock' })),
    ],
    [parts, nonStockItems]
  );

  const filteredParts = useMemo(() => {
    const q = partSearch.trim().toLowerCase();
    if (!q) return [];
    return combinedCatalog
      .filter((p) => {
        const num = String(p.partNumber || '').toLowerCase();
        const desc = String(p.partDescription || '').toLowerCase();
        return num.includes(q) || desc.includes(q);
      })
      .slice(0, 20);
  }, [combinedCatalog, partSearch]);

  const selectedPart = combinedCatalog.find((p) => p._key === selectedPartId);

  function handleSelectPart(part) {
    setSelectedPartId(part._key);
    setPartSearch(`${part.partNumber} — ${part.partDescription}`);
    if (part._source === 'nonStock' && !notes.trim()) {
      const bits = [];
      if (part.supplier) bits.push(`Supplier: ${part.supplier}`);
      if (part.leadTimeDays !== null && part.leadTimeDays !== undefined) bits.push(`Lead time: ${part.leadTimeDays}d`);
      if (bits.length) setNotes(bits.join(', '));
    }
  }

  function resetFlagForm() {
    setPartSearch('');
    setSelectedPartId('');
    setShowManualEntry(false);
    setManualPartNumber('');
    setManualPartDescription('');
    setQuantity('1');
    setMachineNumber('');
    setRequestorName('');
    setNotes('');
  }

  function handleFlagSubmit(e) {
    e.preventDefault();
    const partNumber = showManualEntry ? manualPartNumber.trim() : selectedPart?.partNumber;
    const partDescription = showManualEntry ? manualPartDescription.trim() : selectedPart?.partDescription;

    if (!partNumber || !partDescription) {
      toast.error('Select a part, or enter a part number and description');
      return;
    }
    if (!quantity || Number(quantity) <= 0) {
      toast.error('Enter a quantity greater than 0');
      return;
    }

    createRequest.mutate(
      {
        partNumber,
        partDescription,
        quantityRequested: Number(quantity),
        machineNumber: machineNumber.trim(),
        requestorName: requestorName.trim(),
        notes: notes.trim(),
      },
      { onSuccess: resetFlagForm }
    );
  }

  const requestRows = useMemo(() => requests.map((r) => ({ ...r, id: r._id })), [requests]);

  const requestColumns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'quantityRequested', header: 'Qty' },
      { key: 'machineNumber', header: 'Machine #' },
      { key: 'requestorName', header: 'Requested For' },
      { key: 'notes', header: 'Notes' },
      {
        key: 'createdAt',
        header: 'Flagged',
        render: (r) => `${formatDateTime(r.createdAt)} (${daysOld(r.createdAt)}d)`,
      },
      { key: 'status', header: 'Status' },
      {
        key: 'actions',
        header: '',
        render: (r) => (
          <div className="flex items-center gap-2">
            {r.status === 'Open' && (
              <>
                <button
                  type="button"
                  className="rounded-lg border border-green-200 text-green-700 px-2 py-0.5 text-xs hover:bg-green-50"
                  onClick={() => updateRequest.mutate({ id: r._id, status: 'Received' })}
                  disabled={updateRequest.isPending}
                >
                  Mark Received
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 text-slate-600 px-2 py-0.5 text-xs hover:bg-slate-50"
                  onClick={() => updateRequest.mutate({ id: r._id, status: 'Cancelled' })}
                  disabled={updateRequest.isPending}
                >
                  Cancel
                </button>
              </>
            )}
            <button
              type="button"
              className="rounded-lg border border-red-200 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50"
              onClick={() => {
                if (window.confirm(`Remove this flagged request for ${r.partNumber}?`)) deleteRequest.mutate(r._id);
              }}
              disabled={deleteRequest.isPending}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [updateRequest, deleteRequest]
  );

  const fromIssuesColumns = useMemo(
    () => [
      { key: 'issueNumber', header: 'Issue #' },
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'quantityToOrder', header: 'Qty To Order' },
      { key: 'serviceOrderNumber', header: 'Service Order' },
      { key: 'workOrderNumber', header: 'Work Order' },
      { key: 'requestorName', header: 'Requestor', render: (i) => [i.requestorName, i.requestorSurname].filter(Boolean).join(' ') },
      { key: 'issueDate', header: 'Date', render: (i) => formatDateTime(i.issueDate) },
      { key: 'status', header: 'Status' },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-gray">Parts To Order</div>
        <div className="text-sm text-slate-600">
          Flag parts a technician asked for that aren't in stock, and track outstanding quantities that still need
          to be ordered.
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-4 max-w-3xl">
        <div className="text-sm font-semibold text-epiroc-gray">Flag a part to order</div>
        <form className="space-y-4" onSubmit={handleFlagSubmit}>
          {!showManualEntry ? (
            <div className="relative">
              <label className="text-sm font-medium text-slate-700">Part</label>
              <input
                type="text"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={partSearch}
                onChange={(e) => {
                  setPartSearch(e.target.value);
                  setSelectedPartId('');
                }}
                placeholder="Search by part number or description..."
              />
              {partSearch && !selectedPartId && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-soft">
                  {filteredParts.length === 0 ? (
                    <div className="p-3 text-sm text-slate-500 text-center">No matching parts</div>
                  ) : (
                    filteredParts.map((p) => (
                      <div
                        key={p._key}
                        className="p-2 text-sm border-b border-slate-100 cursor-pointer hover:bg-blue-50"
                        onMouseDown={() => handleSelectPart(p)}
                      >
                        <div className="font-medium text-slate-900">
                          {p.partNumber}
                          {p._source === 'nonStock' && (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-epiroc-yellow bg-epiroc-yellow/15 px-1.5 py-0.5 rounded">
                              Not normally stocked
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{p.partDescription}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Part number</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={manualPartNumber}
                  onChange={(e) => setManualPartNumber(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Part description</label>
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={manualPartDescription}
                  onChange={(e) => setManualPartDescription(e.target.value)}
                />
              </div>
            </div>
          )}
          <button
            type="button"
            className="text-xs font-semibold text-epiroc-gray hover:underline"
            onClick={() => {
              setShowManualEntry((v) => !v);
              setPartSearch('');
              setSelectedPartId('');
            }}
          >
            {showManualEntry ? 'Search existing parts instead' : "+ Part not in catalog yet"}
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Quantity needed</label>
              <input
                type="number"
                min="1"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Machine number (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={machineNumber}
                onChange={(e) => setMachineNumber(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Requested for (optional)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={requestorName}
                onChange={(e) => setRequestorName(e.target.value)}
                placeholder="Technician name"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Notes (optional)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? 'Flagging...' : 'Flag to order'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-epiroc-gray">Flagged requests</div>
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="Open">Open</option>
            <option value="Received">Received</option>
            <option value="Cancelled">Cancelled</option>
            <option value="">All</option>
          </select>
        </div>
        {requestsLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
        ) : requestsError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load part requests</div>
        ) : (
          <Table emptyLabel="Nothing flagged" columns={requestColumns} rows={requestRows} maxHeight="400px" />
        )}
      </div>

      <div className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-epiroc-gray">Awaiting order (from partially-issued store issues)</div>
          <div className="text-xs text-slate-500">Shortfalls left over from an Issue Parts transaction where requested more than could be issued.</div>
        </div>
        {issuesLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
        ) : issuesError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load store issues</div>
        ) : (
          <Table emptyLabel="Nothing awaiting order" columns={fromIssuesColumns} rows={fromIssues} maxHeight="400px" />
        )}
      </div>
    </div>
  );
}
