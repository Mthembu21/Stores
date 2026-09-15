import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useSpareParts } from '../services/spareParts';
import { useConsumablePartIssues, useCreateConsumablePartIssue } from '../services/consumablePartIssues';
import { formatDateTime } from '../utils/format';

function todayLocalDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function IssueConsumablesPage() {
  const { data: partsData, isLoading: partsLoading } = useSpareParts();
  const { data: issuesData, isLoading: issuesLoading, isError: issuesError } = useConsumablePartIssues();
  const createIssue = useCreateConsumablePartIssue();

  const consumableParts = useMemo(
    () => (partsData?.parts || []).filter((p) => p.partType === 'Consumable'),
    [partsData]
  );
  const issues = issuesData?.issues || [];

  const [sparePartId, setSparePartId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [personName, setPersonName] = useState('');
  const [zNumber, setZNumber] = useState('');
  const [foremanName, setForemanName] = useState('');
  const [issueDate, setIssueDate] = useState(() => todayLocalDate());

  const selectedPart = consumableParts.find((p) => p._id === sparePartId);

  function handleSubmit(e) {
    e.preventDefault();
    if (!sparePartId || !quantity || !personName.trim() || !zNumber.trim() || !foremanName.trim()) return;

    createIssue.mutate(
      {
        sparePartId,
        quantity: Number(quantity),
        personName: personName.trim(),
        zNumber: zNumber.trim(),
        foremanName: foremanName.trim(),
        issueDate,
      },
      {
        onSuccess: () => {
          setSparePartId('');
          setQuantity('1');
          setPersonName('');
          setZNumber('');
          setForemanName('');
          setIssueDate(todayLocalDate());
        },
      }
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-gray">Issue Consumables</div>
        <div className="text-sm text-slate-600">
          Consumables (oils, grease, filters, PPE, etc.) are issued separately from returnable parts.
        </div>
      </div>

      <form className="rounded-xl bg-white shadow-soft p-6 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="text-sm font-medium text-slate-700">Consumable</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={sparePartId}
            onChange={(e) => setSparePartId(e.target.value)}
            required
            disabled={partsLoading}
          >
            <option value="">Select consumable...</option>
            {consumableParts.map((p) => (
              <option key={p._id} value={p._id}>
                {p.partDescription} ({p.partNumber}) — {p.stockOnHand} {p.unitOfMeasure} in stock
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min="1"
              max={selectedPart?.stockOnHand || undefined}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              type="date"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-700">Name of person taking it</label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            placeholder="Full name"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Z Number</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={zNumber}
              onChange={(e) => setZNumber(e.target.value)}
              placeholder="e.g. Z123456"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Foreman</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={foremanName}
              onChange={(e) => setForemanName(e.target.value)}
              placeholder="Foreman they report to"
              required
            />
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            disabled={createIssue.isPending}
          >
            {createIssue.isPending ? 'Issuing...' : 'Issue Consumable'}
          </button>
        </div>
      </form>

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-3">
        <div className="text-sm font-semibold text-epiroc-gray">Recent Consumable Issues</div>
        {issuesLoading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : issuesError ? (
          <div className="text-sm text-slate-600">Could not load consumable issues</div>
        ) : (
          <Table
            emptyLabel="No consumables issued yet"
            columns={[
              { key: 'issueNumber', header: 'Issue #' },
              { key: 'partDescription', header: 'Consumable' },
              { key: 'quantity', header: 'Qty' },
              { key: 'personName', header: 'Person' },
              { key: 'zNumber', header: 'Z Number' },
              { key: 'foremanName', header: 'Foreman' },
              { key: 'issueDate', header: 'Date', render: (r) => formatDateTime(r.issueDate) },
            ]}
            rows={issues}
            maxHeight="400px"
          />
        )}
      </div>
    </div>
  );
}
