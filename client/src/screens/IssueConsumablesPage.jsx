import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../components/Table';
import { useSpareParts } from '../services/spareParts';
import { useConsumablePartIssues, useCreateConsumablePartIssue } from '../services/consumablePartIssues';
import { usePartsPeople, useCreatePartsPerson } from '../services/partsPeople';
import { formatDateTime } from '../utils/format';

function todayLocalDate() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function allocatableOf(part) {
  if (!part) return 0;
  return part.allocatableStock === null || part.allocatableStock === undefined ? part.stockOnHand : part.allocatableStock;
}

export default function IssueConsumablesPage() {
  const { data: partsData, isLoading: partsLoading } = useSpareParts({ partType: 'Consumable' });
  const { data: issuesData, isLoading: issuesLoading, isError: issuesError } = useConsumablePartIssues();
  const createIssue = useCreateConsumablePartIssue();

  const { data: requestorsData } = usePartsPeople('Requestor');
  const requestors = requestorsData?.people || [];
  const createPartsPerson = useCreatePartsPerson();

  const consumableParts = useMemo(
    () => partsData?.parts || [],
    [partsData]
  );
  const issues = issuesData?.issues || [];

  const [sparePartId, setSparePartId] = useState('');
  const [consumableSearch, setConsumableSearch] = useState('');
  const [showConsumableDropdown, setShowConsumableDropdown] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [selectedRequestorId, setSelectedRequestorId] = useState('');
  const [personName, setPersonName] = useState('');
  const [zNumber, setZNumber] = useState('');
  const [showAddRequestor, setShowAddRequestor] = useState(false);
  const [newRequestorName, setNewRequestorName] = useState('');
  const [newRequestorZNumber, setNewRequestorZNumber] = useState('');
  const [foremanName, setForemanName] = useState('');
  const [issueDate, setIssueDate] = useState(() => todayLocalDate());

  const selectedPart = consumableParts.find((p) => p._id === sparePartId);

  const filteredConsumableParts = useMemo(() => {
    const q = consumableSearch.trim().toLowerCase();
    if (!q) return consumableParts;
    return consumableParts.filter((p) => {
      const num = String(p.partNumber || '').toLowerCase();
      const desc = String(p.partDescription || '').toLowerCase();
      return num.includes(q) || desc.includes(q);
    });
  }, [consumableParts, consumableSearch]);

  function handleSelectConsumable(id) {
    const part = consumableParts.find((p) => p._id === id);
    setSparePartId(id);
    setConsumableSearch(part ? `${part.partDescription} (${part.partNumber})` : '');
    setShowConsumableDropdown(false);
  }

  function handleConsumableSearchFocus() {
    setShowConsumableDropdown(true);
    setConsumableSearch('');
  }

  function handleConsumableSearchBlur() {
    setTimeout(() => {
      setShowConsumableDropdown(false);
      setConsumableSearch((current) => {
        if (current) return current;
        return selectedPart ? `${selectedPart.partDescription} (${selectedPart.partNumber})` : '';
      });
    }, 150);
  }

  function handleConsumableSearchChange(value) {
    setConsumableSearch(value);
    setShowConsumableDropdown(true);
    if (!value) {
      setSparePartId('');
    }
  }

  function handleSelectRequestor(id) {
    setSelectedRequestorId(id);
    const person = requestors.find((p) => p._id === id);
    setPersonName(person ? person.name : '');
    setZNumber(person ? person.zNumber : '');
  }

  function handleAddRequestor() {
    if (!newRequestorName.trim() || !newRequestorZNumber.trim()) {
      toast.error('Provide both a name and a Z number');
      return;
    }
    createPartsPerson.mutate(
      { name: newRequestorName.trim(), zNumber: newRequestorZNumber.trim(), role: 'Requestor' },
      {
        onSuccess: (data) => {
          const person = data?.person;
          if (person) {
            setSelectedRequestorId(person._id);
            setPersonName(person.name);
            setZNumber(person.zNumber);
          }
          setNewRequestorName('');
          setNewRequestorZNumber('');
          setShowAddRequestor(false);
        },
      }
    );
  }

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
          setConsumableSearch('');
          setQuantity('1');
          setSelectedRequestorId('');
          setPersonName('');
          setZNumber('');
          setShowAddRequestor(false);
          setNewRequestorName('');
          setNewRequestorZNumber('');
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
        <div className="relative">
          <label className="text-sm font-medium text-slate-700">Consumable</label>
          <input
            type="text"
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={consumableSearch}
            onChange={(e) => handleConsumableSearchChange(e.target.value)}
            onFocus={handleConsumableSearchFocus}
            onBlur={handleConsumableSearchBlur}
            placeholder={partsLoading ? 'Loading consumables...' : 'Search by part number or description...'}
            autoComplete="off"
            disabled={partsLoading}
          />
          {showConsumableDropdown && (
            <div className="absolute z-10 mt-1 w-full max-h-56 overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-soft">
              {filteredConsumableParts.length === 0 ? (
                <div className="p-3 text-sm text-slate-500 text-center">No consumables found</div>
              ) : (
                filteredConsumableParts.map((p) => (
                  <div
                    key={p._id}
                    className="p-2 text-sm border-b border-slate-100 cursor-pointer hover:bg-blue-50"
                    onMouseDown={() => handleSelectConsumable(p._id)}
                  >
                    <div className="font-medium text-slate-900">
                      {p.partDescription} <span className="text-xs font-normal text-slate-400">({p.partNumber})</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {allocatableOf(p)} {p.unitOfMeasure} available
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min="1"
              max={allocatableOf(selectedPart) || undefined}
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
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={selectedRequestorId}
            onChange={(e) => handleSelectRequestor(e.target.value)}
            required
          >
            <option value="">Select a requestor...</option>
            {requestors.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.zNumber})
              </option>
            ))}
          </select>
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-epiroc-gray hover:underline"
            onClick={() => setShowAddRequestor((v) => !v)}
          >
            {showAddRequestor ? 'Cancel' : '+ Requestor not listed'}
          </button>
          {showAddRequestor && (
            <div className="mt-2 flex gap-2">
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Name"
                value={newRequestorName}
                onChange={(e) => setNewRequestorName(e.target.value)}
              />
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                placeholder="Z number"
                value={newRequestorZNumber}
                onChange={(e) => setNewRequestorZNumber(e.target.value)}
              />
              <button
                type="button"
                className="rounded-xl bg-epiroc-yellow px-3 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95 whitespace-nowrap disabled:opacity-60"
                onClick={handleAddRequestor}
                disabled={createPartsPerson.isPending}
              >
                Add
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Z Number</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50"
              value={zNumber}
              readOnly
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
