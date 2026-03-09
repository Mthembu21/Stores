import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useUsers } from '../services/users';
import { useTools, useUpdateTool } from '../services/tools';
import {
  useAssignSpecialTool,
  useDispatchSpecialTool,
  useReturnDispatch,
  useSpecialToolDispatches,
  useSpecialTools,
} from '../services/specialTools';
import { formatDateTime } from '../utils/format';

export default function SpecialToolsPage() {
  const { data: toolsData } = useTools();
  const { data: specialData, isLoading: specialLoading, isError: specialError } = useSpecialTools();
  const { data: usersData } = useUsers();
  const { data: dispatchesData } = useSpecialToolDispatches('Open');

  const updateTool = useUpdateTool();
  const assignTool = useAssignSpecialTool();
  const dispatchTool = useDispatchSpecialTool();
  const returnDispatch = useReturnDispatch();

  const allTools = toolsData?.tools || [];
  const specialTools = specialData?.tools || [];
  const users = usersData?.users || [];
  const dispatches = dispatchesData?.dispatches || [];

  const techUsers = useMemo(() => users.filter((u) => u.role !== 'Admin'), [users]);

  const [markToolId, setMarkToolId] = useState('');
  const [markToolSearch, setMarkToolSearch] = useState('');
  const [markSpecial, setMarkSpecial] = useState(true);
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const [calibrationIntervalDays, setCalibrationIntervalDays] = useState('90');
  const [inspectionEnabled, setInspectionEnabled] = useState(false);
  const [inspectionIntervalDays, setInspectionIntervalDays] = useState('365');

  const filteredMarkTools = useMemo(() => {
    const q = markToolSearch.trim().toLowerCase();
    if (!q) return allTools;
    return allTools.filter((t) => {
      const name = String(t.toolName || '').toLowerCase();
      const code = String(t.toolCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [allTools, markToolSearch]);

  const [assignToolId, setAssignToolId] = useState('');
  const [assignTechnicianId, setAssignTechnicianId] = useState('');
  const [assignDurationDays, setAssignDurationDays] = useState('365');

  const [dispatchToolId, setDispatchToolId] = useState('');
  const [dispatchType, setDispatchType] = useState('Calibration');
  const [dispatchSentAt, setDispatchSentAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [dispatchExpectedAt, setDispatchExpectedAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 16);
  });
  const [dispatchRef, setDispatchRef] = useState('');

  const [returnDispatchId, setReturnDispatchId] = useState('');
  const [returnAt, setReturnAt] = useState(() => new Date().toISOString().slice(0, 16));
  const [returnRef, setReturnRef] = useState('');

  const [recordToolId, setRecordToolId] = useState('');
  const [recordLastCalibrationAt, setRecordLastCalibrationAt] = useState('');
  const [recordLastInspectionAt, setRecordLastInspectionAt] = useState('');

  const cols = useMemo(
    () => [
      { key: 'toolName', header: 'Tool' },
      { key: 'toolCode', header: 'Code' },
      { key: 'category', header: 'Category' },
      { key: 'specialStatus', header: 'Special Status' },
      { key: 'assignedTo', header: 'Assigned To', render: (t) => t.assignedToTechnicianId?.fullName || '' },
      { key: 'assignmentEndAt', header: 'Assignment End', render: (t) => (t.assignmentEndAt ? formatDateTime(t.assignmentEndAt) : '') },
      { key: 'lastCalibrationAt', header: 'Last Cal', render: (t) => (t.lastCalibrationAt ? formatDateTime(t.lastCalibrationAt) : '') },
      { key: 'nextCalibrationDueAt', header: 'Next Cal Due', render: (t) => (t.nextCalibrationDueAt ? formatDateTime(t.nextCalibrationDueAt) : '') },
      { key: 'lastInspectionAt', header: 'Last Insp', render: (t) => (t.lastInspectionAt ? formatDateTime(t.lastInspectionAt) : '') },
      { key: 'nextInspectionDueAt', header: 'Next Insp Due', render: (t) => (t.nextInspectionDueAt ? formatDateTime(t.nextInspectionDueAt) : '') },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Special Tools</div>
        <div className="text-sm text-slate-600">Assign, dispatch and track special tools (calibration/inspection pauses assignment).</div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Record last Calibration / Inspection (backdate)</div>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            updateTool.mutate({
              id: recordToolId,
              patch: {
                lastCalibrationAt: recordLastCalibrationAt ? new Date(recordLastCalibrationAt).toISOString() : null,
                lastInspectionAt: recordLastInspectionAt ? new Date(recordLastInspectionAt).toISOString() : null,
              },
            });
          }}
        >
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tool</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={recordToolId} onChange={(e) => setRecordToolId(e.target.value)} required>
              <option value="">Select special tool…</option>
              {specialTools.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.toolName} ({t.toolCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last calibration</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={recordLastCalibrationAt} onChange={(e) => setRecordLastCalibrationAt(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Last inspection</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={recordLastInspectionAt} onChange={(e) => setRecordLastInspectionAt(e.target.value)} />
          </div>
          <div className="md:col-span-4">
            <button className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={updateTool.isPending}>
              {updateTool.isPending ? 'Saving…' : 'Save dates'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Mark tool as Special Tool</div>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!markToolId) {
              window.alert('Please select a tool from the search results');
              return;
            }
            updateTool.mutate({
              id: markToolId,
              patch: {
                isSpecialTool: markSpecial,
                calibrationEnabled,
                calibrationIntervalDays: calibrationEnabled ? Number(calibrationIntervalDays) : null,
                inspectionEnabled,
                inspectionIntervalDays: inspectionEnabled ? Number(inspectionIntervalDays) : null,
              },
            });
          }}
        >
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tool</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={markToolSearch}
              onChange={(e) => {
                const v = e.target.value;
                setMarkToolSearch(v);
                if (!v.trim()) setMarkToolId('');
              }}
              placeholder="Search tool name or code…"
            />
            {!!markToolSearch.trim() && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-slate-200">
                {filteredMarkTools.slice(0, 20).map((t) => (
                  <button
                    key={t._id}
                    type="button"
                    className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-50 ${
                      markToolId === t._id ? 'bg-slate-50' : ''
                    }`.trim()}
                    onClick={() => {
                      setMarkToolId(t._id);
                      setMarkToolSearch(`${t.toolName} (${t.toolCode})`);
                    }}
                  >
                    {t.toolName} ({t.toolCode})
                  </button>
                ))}
                {filteredMarkTools.length === 0 && (
                  <div className="px-3 py-2 text-sm text-slate-600">No matching tools</div>
                )}
              </div>
            )}
            {!!markToolId && (
              <div className="mt-2 text-xs text-slate-600">Selected</div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Special</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={markSpecial ? 'yes' : 'no'} onChange={(e) => setMarkSpecial(e.target.value === 'yes')}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Calibration enabled</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={calibrationEnabled ? 'yes' : 'no'} onChange={(e) => setCalibrationEnabled(e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Calibration interval (days)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" value={calibrationIntervalDays} onChange={(e) => setCalibrationIntervalDays(e.target.value)} disabled={!calibrationEnabled} />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Inspection enabled</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={inspectionEnabled ? 'yes' : 'no'} onChange={(e) => setInspectionEnabled(e.target.value === 'yes')}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Inspection interval (days)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" value={inspectionIntervalDays} onChange={(e) => setInspectionIntervalDays(e.target.value)} disabled={!inspectionEnabled} />
          </div>

          <div className="md:col-span-3">
            <button className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={updateTool.isPending}>
              {updateTool.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Assign Special Tool</div>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            assignTool.mutate({
              toolId: assignToolId,
              technicianId: assignTechnicianId,
              durationDays: Number(assignDurationDays),
            });
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Tool</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={assignToolId} onChange={(e) => setAssignToolId(e.target.value)} required>
              <option value="">Select special tool…</option>
              {specialTools.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.toolName} ({t.toolCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Technician</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={assignTechnicianId} onChange={(e) => setAssignTechnicianId(e.target.value)} required>
              <option value="">Select technician…</option>
              {techUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Duration (days)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" max="365" value={assignDurationDays} onChange={(e) => setAssignDurationDays(e.target.value)} required />
          </div>
          <div className="md:col-span-3">
            <button className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={assignTool.isPending}>
              {assignTool.isPending ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Dispatch for Calibration / Inspection (pauses assignment)</div>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            dispatchTool.mutate({
              toolId: dispatchToolId,
              type: dispatchType,
              sentAt: new Date(dispatchSentAt).toISOString(),
              expectedReturnAt: new Date(dispatchExpectedAt).toISOString(),
              reference: dispatchRef,
            });
          }}
        >
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tool</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={dispatchToolId} onChange={(e) => setDispatchToolId(e.target.value)} required>
              <option value="">Select special tool…</option>
              {specialTools.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.toolName} ({t.toolCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Type</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={dispatchType} onChange={(e) => setDispatchType(e.target.value)}>
              <option value="Calibration">Calibration</option>
              <option value="Inspection">Inspection</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Reference</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={dispatchRef} onChange={(e) => setDispatchRef(e.target.value)} placeholder="Certificate / Ref" />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Sent at</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={dispatchSentAt} onChange={(e) => setDispatchSentAt(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Expected return</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={dispatchExpectedAt} onChange={(e) => setDispatchExpectedAt(e.target.value)} required />
          </div>
          <div className="md:col-span-4">
            <button className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={dispatchTool.isPending}>
              {dispatchTool.isPending ? 'Dispatching…' : 'Dispatch'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Return from Calibration / Inspection (resumes assignment)</div>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            returnDispatch.mutate({
              dispatchId: returnDispatchId,
              returnedAt: new Date(returnAt).toISOString(),
              reference: returnRef,
            });
          }}
        >
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Open dispatch</label>
            <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={returnDispatchId} onChange={(e) => setReturnDispatchId(e.target.value)} required>
              <option value="">Select dispatch…</option>
              {dispatches.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.type} - {d.toolId?.toolName} ({d.toolId?.toolCode})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Returned at</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={returnAt} onChange={(e) => setReturnAt(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Reference</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={returnRef} onChange={(e) => setReturnRef(e.target.value)} placeholder="Certificate / Ref" />
          </div>
          <div className="md:col-span-4">
            <button className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={returnDispatch.isPending}>
              {returnDispatch.isPending ? 'Saving…' : 'Return dispatch'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Special tools list</div>
        {specialLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading…</div>
        ) : specialError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load special tools</div>
        ) : (
          <Table emptyLabel="No special tools" columns={cols} rows={specialTools} />
        )}
      </div>
    </div>
  );
}
