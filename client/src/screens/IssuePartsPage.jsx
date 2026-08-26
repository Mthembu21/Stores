import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSpareParts } from '../services/spareParts';
import { useCreateStoreIssue } from '../services/storeIssues';

export default function IssuePartsPage() {
  const { data: partsData, isLoading: partsLoading } = useSpareParts();
  const parts = partsData?.parts || [];
  const createIssue = useCreateStoreIssue();

  const [partSearch, setPartSearch] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);

  const filteredParts = useMemo(() => {
    const q = partSearch.trim().toLowerCase();
    if (!q) return parts;
    return parts.filter((p) => {
      const num = String(p.partNumber || '').toLowerCase();
      const desc = String(p.partDescription || '').toLowerCase();
      const comp = String(p.componentPartNumber || '').toLowerCase();
      return num.includes(q) || desc.includes(q) || comp.includes(q);
    });
  }, [parts, partSearch]);

  const [machineNumber, setMachineNumber] = useState('');
  const [machineType, setMachineType] = useState('');
  const [serviceOrderNumber, setServiceOrderNumber] = useState('');
  const [workOrderNumber, setWorkOrderNumber] = useState('');

  const [requestorName, setRequestorName] = useState('');
  const [requestorSurname, setRequestorSurname] = useState('');
  const [requestorClockNumber, setRequestorClockNumber] = useState('');
  const [requestorContactNumber, setRequestorContactNumber] = useState('');

  const [justification, setJustification] = useState('');

  const [quantityRequested, setQuantityRequested] = useState('1');
  const [quantityIssued, setQuantityIssued] = useState('');
  const [quantityToOrder, setQuantityToOrder] = useState('');
  const [quantityReturned, setQuantityReturned] = useState('0');
  const [quantityTouched, setQuantityTouched] = useState(false);

  const [foremanName, setForemanName] = useState('');
  const [foremanSurname, setForemanSurname] = useState('');

  const requestedNum = Number(quantityRequested) || 0;
  const stockOnHand = selectedPart?.stockOnHand ?? 0;
  const autoIssued = Math.max(0, Math.min(stockOnHand, requestedNum));
  const autoToOrder = Math.max(0, requestedNum - stockOnHand);

  const effectiveIssued = quantityTouched && quantityIssued !== '' ? Number(quantityIssued) : autoIssued;
  const effectiveToOrder = quantityTouched && quantityToOrder !== '' ? Number(quantityToOrder) : autoToOrder;

  function selectPart(part) {
    setSelectedPart(part);
    setQuantityTouched(false);
    setQuantityIssued('');
    setQuantityToOrder('');
  }

  function resetForm() {
    setSelectedPart(null);
    setPartSearch('');
    setMachineNumber('');
    setMachineType('');
    setServiceOrderNumber('');
    setWorkOrderNumber('');
    setRequestorName('');
    setRequestorSurname('');
    setRequestorClockNumber('');
    setRequestorContactNumber('');
    setJustification('');
    setQuantityRequested('1');
    setQuantityIssued('');
    setQuantityToOrder('');
    setQuantityReturned('0');
    setQuantityTouched(false);
    setForemanName('');
    setForemanSurname('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPart) {
      toast.error('Select a part first');
      return;
    }
    if (!justification.trim()) {
      toast.error('Provide a justification for this request');
      return;
    }

    createIssue.mutate(
      {
        machineNumber,
        machineType,
        serviceOrderNumber,
        workOrderNumber,
        sparePartId: selectedPart._id,
        requestorName,
        requestorSurname,
        requestorClockNumber,
        requestorContactNumber,
        justification,
        quantityRequested: requestedNum,
        quantityIssued: effectiveIssued,
        quantityToOrder: effectiveToOrder,
        quantityReturned: Number(quantityReturned) || 0,
        foremanName,
        foremanSurname,
      },
      { onSuccess: resetForm }
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Issue Parts</div>
        <div className="text-sm text-slate-600">Search a part, capture job details, justification and quantities.</div>
      </div>

      <form className="rounded-xl bg-white shadow-soft p-6 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Select part</div>
          <input
            type="text"
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={partSearch}
            onChange={(e) => setPartSearch(e.target.value)}
            placeholder="Search by part number, description or component number..."
          />
          <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
            {partsLoading ? (
              <div className="p-4 text-sm text-slate-500 text-center">Loading parts...</div>
            ) : filteredParts.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">No parts found</div>
            ) : (
              filteredParts.map((part) => (
                <div
                  key={part._id}
                  className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 ${
                    selectedPart?._id === part._id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => selectPart(part)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium text-slate-900">
                        {part.partNumber} <span className="text-xs font-normal text-slate-400">· {part.partType}</span>
                      </div>
                      <div className="text-sm text-slate-600">{part.partDescription}</div>
                    </div>
                    <div className={`text-sm font-semibold ${part.stockOnHand > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {part.stockOnHand} in stock
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedPart && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
              <div><span className="text-slate-500">Component #:</span> {selectedPart.componentPartNumber || '—'}</div>
              <div><span className="text-slate-500">Component desc:</span> {selectedPart.componentDescription || '—'}</div>
              <div><span className="text-slate-500">Functional system:</span> {selectedPart.functionalSystem || '—'}</div>
              <div><span className="text-slate-500">Sub-system:</span> {selectedPart.subSystem || '—'}</div>
              <div><span className="text-slate-500">Machine type:</span> {selectedPart.machineType || '—'}</div>
              <div><span className="text-slate-500">Serial #:</span> {selectedPart.serialNumber || '—'}</div>
              <div><span className="text-slate-500">Stock on hand:</span> {selectedPart.stockOnHand}</div>
              <div><span className="text-slate-500">Minimum level:</span> {selectedPart.minimumStockLevel}</div>
              <div><span className="text-slate-500">UoM:</span> {selectedPart.unitOfMeasure}</div>
              <div><span className="text-slate-500">Location:</span> {selectedPart.storageLocation || '—'}</div>
            </div>
          )}
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Job information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Machine number</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={machineNumber} onChange={(e) => setMachineNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Machine type</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={machineType} onChange={(e) => setMachineType(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Service order number</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={serviceOrderNumber} onChange={(e) => setServiceOrderNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Work order number</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={workOrderNumber} onChange={(e) => setWorkOrderNumber(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Requestor</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Requestor name</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={requestorName} onChange={(e) => setRequestorName(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Requestor surname</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={requestorSurname} onChange={(e) => setRequestorSurname(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Clock number (optional)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={requestorClockNumber} onChange={(e) => setRequestorClockNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Contact number (optional)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={requestorContactNumber} onChange={(e) => setRequestorContactNumber(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Justification (why is this being requested?)</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={2}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="e.g. Worn seal replaced during scheduled service on unit 12"
              required
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Quantities</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Requested</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                type="number"
                min="1"
                value={quantityRequested}
                onChange={(e) => setQuantityRequested(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Issued</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                type="number"
                min="0"
                value={quantityTouched ? quantityIssued : autoIssued}
                onChange={(e) => {
                  setQuantityTouched(true);
                  setQuantityIssued(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">To order</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                type="number"
                min="0"
                value={quantityTouched ? quantityToOrder : autoToOrder}
                onChange={(e) => {
                  setQuantityTouched(true);
                  setQuantityToOrder(e.target.value);
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Returned</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                type="number"
                min="0"
                value={quantityReturned}
                onChange={(e) => setQuantityReturned(e.target.value)}
              />
            </div>
          </div>
          <div className="text-xs text-slate-500">
            Issued and to-order are calculated automatically from stock on hand, but can be adjusted before submitting.
            Returned only applies if some of the issued quantity is being handed back immediately.
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Foreman</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Foreman name</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={foremanName} onChange={(e) => setForemanName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Foreman surname</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={foremanSurname} onChange={(e) => setForemanSurname(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            disabled={createIssue.isPending}
          >
            {createIssue.isPending ? 'Creating issue...' : 'Create issue'}
          </button>
        </div>
      </form>
    </div>
  );
}
