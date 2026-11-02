import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useStoreIssues } from '../services/storeIssues';
import { useCreatePartReturn, RETURN_CONDITIONS } from '../services/partReturns';
import { usePartsPeople, useCreatePartsPerson } from '../services/partsPeople';
import { useMe } from '../services/auth';
import { formatDateTime } from '../utils/format';

function outstandingOf(item) {
  return (item.quantityIssued || 0) - (item.quantityReturned || 0);
}

// "Return parts" tab of the Issue Parts page: books previously issued parts back in
// against their original issue slip, one slip per return.
export function ReturnPartsForm() {
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isError } = useStoreIssues({ search: search || undefined });
  const issuesWithOutstanding = useMemo(
    () => (data?.issues || []).filter((i) => (i.items || []).some((item) => outstandingOf(item) > 0)),
    [data]
  );

  const { data: requestorsData } = usePartsPeople('Requestor');
  const requestors = requestorsData?.people || [];
  const createPartsPerson = useCreatePartsPerson();
  const { data: meData } = useMe();
  const me = meData?.user;

  const [selectedIssue, setSelectedIssue] = useState(null);
  // itemId -> { quantity, condition, serialNumber }
  const [lines, setLines] = useState({});
  const [reason, setReason] = useState('');
  const [selectedRequestorId, setSelectedRequestorId] = useState('');
  const [showAddRequestor, setShowAddRequestor] = useState(false);
  const [newRequestorName, setNewRequestorName] = useState('');
  const [newRequestorZNumber, setNewRequestorZNumber] = useState('');
  const [lastReturn, setLastReturn] = useState(null);

  const createReturn = useCreatePartReturn();
  // Same double-click guard as Create issue: a ref, because a second click can fire
  // before the disabled state re-renders.
  const submittingRef = useRef(false);

  const selectedRequestor = requestors.find((p) => p._id === selectedRequestorId) || null;

  function selectIssue(issue) {
    setSelectedIssue(issue);
    setLines({});
  }

  function updateLine(itemId, patch) {
    setLines((prev) => ({ ...prev, [itemId]: { quantity: '', condition: '', serialNumber: '', ...prev[itemId], ...patch } }));
  }

  function handleAddRequestor() {
    if (!newRequestorName.trim() || !newRequestorZNumber.trim()) {
      toast.error('Provide both a name and a Z number');
      return;
    }
    createPartsPerson.mutate(
      { name: newRequestorName.trim(), zNumber: newRequestorZNumber.trim(), role: 'Requestor' },
      {
        onSuccess: (res) => {
          if (res?.person) setSelectedRequestorId(res.person._id);
          setNewRequestorName('');
          setNewRequestorZNumber('');
          setShowAddRequestor(false);
        },
      }
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (submittingRef.current) return;
    if (!selectedIssue) {
      toast.error('Select an issue slip first');
      return;
    }

    const payloadItems = [];
    for (const item of selectedIssue.items || []) {
      const line = lines[item._id];
      const qty = Number(line?.quantity) || 0;
      if (qty <= 0) continue;
      const outstanding = outstandingOf(item);
      if (!Number.isInteger(qty) || qty > outstanding) {
        toast.error(`Enter a whole number between 1 and ${outstanding} for ${item.partNumber}`);
        return;
      }
      if (!line.condition) {
        toast.error(`Select the condition for ${item.partNumber}`);
        return;
      }
      payloadItems.push({ itemId: item._id, quantity: qty, condition: line.condition, serialNumber: line.serialNumber });
    }

    if (payloadItems.length === 0) {
      toast.error('Enter a return quantity for at least one part');
      return;
    }
    if (!reason.trim()) {
      toast.error('Provide a reason for the return');
      return;
    }
    if (!selectedRequestor) {
      toast.error('Select who is returning the parts');
      return;
    }

    submittingRef.current = true;
    createReturn.mutate(
      {
        storeIssueId: selectedIssue._id,
        items: payloadItems,
        reason: reason.trim(),
        returnedByName: selectedRequestor.name,
        returnedByZNumber: selectedRequestor.zNumber,
      },
      {
        onSuccess: (res) => {
          setLastReturn(res?.partReturn ? { ...res.partReturn, storeIssueId: selectedIssue._id } : null);
          setSelectedIssue(null);
          setLines({});
          setReason('');
          setSelectedRequestorId('');
        },
        onSettled: () => {
          submittingRef.current = false;
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {lastReturn && (
        <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm text-green-800">
            Return <span className="font-semibold">{lastReturn.returnNumber}</span> recorded against{' '}
            <span className="font-semibold">{lastReturn.issueNumber}</span>.
          </div>
          <div className="flex items-center gap-3">
            <Link
              to={`/spare-parts/returns/${lastReturn._id}/print`}
              className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
            >
              View & Print return slip
            </Link>
            <Link to={`/spare-parts/store-issues/${lastReturn.storeIssueId}/print`} className="text-sm text-green-700 hover:underline">
              View issue slip
            </Link>
            <button type="button" className="text-sm text-green-700 hover:underline" onClick={() => setLastReturn(null)}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-3">
        <div className="text-sm font-semibold text-epiroc-gray">Find the issue slip</div>
        <input
          className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by issue #, machine #, service order or part #..."
        />
        {isLoading ? (
          <div className="text-sm text-slate-600">Loading...</div>
        ) : isError ? (
          <div className="text-sm text-slate-600">Could not load store issues</div>
        ) : (
          <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl">
            {issuesWithOutstanding.length === 0 ? (
              <div className="p-4 text-sm text-slate-500 text-center">
                {search ? 'No issue slips with parts still out match this search' : 'No parts issued out'}
              </div>
            ) : (
              issuesWithOutstanding.map((issue) => {
                const outCount = (issue.items || []).reduce((sum, item) => sum + Math.max(0, outstandingOf(item)), 0);
                return (
                  <div
                    key={issue._id}
                    className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-blue-50 ${
                      selectedIssue?._id === issue._id ? 'bg-blue-100' : ''
                    }`}
                    onClick={() => selectIssue(issue)}
                  >
                    <div className="flex justify-between items-start gap-3">
                      <div>
                        <div className="font-medium text-slate-900">
                          {issue.issueNumber}
                          {issue.machineNumber ? ` · Machine ${issue.machineNumber}` : ''}
                          {issue.serviceOrderNumber ? ` · SO ${issue.serviceOrderNumber}` : ''}
                        </div>
                        <div className="text-xs text-slate-600">
                          Issued {formatDateTime(issue.issueDate)} to {issue.requestorName}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-epiroc-gray whitespace-nowrap">{outCount} still out</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedIssue && (
        <form className="rounded-xl bg-white shadow-soft p-6 space-y-6" onSubmit={handleSubmit}>
          <div>
            <div className="text-sm font-semibold text-epiroc-gray">Return against {selectedIssue.issueNumber}</div>
            <div className="text-xs text-slate-600">
              {[selectedIssue.machineNumber && `Machine ${selectedIssue.machineNumber}`, selectedIssue.machineType, selectedIssue.serviceOrderNumber && `SO ${selectedIssue.serviceOrderNumber}`]
                .filter(Boolean)
                .join(' · ')}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-500 uppercase">
                  <th className="py-2 pr-3">Part</th>
                  <th className="py-2 pr-3">Issued</th>
                  <th className="py-2 pr-3">Returned</th>
                  <th className="py-2 pr-3">Still out</th>
                  <th className="py-2 pr-3">Return qty</th>
                  <th className="py-2 pr-3">Condition</th>
                  <th className="py-2">Serial # (optional)</th>
                </tr>
              </thead>
              <tbody>
                {(selectedIssue.items || []).map((item) => {
                  const outstanding = outstandingOf(item);
                  const line = lines[item._id] || {};
                  const disabled = outstanding <= 0;
                  return (
                    <tr key={item._id} className="border-t border-slate-100 align-top">
                      <td className="py-2 pr-3">
                        <div className="font-medium text-slate-900">{item.partNumber}</div>
                        <div className="text-xs text-slate-600">{item.partDescription}</div>
                      </td>
                      <td className="py-2 pr-3">{item.quantityIssued}</td>
                      <td className="py-2 pr-3">{item.quantityReturned}</td>
                      <td className="py-2 pr-3 font-semibold">{outstanding}</td>
                      <td className="py-2 pr-3">
                        <input
                          type="number"
                          min="0"
                          max={outstanding}
                          step="1"
                          className="w-20 rounded-xl border border-slate-200 px-2 py-1 disabled:bg-slate-50"
                          value={line.quantity ?? ''}
                          onChange={(e) => updateLine(item._id, { quantity: e.target.value })}
                          disabled={disabled}
                        />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          className="rounded-xl border border-slate-200 px-2 py-1 disabled:bg-slate-50"
                          value={line.condition ?? ''}
                          onChange={(e) => updateLine(item._id, { condition: e.target.value })}
                          disabled={disabled}
                        >
                          <option value="">Select...</option>
                          {RETURN_CONDITIONS.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <input
                          className="w-36 rounded-xl border border-slate-200 px-2 py-1 disabled:bg-slate-50"
                          value={line.serialNumber ?? ''}
                          onChange={(e) => updateLine(item._id, { serialNumber: e.target.value })}
                          disabled={disabled}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="mt-2 text-xs text-slate-500">
              Good goes back into bookable stock. Damaged and Faulty are counted as in the store but can't be issued.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Reason for return</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Not used on job, wrong part, faulty on fitment"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Returned by</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={selectedRequestorId}
                onChange={(e) => setSelectedRequestorId(e.target.value)}
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
            <div>
              <label className="text-sm font-medium text-slate-700">Received by (you)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 bg-slate-50" value={me?.fullName || ''} readOnly />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              disabled={createReturn.isPending}
            >
              {createReturn.isPending ? 'Recording return, please wait...' : 'Record return'}
            </button>
          </div>
          {createReturn.isPending && (
            <div className="text-center text-sm text-slate-600">
              Please wait, the return is being recorded. Do not click again or leave this page.
            </div>
          )}
        </form>
      )}
    </div>
  );
}
