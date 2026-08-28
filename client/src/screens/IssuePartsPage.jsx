import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useSpareParts } from '../services/spareParts';
import { useCreateStoreIssue } from '../services/storeIssues';

function nextKey() {
  return `line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function computeAuto(part, requested) {
  const stockOnHand = part?.stockOnHand ?? 0;
  const requestedNum = Number(requested) || 0;
  return {
    autoIssued: Math.max(0, Math.min(stockOnHand, requestedNum)),
    autoToOrder: Math.max(0, requestedNum - stockOnHand),
  };
}

export default function IssuePartsPage() {
  const { data: partsData, isLoading: partsLoading } = useSpareParts();
  const parts = partsData?.parts || [];
  const createIssue = useCreateStoreIssue();

  const [partSearch, setPartSearch] = useState('');
  const [items, setItems] = useState([]);
  const [lastCreatedIssue, setLastCreatedIssue] = useState(null);

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
  const [riskAssessmentNumber, setRiskAssessmentNumber] = useState('');

  const [location, setLocation] = useState('');
  const [section, setSection] = useState('');
  const [workplace, setWorkplace] = useState('');
  const [responsibleForeman, setResponsibleForeman] = useState('');

  const [dateStarted, setDateStarted] = useState('');
  const [dateCompleted, setDateCompleted] = useState('');
  const [timeStarted, setTimeStarted] = useState('');
  const [timeCompleted, setTimeCompleted] = useState('');

  const [engineHours, setEngineHours] = useState('');
  const [powerPackHours, setPowerPackHours] = useState('');
  const [percussionHours, setPercussionHours] = useState('');
  const [extraHours, setExtraHours] = useState('');

  const [damage, setDamage] = useState(false);
  const [breakdown, setBreakdown] = useState(false);
  const [warranty, setWarranty] = useState(false);
  const [inspection, setInspection] = useState(false);
  const [possibleCausesOfFailure, setPossibleCausesOfFailure] = useState('');
  const [workPerformed, setWorkPerformed] = useState('');

  const [subSystem, setSubSystem] = useState('');
  const [functionalSystem, setFunctionalSystem] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [componentPartNumber, setComponentPartNumber] = useState('');
  const [serialNumberIssued, setSerialNumberIssued] = useState('');
  const [serialNumberReturned, setSerialNumberReturned] = useState('');

  const [laborEntries, setLaborEntries] = useState([]);

  const [requestorName, setRequestorName] = useState('');
  const [requestorSurname, setRequestorSurname] = useState('');
  const [requestorClockNumber, setRequestorClockNumber] = useState('');
  const [requestorContactNumber, setRequestorContactNumber] = useState('');

  const [justification, setJustification] = useState('');

  const [foremanName, setForemanName] = useState('');
  const [foremanSurname, setForemanSurname] = useState('');
  const [storemanName, setStoremanName] = useState('');
  const [storemanSurname, setStoremanSurname] = useState('');

  function addPart(part) {
    setItems((prev) => {
      const existing = prev.find((i) => i.part._id === part._id);
      if (existing) {
        return prev.map((i) =>
          i.key === existing.key ? { ...i, quantityRequested: String(Number(i.quantityRequested || 0) + 1) } : i
        );
      }
      return [
        ...prev,
        {
          key: nextKey(),
          part,
          quantityRequested: '1',
          quantityIssued: '',
          quantityToOrder: '',
          quantityReturned: '0',
          touched: false,
        },
      ];
    });
  }

  function updateItem(key, patch) {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  function removeItem(key) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function addLaborEntry() {
    setLaborEntries((prev) => [
      ...prev,
      { key: nextKey(), clockNumber: '', name: '', surname: '', position: '', totalHours: '' },
    ]);
  }

  function updateLaborEntry(key, patch) {
    setLaborEntries((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  function removeLaborEntry(key) {
    setLaborEntries((prev) => prev.filter((l) => l.key !== key));
  }

  function resetForm() {
    setItems([]);
    setPartSearch('');
    setMachineNumber('');
    setMachineType('');
    setServiceOrderNumber('');
    setWorkOrderNumber('');
    setRiskAssessmentNumber('');
    setLocation('');
    setSection('');
    setWorkplace('');
    setResponsibleForeman('');
    setDateStarted('');
    setDateCompleted('');
    setTimeStarted('');
    setTimeCompleted('');
    setEngineHours('');
    setPowerPackHours('');
    setPercussionHours('');
    setExtraHours('');
    setDamage(false);
    setBreakdown(false);
    setWarranty(false);
    setInspection(false);
    setPossibleCausesOfFailure('');
    setWorkPerformed('');
    setSubSystem('');
    setFunctionalSystem('');
    setComponentDescription('');
    setComponentPartNumber('');
    setSerialNumberIssued('');
    setSerialNumberReturned('');
    setLaborEntries([]);
    setRequestorName('');
    setRequestorSurname('');
    setRequestorClockNumber('');
    setRequestorContactNumber('');
    setJustification('');
    setForemanName('');
    setForemanSurname('');
    setStoremanName('');
    setStoremanSurname('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Add at least one part');
      return;
    }
    if (!justification.trim()) {
      toast.error('Provide a justification for this request');
      return;
    }

    const payloadItems = items.map((item) => {
      const requestedNum = Number(item.quantityRequested) || 0;
      const { autoIssued, autoToOrder } = computeAuto(item.part, requestedNum);
      return {
        sparePartId: item.part._id,
        quantityRequested: requestedNum,
        quantityIssued: item.touched && item.quantityIssued !== '' ? Number(item.quantityIssued) : autoIssued,
        quantityToOrder: item.touched && item.quantityToOrder !== '' ? Number(item.quantityToOrder) : autoToOrder,
        quantityReturned: Number(item.quantityReturned) || 0,
      };
    });

    const payloadLaborEntries = laborEntries
      .filter((l) => l.name || l.surname || l.clockNumber || l.position || l.totalHours)
      .map((l) => ({
        clockNumber: l.clockNumber,
        name: l.name,
        surname: l.surname,
        position: l.position,
        totalHours: l.totalHours === '' ? null : Number(l.totalHours),
      }));

    createIssue.mutate(
      {
        machineNumber,
        machineType,
        serviceOrderNumber,
        workOrderNumber,
        riskAssessmentNumber,
        location,
        section,
        workplace,
        responsibleForeman,
        dateStarted: dateStarted || null,
        dateCompleted: dateCompleted || null,
        timeStarted,
        timeCompleted,
        engineHours: engineHours === '' ? null : Number(engineHours),
        powerPackHours: powerPackHours === '' ? null : Number(powerPackHours),
        percussionHours: percussionHours === '' ? null : Number(percussionHours),
        extraHours: extraHours === '' ? null : Number(extraHours),
        natureOfDowntime: { damage, breakdown, warranty, inspection },
        possibleCausesOfFailure,
        workPerformed,
        subSystem,
        functionalSystem,
        componentDescription,
        componentPartNumber,
        serialNumberIssued,
        serialNumberReturned,
        items: payloadItems,
        laborEntries: payloadLaborEntries,
        requestorName,
        requestorSurname,
        requestorClockNumber,
        requestorContactNumber,
        justification,
        foremanName,
        foremanSurname,
        storemanName,
        storemanSurname,
      },
      {
        onSuccess: (data) => {
          setLastCreatedIssue(data?.issue || null);
          resetForm();
        },
      }
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Issue Parts</div>
        <div className="text-sm text-slate-600">Add one or more parts, capture job details, justification and quantities.</div>
      </div>

      {lastCreatedIssue && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-green-800">
            Issue <span className="font-semibold">{lastCreatedIssue.issueNumber}</span> created successfully.
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/spare-parts/store-issues/${lastCreatedIssue._id}/print`}
              className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
            >
              View & Print
            </Link>
            <button
              type="button"
              className="text-sm text-green-700 hover:underline"
              onClick={() => setLastCreatedIssue(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <form className="rounded-xl bg-white shadow-soft p-6 space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div className="text-sm font-semibold text-epiroc-blue">Add parts</div>
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
                  className="p-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50"
                  onClick={() => addPart(part)}
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
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Selected parts ({items.length})</div>
          {items.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center border border-dashed border-slate-200 rounded-xl">
              No parts added yet. Click a part above to add it.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left p-2">Part</th>
                    <th className="text-left p-2 w-24">Requested</th>
                    <th className="text-left p-2 w-24">Issued</th>
                    <th className="text-left p-2 w-24">To order</th>
                    <th className="text-left p-2 w-24">Returned</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const requestedNum = Number(item.quantityRequested) || 0;
                    const { autoIssued, autoToOrder } = computeAuto(item.part, requestedNum);
                    return (
                      <tr key={item.key} className="border-t border-slate-100 align-top">
                        <td className="p-2">
                          <div className="font-medium text-slate-900">{item.part.partNumber}</div>
                          <div className="text-xs text-slate-500">{item.part.partDescription}</div>
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                            type="number"
                            min="1"
                            value={item.quantityRequested}
                            onChange={(e) => updateItem(item.key, { quantityRequested: e.target.value })}
                            required
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                            type="number"
                            min="0"
                            value={item.touched ? item.quantityIssued : autoIssued}
                            onChange={(e) => updateItem(item.key, { touched: true, quantityIssued: e.target.value })}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                            type="number"
                            min="0"
                            value={item.touched ? item.quantityToOrder : autoToOrder}
                            onChange={(e) => updateItem(item.key, { touched: true, quantityToOrder: e.target.value })}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            className="w-full rounded-lg border border-slate-200 px-2 py-1"
                            type="number"
                            min="0"
                            value={item.quantityReturned}
                            onChange={(e) => updateItem(item.key, { quantityReturned: e.target.value })}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            className="text-red-500 hover:text-red-700 font-semibold"
                            onClick={() => removeItem(item.key)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-xs text-slate-500 mt-2">
                Issued and to-order are calculated automatically from stock on hand, but can be adjusted per line before submitting.
                Returned only applies if some of the issued quantity is being handed back immediately.
              </div>
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
            <div>
              <label className="text-sm font-medium text-slate-700">Risk assessment number (optional)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={riskAssessmentNumber} onChange={(e) => setRiskAssessmentNumber(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Machine area / location</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Location</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={location} onChange={(e) => setLocation(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Section</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={section} onChange={(e) => setSection(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Workplace</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={workplace} onChange={(e) => setWorkplace(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Responsible foreman</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={responsibleForeman} onChange={(e) => setResponsibleForeman(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Maintenance executed</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Date started</label>
              <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={dateStarted} onChange={(e) => setDateStarted(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Date completed</label>
              <input type="date" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={dateCompleted} onChange={(e) => setDateCompleted(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Time started</label>
              <input type="time" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={timeStarted} onChange={(e) => setTimeStarted(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Time completed</label>
              <input type="time" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={timeCompleted} onChange={(e) => setTimeCompleted(e.target.value)} />
            </div>
          </div>

          <div className="text-sm font-semibold text-epiroc-blue pt-2">Hour meter readings</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Engine</label>
              <input type="number" step="any" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={engineHours} onChange={(e) => setEngineHours(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Power pack</label>
              <input type="number" step="any" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={powerPackHours} onChange={(e) => setPowerPackHours(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Percussion 2</label>
              <input type="number" step="any" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={percussionHours} onChange={(e) => setPercussionHours(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Hour meter (extra)</label>
              <input type="number" step="any" className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={extraHours} onChange={(e) => setExtraHours(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Nature of downtime</div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={damage} onChange={(e) => setDamage(e.target.checked)} /> Damage
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={breakdown} onChange={(e) => setBreakdown(e.target.checked)} /> Break down
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={warranty} onChange={(e) => setWarranty(e.target.checked)} /> Warranty
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={inspection} onChange={(e) => setInspection(e.target.checked)} /> Inspection
            </label>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Describe/list: possible causes of failure</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={2}
              value={possibleCausesOfFailure}
              onChange={(e) => setPossibleCausesOfFailure(e.target.value)}
              placeholder="e.g. Damaged / wear and tear"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Describe/list: work performed</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              rows={2}
              value={workPerformed}
              onChange={(e) => setWorkPerformed(e.target.value)}
              placeholder="e.g. Replace sling, cct..."
            />
          </div>
        </div>

        <div className="space-y-4 border-t border-slate-100 pt-6">
          <div className="text-sm font-semibold text-epiroc-blue">Component / equipment information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Sub system</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={subSystem} onChange={(e) => setSubSystem(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Functional system</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={functionalSystem} onChange={(e) => setFunctionalSystem(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Component description</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={componentDescription} onChange={(e) => setComponentDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Component part number</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={componentPartNumber} onChange={(e) => setComponentPartNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Serial number (issued)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={serialNumberIssued} onChange={(e) => setSerialNumberIssued(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Serial number (returned)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={serialNumberReturned} onChange={(e) => setSerialNumberReturned(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-3 border-t border-slate-100 pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-epiroc-blue">Labour</div>
            <button
              type="button"
              className="text-xs font-semibold text-epiroc-blue hover:underline"
              onClick={addLaborEntry}
            >
              + Add artisan
            </button>
          </div>
          {laborEntries.length === 0 ? (
            <div className="p-3 text-sm text-slate-500 text-center border border-dashed border-slate-200 rounded-xl">
              No labour entries added.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left p-2">Clock #</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Surname</th>
                    <th className="text-left p-2">Position</th>
                    <th className="text-left p-2 w-24">Total hrs</th>
                    <th className="p-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {laborEntries.map((l) => (
                    <tr key={l.key} className="border-t border-slate-100">
                      <td className="p-2">
                        <input className="w-full rounded-lg border border-slate-200 px-2 py-1" value={l.clockNumber} onChange={(e) => updateLaborEntry(l.key, { clockNumber: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className="w-full rounded-lg border border-slate-200 px-2 py-1" value={l.name} onChange={(e) => updateLaborEntry(l.key, { name: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className="w-full rounded-lg border border-slate-200 px-2 py-1" value={l.surname} onChange={(e) => updateLaborEntry(l.key, { surname: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input className="w-full rounded-lg border border-slate-200 px-2 py-1" value={l.position} onChange={(e) => updateLaborEntry(l.key, { position: e.target.value })} />
                      </td>
                      <td className="p-2">
                        <input type="number" step="any" className="w-full rounded-lg border border-slate-200 px-2 py-1" value={l.totalHours} onChange={(e) => updateLaborEntry(l.key, { totalHours: e.target.value })} />
                      </td>
                      <td className="p-2 text-center">
                        <button type="button" className="text-red-500 hover:text-red-700 font-semibold" onClick={() => removeLaborEntry(l.key)}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
          <div className="text-sm font-semibold text-epiroc-blue">Foreman & Storeman</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Foreman name</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={foremanName} onChange={(e) => setForemanName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Foreman surname</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={foremanSurname} onChange={(e) => setForemanSurname(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Storeman name</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={storemanName} onChange={(e) => setStoremanName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Storeman surname</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={storemanSurname} onChange={(e) => setStoremanSurname(e.target.value)} />
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
