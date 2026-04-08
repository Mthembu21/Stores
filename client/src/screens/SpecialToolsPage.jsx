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
  const { data: toolsData, isLoading: toolsLoading, isError: toolsError } = useTools();
  // Temporarily disable specialTools API due to connection issues
  // const { data: specialData, isLoading: specialLoading, isError: specialError } = useSpecialTools();
  const { data: usersData } = useUsers();
  const { data: dispatchesData } = useSpecialToolDispatches('Open');

  // Debug tools API
  console.log('Tools API - Loading:', toolsLoading);
  console.log('Tools API - Error:', toolsError);
  console.log('Tools API - Data:', toolsData);
  
  // Debug users API
  console.log('Users API - Data:', usersData);
  console.log('Users array length:', users.length);
  console.log('Sample users:', users.slice(0, 3));

  const updateTool = useUpdateTool();
  const assignTool = useAssignSpecialTool();
  const dispatchTool = useDispatchSpecialTool();
  const returnDispatch = useReturnDispatch();

  const allTools = toolsData?.tools || [];
  const users = usersData?.users || [];
  const dispatches = dispatchesData?.dispatches || [];
  // Use allTools filtered by special status since specialTools API is failing
  const specialTools = allTools.filter(t => t.isSpecialTool);
  const displayTools = specialTools; // Always use filtered allTools
  
  // Debug allTools to see structure
  console.log('All tools debug:', allTools);
  console.log('All tools length:', allTools.length);
  console.log('First 3 tools:', allTools.slice(0, 3));
  console.log('Special tools filtered:', allTools.filter(t => t.isSpecialTool));
  console.log('Tools with isSpecial field:', allTools.filter(t => t.isSpecial));
  console.log('Sample tool structure:', allTools[0]);
  console.log('Sample tool keys:', allTools[0] ? Object.keys(allTools[0]) : 'No tools');
  
  const techUsers = useMemo(() => users.filter((u) => u.role !== 'Admin'), [users]);

  const [markToolId, setMarkToolId] = useState('');
  const [markToolSearch, setMarkToolSearch] = useState('');
  const [markSpecial, setMarkSpecial] = useState(true);
  const [calibrationEnabled, setCalibrationEnabled] = useState(false);
  const [calibrationIntervalDays, setCalibrationIntervalDays] = useState('90');
  const [inspectionEnabled, setInspectionEnabled] = useState(false);
  const [inspectionIntervalDays, setInspectionIntervalDays] = useState('365');

  // Special tools search state
  const [specialToolsSearch, setSpecialToolsSearch] = useState('');

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

  // Historical form search state
  const [historicalSearch, setHistoricalSearch] = useState('');

  // Edit Special Tool form state
  const [editToolId, setEditToolId] = useState('');
  const [editSpecial, setEditSpecial] = useState(true);
  const [editCalibrationEnabled, setEditCalibrationEnabled] = useState(false);
  const [editCalibrationIntervalDays, setEditCalibrationIntervalDays] = useState('');
  const [editInspectionEnabled, setEditInspectionEnabled] = useState(false);
  const [editInspectionIntervalDays, setEditInspectionIntervalDays] = useState('');

  const ALERT_DAYS = 30;
  const nowMs = Date.now();

  function daysUntil(date) {
    if (!date) return null;
    const ms = new Date(date).getTime() - nowMs;
    return Math.ceil(ms / (24 * 60 * 60 * 1000));
  }

  function badge(label, tone) {
    const cls =
      tone === 'danger'
        ? 'bg-red-100 text-red-700 border-red-200'
        : tone === 'warning'
          ? 'bg-amber-100 text-amber-800 border-amber-200'
          : 'bg-slate-100 text-slate-700 border-slate-200';
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
  }

  function loadToolForEdit(toolId) {
    console.log('=== CLICK DEBUG ===');
    console.log('loadToolForEdit called with toolId:', toolId);
    console.log('Current editToolId before setting:', editToolId);
    
    // Try multiple data sources to find the tool
    const tableData = specialToolsWithAlerts;
    const allTools = toolsData?.tools || [];
    const specialTools = allTools.filter(t => t.isSpecialTool);
    
    console.log('Table data length:', tableData.length);
    console.log('All tools length:', allTools.length);
    console.log('Special tools length:', specialTools.length);
    
    // Search in table data first
    let tool = tableData.find(t => t._id === toolId);
    console.log('Found in table data:', tool);
    
    // If not found, search in special tools
    if (!tool) {
      tool = specialTools.find(t => t._id === toolId);
      console.log('Found in special tools:', tool);
    }
    
    // If still not found, search in all tools
    if (!tool) {
      tool = allTools.find(t => t._id === toolId);
      console.log('Found in all tools:', tool);
    }
    
    if (tool) {
      console.log('Setting edit form state...');
      setEditToolId(toolId);
      setEditSpecial(Boolean(tool.isSpecialTool));
      setEditCalibrationEnabled(Boolean(tool.calibrationEnabled));
      setEditCalibrationIntervalDays(tool.calibrationIntervalDays?.toString() || '');
      setEditInspectionEnabled(Boolean(tool.inspectionEnabled));
      setEditInspectionIntervalDays(tool.inspectionIntervalDays?.toString() || '');
      console.log('Edit form state set successfully');
      console.log('editToolId after setting should be:', toolId);
    } else {
      console.log('Tool not found in any data source!');
      console.log('Available tool IDs in table:', tableData.map(t => ({ name: t.toolName, _id: t._id })));
      console.log('Available tool IDs in special tools:', specialTools.map(t => ({ name: t.toolName, _id: t._id })));
      console.log('Available tool IDs in all tools:', allTools.slice(0, 5).map(t => ({ name: t.toolName, _id: t._id })));
      
      // For testing: set editToolId anyway to show modal
      console.log('Setting editToolId anyway for testing...');
      setEditToolId(toolId);
      setEditSpecial(true);
      setEditCalibrationEnabled(false);
      setEditCalibrationIntervalDays('90');
      setEditInspectionEnabled(false);
      setEditInspectionIntervalDays('365');
    }
    console.log('=== END CLICK DEBUG ===');
  }

  const specialToolsWithAlerts = useMemo(() => {
    // Use the same filtering as loadToolForEdit
    const allTools = toolsData?.tools || [];
    const specialTools = allTools.filter(t => t.isSpecialTool);
    
    console.log('specialToolsWithAlerts - allTools length:', allTools.length);
    console.log('specialToolsWithAlerts - specialTools length:', specialTools.length);
    console.log('specialToolsWithAlerts - first special tool:', specialTools[0]);
    
    const result = specialTools.map((t) => {
      const calDays = daysUntil(t.nextCalibrationDueAt);
      const inspDays = daysUntil(t.nextInspectionDueAt);

      const calState =
        calDays === null
          ? 'none'
          : calDays < 0
            ? 'overdue'
            : calDays <= ALERT_DAYS
              ? 'soon'
              : 'ok';

      const inspState =
        inspDays === null
          ? 'none'
          : inspDays < 0
            ? 'overdue'
            : inspDays <= ALERT_DAYS
              ? 'soon'
              : 'ok';

      const rowState = calState === 'overdue' || inspState === 'overdue' ? 'overdue' : calState === 'soon' || inspState === 'soon' ? 'soon' : 'ok';

      return { ...t, __calDays: calDays, __inspDays: inspDays, __rowState: rowState };
    });
    
    console.log('specialToolsWithAlerts - final result length:', result.length);
    console.log('specialToolsWithAlerts - sample result:', result[0]);
    
    return result;
  }, [toolsData, nowMs]);

  const dueSummary = useMemo(() => {
    let calOverdue = 0;
    let calSoon = 0;
    let inspOverdue = 0;
    let inspSoon = 0;
    for (const t of specialToolsWithAlerts) {
      if (t.__calDays !== null) {
        if (t.__calDays < 0) calOverdue += 1;
        else if (t.__calDays <= ALERT_DAYS) calSoon += 1;
      }
      if (t.__inspDays !== null) {
        if (t.__inspDays < 0) inspOverdue += 1;
        else if (t.__inspDays <= ALERT_DAYS) inspSoon += 1;
      }
    }
    return { calOverdue, calSoon, inspOverdue, inspSoon };
  }, [specialToolsWithAlerts]);

  const cols = useMemo(
    () => [
      { 
        key: 'toolName', 
        header: 'Tool (Click to Edit)', 
        render: (t) => (
          <button 
            onClick={() => {
              console.log('Clicked tool:', t.toolName, 'ID:', t._id);
              loadToolForEdit(t._id);
            }}
            className="text-blue-600 hover:text-blue-800 hover:underline font-medium cursor-pointer bg-transparent border-0 p-0 text-left rounded hover:bg-blue-50 px-2 py-1 -mx-2 -my-1 transition-colors"
            title={`Click to edit ${t.toolName}`}
          >
            ✏️ {t.toolName}
          </button>
        )
      },
      { key: 'toolCode', header: 'Code' },
      { key: 'category', header: 'Category' },
      { key: 'specialStatus', header: 'Special Status' },
      { key: 'assignedTo', header: 'Assigned To', render: (t) => {
          // Look up technician name from users data using the assignedToTechnicianId
          if (t.assignedToTechnicianId) {
            const technician = users.find(u => u.id === t.assignedToTechnicianId);
            if (technician) {
              return technician.fullName;
            }
          }
          
          // Fallback checks for other possible structures
          if (t.assignedTo?.fullName) {
            return t.assignedTo.fullName;
          }
          if (t.currentAssignment?.technician?.fullName) {
            return t.currentAssignment.technician.fullName;
          }
          if (t.technician?.fullName) {
            return t.technician.fullName;
          }
          
          // If no assignment, show unassigned
          return 'Unassigned';
        }},
      { key: 'assignmentEndAt', header: 'Assignment End', render: (t) => (t.assignmentEndAt ? formatDateTime(t.assignmentEndAt) : '') },
      {
        key: 'calAlert',
        header: 'Calibration',
        render: (t) => {
          if (!t.nextCalibrationDueAt) return '';
          const d = t.__calDays;
          if (d === null) return '';
          if (d < 0) return badge(`${Math.abs(d)}d overdue`, 'danger');
          if (d <= ALERT_DAYS) return badge(`${d}d left`, 'warning');
          return badge(`${d}d left`, 'neutral');
        },
      },
      { key: 'lastCalibrationAt', header: 'Last Cal', render: (t) => (t.lastCalibrationAt ? formatDateTime(t.lastCalibrationAt) : '') },
      { key: 'nextCalibrationDueAt', header: 'Next Cal Due', render: (t) => (t.nextCalibrationDueAt ? formatDateTime(t.nextCalibrationDueAt) : '') },
      {
        key: 'inspAlert',
        header: 'Inspection',
        render: (t) => {
          if (!t.nextInspectionDueAt) return '';
          const d = t.__inspDays;
          if (d === null) return '';
          if (d < 0) return badge(`${Math.abs(d)}d overdue`, 'danger');
          if (d <= ALERT_DAYS) return badge(`${d}d left`, 'warning');
          return badge(`${d}d left`, 'neutral');
        },
      },
      { key: 'lastInspectionAt', header: 'Last Insp', render: (t) => (t.lastInspectionAt ? formatDateTime(t.lastInspectionAt) : '') },
      { key: 'nextInspectionDueAt', header: 'Next Insp Due', render: (t) => (t.nextInspectionDueAt ? formatDateTime(t.nextInspectionDueAt) : '') },
    ],
    []
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Special Tools</div>
        <div className="text-sm text-slate-600">Assign, dispatch and track special tools (calibration/inspection pauses assignment).</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl bg-white shadow-soft p-4">
          <div className="text-xs font-semibold text-slate-600">Calibration overdue</div>
          <div className="mt-1 text-2xl font-semibold text-epiroc-blue">{dueSummary.calOverdue}</div>
        </div>
        <div className="rounded-xl bg-white shadow-soft p-4">
          <div className="text-xs font-semibold text-slate-600">Calibration due in {ALERT_DAYS}d</div>
          <div className="mt-1 text-2xl font-semibold text-epiroc-blue">{dueSummary.calSoon}</div>
        </div>
        <div className="rounded-xl bg-white shadow-soft p-4">
          <div className="text-xs font-semibold text-slate-600">Inspection overdue</div>
          <div className="mt-1 text-2xl font-semibold text-epiroc-blue">{dueSummary.inspOverdue}</div>
        </div>
        <div className="rounded-xl bg-white shadow-soft p-4">
          <div className="text-xs font-semibold text-slate-600">Inspection due in {ALERT_DAYS}d</div>
          <div className="mt-1 text-2xl font-semibold text-epiroc-blue">{dueSummary.inspSoon}</div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Mark tool as Special Tool</div>
        <form
          className="mt-4 max-w-4xl mx-auto space-y-4"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Inspection interval (days)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="1" value={inspectionIntervalDays} onChange={(e) => setInspectionIntervalDays(e.target.value)} disabled={!inspectionEnabled} />
          </div>

          <div className="flex justify-center">
            <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={updateTool.isPending}>
              {updateTool.isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Assign Special Tool</div>
        <form
          className="mt-4 max-w-3xl mx-auto space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            assignTool.mutate({
              toolId: assignToolId,
              technicianId: assignTechnicianId,
              durationDays: Number(assignDurationDays),
            });
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
          <div className="flex justify-center">
            <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={assignTool.isPending}>
              {assignTool.isPending ? 'Assigning…' : 'Assign'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Dispatch for Calibration / Inspection (pauses assignment)</div>
        <form
          className="mt-4 max-w-5xl mx-auto space-y-4"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Sent at</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={dispatchSentAt} onChange={(e) => setDispatchSentAt(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Expected return</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="datetime-local" value={dispatchExpectedAt} onChange={(e) => setDispatchExpectedAt(e.target.value)} required />
            </div>
          </div>

          <div className="flex justify-center">
            <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={dispatchTool.isPending}>
              {dispatchTool.isPending ? 'Dispatching…' : 'Dispatch'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Return from Calibration / Inspection (resumes assignment)</div>
        <form
          className="mt-4 max-w-5xl mx-auto space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            returnDispatch.mutate({
              dispatchId: returnDispatchId,
              returnedAt: new Date(returnAt).toISOString(),
              reference: returnRef,
            });
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          <div className="flex justify-center">
            <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={returnDispatch.isPending}>
              {returnDispatch.isPending ? 'Saving…' : 'Return dispatch'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Special tools list</div>
        {/* Special Tools Search Bar */}
        <div className="mb-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={specialToolsSearch}
                onChange={(e) => setSpecialToolsSearch(e.target.value)}
                placeholder="🔍 Search special tools by name or code..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2 pr-10 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              />
              {specialToolsSearch && (
                <button
                  onClick={() => setSpecialToolsSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Since we're using allTools filtered by special status, no loading/error state needed */}
        <Table
          emptyLabel="No special tools found"
          columns={cols}
          rows={specialToolsWithAlerts.filter(tool => {
            const searchLower = specialToolsSearch.toLowerCase();
            const nameMatch = String(tool.toolName || '').toLowerCase().includes(searchLower);
            const codeMatch = String(tool.toolCode || '').toLowerCase().includes(searchLower);
            return !specialToolsSearch || nameMatch || codeMatch;
          })}
          getRowClassName={(t) => (t.__rowState === 'overdue' ? 'bg-red-50' : t.__rowState === 'soon' ? 'bg-amber-50' : '')}
          maxHeight="520px"
        />
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Record Historical Calibration / Inspection Dates</div>
        <div className="mt-2 text-sm text-slate-600">Enter past calibration/inspection dates for tools that were serviced before being added to the system. The system will automatically calculate the next due dates.</div>
        
        {/* Historical Form Search Bar */}
        <div className="mb-4">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={historicalSearch}
                onChange={(e) => setHistoricalSearch(e.target.value)}
                placeholder="Search special tools by name or code..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2 pr-10 text-sm"
              />
              {historicalSearch && (
                <button
                  onClick={() => setHistoricalSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        <form
          className="mt-4 max-w-5xl mx-auto space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!recordToolId) {
              window.alert('Please select a tool');
              return;
            }
            if (!recordLastCalibrationAt && !recordLastInspectionAt) {
              window.alert('Please enter at least one calibration or inspection date');
              return;
            }
            updateTool.mutate({
              id: recordToolId,
              patch: {
                lastCalibrationAt: recordLastCalibrationAt ? new Date(recordLastCalibrationAt).toISOString() : null,
                lastInspectionAt: recordLastInspectionAt ? new Date(recordLastInspectionAt).toISOString() : null,
              },
            });
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Tool</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={recordToolId} onChange={(e) => {
                setRecordToolId(e.target.value);
                // Reset dates when tool changes
                setRecordLastCalibrationAt('');
                setRecordLastInspectionAt('');
              }} required>
                <option value="">Select special tool…</option>
                {specialTools.filter(tool => {
                  const searchLower = historicalSearch.toLowerCase();
                  const nameMatch = String(tool.toolName || '').toLowerCase().includes(searchLower);
                  const codeMatch = String(tool.toolCode || '').toLowerCase().includes(searchLower);
                  return !historicalSearch || nameMatch || codeMatch;
                }).map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.toolName} ({t.toolCode}) 
                    {t.calibrationEnabled && ` • Cal: ${t.calibrationIntervalDays}d`}
                    {t.inspectionEnabled && ` • Insp: ${t.inspectionIntervalDays}d`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Last Calibration Date</label>
              <input 
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                type="datetime-local" 
                value={recordLastCalibrationAt} 
                onChange={(e) => setRecordLastCalibrationAt(e.target.value)}
                max={new Date().toISOString().slice(0, 16)}
              />
              {recordToolId && (() => {
                const tool = specialTools.find(t => t._id === recordToolId);
                return tool?.calibrationEnabled ? (
                  <div className="mt-1 text-xs text-slate-600">
                    Interval: {tool.calibrationIntervalDays} days
                    {recordLastCalibrationAt && (
                      <span className="block text-blue-600 font-medium">
                        Next due: {new Date(new Date(recordLastCalibrationAt).getTime() + tool.calibrationIntervalDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600">Calibration not enabled for this tool</div>
                );
              })()}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Last Inspection Date</label>
              <input 
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                type="datetime-local" 
                value={recordLastInspectionAt} 
                onChange={(e) => setRecordLastInspectionAt(e.target.value)}
                max={new Date().toISOString().slice(0, 16)}
              />
              {recordToolId && (() => {
                const tool = specialTools.find(t => t._id === recordToolId);
                return tool?.inspectionEnabled ? (
                  <div className="mt-1 text-xs text-slate-600">
                    Interval: {tool.inspectionIntervalDays} days
                    {recordLastInspectionAt && (
                      <span className="block text-blue-600 font-medium">
                        Next due: {new Date(new Date(recordLastInspectionAt).getTime() + tool.inspectionIntervalDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600">Inspection not enabled for this tool</div>
                );
              })()}
            </div>
          </div>

          <div className="flex justify-center">
            <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={updateTool.isPending}>
              {updateTool.isPending ? 'Saving…' : 'Save Historical Dates'}
            </button>
          </div>
        </form>
      </div>

      {/* Edit Special Tool Settings Modal - Only shows when tool is clicked */}
      {(() => {
        console.log('=== MODAL DEBUG ===');
        console.log('Checking if modal should show...');
        console.log('editToolId value:', editToolId);
        console.log('editToolId type:', typeof editToolId);
        console.log('Should modal show?', !!editToolId);
        console.log('=== END MODAL DEBUG ===');
        return editToolId;
      })() && (
        <>
          {console.log('Modal showing because editToolId is set to:', editToolId)}
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-soft p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-semibold text-epiroc-blue">Edit Special Tool Settings</div>
                <button 
                  onClick={() => {
                    console.log('Closing modal via X button');
                    setEditToolId('');
                    setEditSpecial(true);
                    setEditCalibrationEnabled(false);
                    setEditCalibrationIntervalDays('');
                    setEditInspectionEnabled(false);
                    setEditInspectionIntervalDays('');
                  }}
                  className="text-slate-400 hover:text-slate-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
            
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-sm font-medium text-blue-800 mb-2">
                Currently editing: {specialTools.find(t => t._id === editToolId)?.toolName} ({specialTools.find(t => t._id === editToolId)?.toolCode})
              </div>
              <div className="text-xs text-blue-600">
                Modify the settings below and click "Update Tool Settings" to save changes
              </div>
            </div>

            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!editToolId) {
                  window.alert('Please click on a tool name in table above to load it for editing');
                  return;
                }
                
                // Validate calibration interval if enabled
                if (editCalibrationEnabled && (!editCalibrationIntervalDays || Number(editCalibrationIntervalDays) < 1)) {
                  window.alert('Please enter a valid calibration interval (minimum 1 day)');
                  return;
                }
                
                // Validate inspection interval if enabled
                if (editInspectionEnabled && (!editInspectionIntervalDays || Number(editInspectionIntervalDays) < 1)) {
                  window.alert('Please enter a valid inspection interval (minimum 1 day)');
                  return;
                }
                
                updateTool.mutate({
                  id: editToolId,
                  patch: {
                    isSpecialTool: editSpecial,
                    calibrationEnabled: editCalibrationEnabled,
                    calibrationIntervalDays: editCalibrationEnabled ? Number(editCalibrationIntervalDays) : null,
                    inspectionEnabled: editInspectionEnabled,
                    inspectionIntervalDays: editInspectionEnabled ? Number(editInspectionIntervalDays) : null,
                  },
                  onSuccess: () => {
                    // Close modal after successful update
                    console.log('Closing modal after successful update');
                    setEditToolId('');
                    setEditSpecial(true);
                    setEditCalibrationEnabled(false);
                    setEditCalibrationIntervalDays('');
                    setEditInspectionEnabled(false);
                    setEditInspectionIntervalDays('');
                  }
                });
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Special Tool Status</label>
                  <select 
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                    value={editSpecial ? 'yes' : 'no'} 
                    onChange={(e) => setEditSpecial(e.target.value === 'yes')}
                  >
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Calibration enabled</label>
                  <select 
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                    value={editCalibrationEnabled ? 'yes' : 'no'} 
                    onChange={(e) => setEditCalibrationEnabled(e.target.value === 'yes')}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Calibration interval (days)</label>
                  <input 
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                    type="number" 
                    min="1" 
                    value={editCalibrationIntervalDays} 
                    onChange={(e) => setEditCalibrationIntervalDays(e.target.value)} 
                    disabled={!editCalibrationEnabled} 
                    placeholder="e.g., 20, 30, 90"
                  />
                  {editCalibrationEnabled && editCalibrationIntervalDays && (
                    <div className="mt-1 text-xs text-blue-600">
                      Calibration reminder every {editCalibrationIntervalDays} days
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Inspection enabled</label>
                  <select 
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                    value={editInspectionEnabled ? 'yes' : 'no'} 
                    onChange={(e) => setEditInspectionEnabled(e.target.value === 'yes')}
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Inspection interval (days)</label>
                <input 
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" 
                  type="number" 
                  min="1" 
                  value={editInspectionIntervalDays} 
                  onChange={(e) => setEditInspectionIntervalDays(e.target.value)} 
                  disabled={!editInspectionEnabled} 
                  placeholder="e.g., 30, 60, 365"
                />
                {editInspectionEnabled && editInspectionIntervalDays && (
                  <div className="mt-1 text-xs text-blue-600">
                    Inspection reminder every {editInspectionIntervalDays} days
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-4">
                <button 
                  className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" 
                  type="submit" 
                  disabled={updateTool.isPending}
                >
                  {updateTool.isPending ? 'Updating...' : 'Update Tool Settings'}
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    console.log('Closing modal via Cancel button');
                    setEditToolId('');
                    setEditSpecial(true);
                    setEditCalibrationEnabled(false);
                    setEditCalibrationIntervalDays('');
                    setEditInspectionEnabled(false);
                    setEditInspectionIntervalDays('');
                  }}
                  className="rounded-xl bg-slate-200 px-6 py-2 font-semibold text-slate-700 hover:bg-slate-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
        </>
      )}
      
      {/* Temporary debug button - remove this after testing */}
      <div className="fixed bottom-4 right-4 z-40">
        <button 
          onClick={() => {
            console.log('Manually clearing editToolId, was:', editToolId);
            setEditToolId('');
          }}
          className="bg-red-500 text-white px-3 py-1 rounded text-sm"
        >
          Clear Modal (Debug)
        </button>
      </div>
    </div>
  );
}
