import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../components/Table';
import { useUsers } from '../services/users';
import { useTools, useUpdateTool, useDeleteTool } from '../services/tools';
import {
  useAssignSpecialTool,
  useDispatchSpecialTool,
  useReturnDispatch,
  useSpecialToolDispatches,
} from '../services/specialTools';
import { formatDateTime } from '../utils/format';

export default function SpecialToolsPage() {
  const { data: toolsData, isLoading: toolsLoading, isError: toolsError } = useTools();
  const { data: usersData } = useUsers();
  const { data: dispatchesData } = useSpecialToolDispatches('Open');

  const { mutate: updateTool } = useUpdateTool();
  const { mutate: deleteTool } = useDeleteTool();
  const { mutate: assignTool } = useAssignSpecialTool();
  const { mutate: dispatchTool } = useDispatchSpecialTool();

  const [editToolId, setEditToolId] = useState('');
  const [assignToolId, setAssignToolId] = useState('');
  const [dispatchToolId, setDispatchToolId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [editForm, setEditForm] = useState({
    toolName: '',
    toolCode: '',
    category: '',
    calibrationEnabled: true,
    inspectionEnabled: true,
    lastCalibrationAt: '',
    lastInspectionAt: '',
    calibrationDurationDays: '365',
    inspectionDurationDays: '180',
    nextCalibrationDueAt: '',
    nextInspectionDueAt: '',
  });

  const [assignForm, setAssignForm] = useState({
    technicianId: '',
    startAt: '',
    durationDays: '7',
  });

  const [dispatchForm, setDispatchForm] = useState({
    type: 'Job',
    sentAt: '',
    expectedReturnAt: '',
    reference: '',
  });

  const allTools = toolsData?.tools || [];
  const users = usersData?.users || [];
  const dispatches = dispatchesData?.dispatches || [];

  const specialTools = allTools.filter((t) => t.isSpecialTool);

  const ALERT_DAYS = 30;

  const getTechnicianName = (tool) => {
    if (tool.assignedTo?.fullName) return tool.assignedTo.fullName;
    if (tool.currentAssignment?.technician?.fullName) return tool.currentAssignment.technician.fullName;
    if (tool.technician?.fullName) return tool.technician.fullName;

    if (tool.assignedToTechnicianId && users.length > 0) {
      const techId = String(tool.assignedToTechnicianId);
      const technician = users.find((u) => String(u._id || u.id) === techId);
      return technician?.fullName || 'Assigned';
    }

    return 'Unassigned';
  };

  // Group technicians by department for better organization
  const getTechniciansByDepartment = () => {
    const nonAdminUsers = users.filter((u) => u.role !== 'Admin');
    const grouped = nonAdminUsers.reduce((acc, user) => {
      const dept = user.department || 'Unassigned';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(user);
      return acc;
    }, {});
    
    return grouped;
  };

  // Filter special tools based on search
  const filteredSpecialTools = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return specialTools.filter((t) => {
      if (!q) return true;
      const name = String(t.toolName || '').replace(/[^a-zA-Z0-9\s]/g, '').toLowerCase();
      const code = String(t.toolCode || '').toLowerCase();
      const category = String(t.category || '').toLowerCase();
      const status = String(t.specialStatus || '').toLowerCase();
      const assignedTo = getTechnicianName(t).toLowerCase();
      
      return name.includes(q) || 
             code.includes(q) || 
             category.includes(q) || 
             status.includes(q) || 
             assignedTo.includes(q);
    });
  }, [specialTools, searchQuery, users]);

  // Precompute alert info (days until calibration/inspection)
  const specialToolsWithAlerts = useMemo(() => {
    const now = Date.now();

    const daysUntil = (date) => {
      if (!date) return null;
      return Math.ceil((new Date(date).getTime() - now) / (24 * 60 * 60 * 1000));
    };

    return filteredSpecialTools.map((tool) => {
      const calDays = daysUntil(tool.nextCalibrationDueAt);
      const inspDays = daysUntil(tool.nextInspectionDueAt);

      const rowState =
        calDays < 0 || inspDays < 0
          ? 'overdue'
          : calDays <= ALERT_DAYS || inspDays <= ALERT_DAYS
          ? 'soon'
          : 'ok';

      return { ...tool, __calDays: calDays, __inspDays: inspDays, __rowState: rowState };
    });
  }, [filteredSpecialTools]);

  // Handle edit button click
  const handleEditClick = (tool) => {
    setEditToolId(tool._id);
    setEditForm({
      toolName: tool.toolName || '',
      toolCode: tool.toolCode || '',
      category: tool.category || '',
      calibrationEnabled: tool.calibrationEnabled !== false,
      inspectionEnabled: tool.inspectionEnabled !== false,
      lastCalibrationAt: tool.lastCalibrationAt ? new Date(tool.lastCalibrationAt).toISOString().split('T')[0] : '',
      lastInspectionAt: tool.lastInspectionAt ? new Date(tool.lastInspectionAt).toISOString().split('T')[0] : '',
      calibrationDurationDays: tool.calibrationDurationDays?.toString() || '365',
      inspectionDurationDays: tool.inspectionDurationDays?.toString() || '180',
      nextCalibrationDueAt: tool.nextCalibrationDueAt ? new Date(tool.nextCalibrationDueAt).toISOString().split('T')[0] : '',
      nextInspectionDueAt: tool.nextInspectionDueAt ? new Date(tool.nextInspectionDueAt).toISOString().split('T')[0] : '',
    });
  };

  // Columns array, no inline functions with changing references
  const columns = useMemo(
    () => [
      {
        key: 'toolName',
        header: 'Tool',
        render: (tool) => (
          <button 
            onClick={() => handleEditClick(tool)}
            className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2"
          >
            {tool.toolName}
          </button>
        ),
      },
      { key: 'toolCode', header: 'Code' },
      { key: 'category', header: 'Category' },
      { key: 'specialStatus', header: 'Status' },
      {
        key: 'assignedTo',
        header: 'Assigned To',
        render: (tool) => getTechnicianName(tool),
      },
      {
        key: 'lastCalibrationAt',
        header: 'Last Calibration',
        render: (tool) => (tool.lastCalibrationAt ? new Date(tool.lastCalibrationAt).toLocaleDateString() : 'Never'),
      },
      {
        key: 'nextCalibrationDueAt',
        header: 'Next Calibration',
        render: (tool) => {
          if (!tool.nextCalibrationDueAt) return 'Not Set';
          const date = new Date(tool.nextCalibrationDueAt);
          const now = new Date();
          const isOverdue = date < now;
          return (
            <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
              {date.toLocaleDateString()}
            </span>
          );
        },
      },
      {
        key: 'assignmentEndAt',
        header: 'End',
        render: (tool) => (tool.assignmentEndAt ? formatDateTime(tool.assignmentEndAt) : ''),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (tool) => (
          <div className="flex gap-2">
            <button
              onClick={() => setAssignToolId(tool._id)}
              className="rounded-lg bg-green-500 px-3 py-1 text-xs font-semibold text-white hover:bg-green-600"
            >
              Assign
            </button>
            <button
              onClick={() => setDispatchToolId(tool._id)}
              className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600"
            >
              Dispatch
            </button>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to scrap this tool? This action cannot be undone.')) {
                  deleteTool.mutate(tool._id);
                }
              }}
              className="rounded-lg bg-red-500 px-3 py-1 text-xs font-semibold text-white hover:bg-red-600"
            >
              Scrap
            </button>
          </div>
        ),
      },
    ],
    [users]
  );

  // Early returns after all hooks are called
  if (toolsLoading) return <div>Loading...</div>;
  if (toolsError || !toolsData) return <div>Error loading tools</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Special Tools</div>
        <div className="text-sm text-slate-600">Manage and track special tools with calibration alerts.</div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">All Special Tools</div>
        
        {/* Search Bar */}
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <div className="max-w-md mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search special tools by name, code, category, status, or assigned person..."
                className="w-full rounded-xl border border-slate-300 px-4 py-2 pr-10 text-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {toolsLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading special tools...</div>
        ) : toolsError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load special tools</div>
        ) : (
          <Table 
            emptyLabel="No special tools found" 
            columns={columns} 
            rows={specialToolsWithAlerts}
            getRowClassName={(tool) =>
              tool.__rowState === 'overdue'
                ? 'bg-red-100 border-2 border-red-300'
                : tool.__rowState === 'soon'
                ? 'bg-yellow-50'
                : ''
            }
            maxHeight="500px"
          />
        )}
      </div>

      {/* Edit Tool Modal */}
      {editToolId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Edit Tool</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                
                // Check if updateTool is properly initialized
                if (!updateTool || typeof updateTool.mutate !== 'function') {
                  console.error('updateTool mutation is not properly initialized');
                  toast.error('Update tool function is not available. Please refresh the page.');
                  return;
                }
                
                updateTool.mutate({
                  id: editToolId,
                  patch: editForm,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Tool Name</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editForm.toolName}
                  onChange={(e) => setEditForm({ ...editForm, toolName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Tool Code</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editForm.toolCode}
                  onChange={(e) => setEditForm({ ...editForm, toolCode: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  required
                />
              </div>

              {/* Calibration Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Calibration</h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.calibrationEnabled}
                        onChange={(e) => setEditForm({ ...editForm, calibrationEnabled: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-600">Enable</span>
                    </label>
                    {editForm.calibrationEnabled && (
                      <button
                        type="button"
                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          const nextCalibrationDueAt = (() => {
                            const lastDate = new Date(today);
                            const durationDays = parseInt(editForm.calibrationDurationDays) || 365;
                            const nextDate = new Date(lastDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                            return nextDate.toISOString().split('T')[0];
                          })();
                          setEditForm({ ...editForm, lastCalibrationAt: today, nextCalibrationDueAt });
                        }}
                      >
                        Reset Calibration
                      </button>
                    )}
                  </div>
                </div>
                
                {editForm.calibrationEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Last Calibration Date</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        value={editForm.lastCalibrationAt}
                        onChange={(e) => {
                  const newLastCalibrationAt = e.target.value;
                  const nextCalibrationDueAt = newLastCalibrationAt && editForm.calibrationEnabled
                    ? (() => {
                        const lastDate = new Date(newLastCalibrationAt);
                        const durationDays = parseInt(editForm.calibrationDurationDays) || 365;
                        const nextDate = new Date(lastDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                        return nextDate.toISOString().split('T')[0];
                      })()
                    : editForm.nextCalibrationDueAt;
                  setEditForm({ ...editForm, lastCalibrationAt: newLastCalibrationAt, nextCalibrationDueAt });
                }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Calibration Duration (days)</label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        value={editForm.calibrationDurationDays}
                        onChange={(e) => {
                  const newDurationDays = e.target.value;
                  const nextCalibrationDueAt = editForm.lastCalibrationAt && editForm.calibrationEnabled
                    ? (() => {
                        const lastDate = new Date(editForm.lastCalibrationAt);
                        const durationDays = parseInt(newDurationDays) || 365;
                        const nextDate = new Date(lastDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                        return nextDate.toISOString().split('T')[0];
                      })()
                    : editForm.nextCalibrationDueAt;
                  setEditForm({ ...editForm, calibrationDurationDays: newDurationDays, nextCalibrationDueAt });
                }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Next Calibration Due</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        value={editForm.nextCalibrationDueAt}
                        onChange={(e) => setEditForm({ ...editForm, nextCalibrationDueAt: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Inspection Section */}
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-slate-700">Inspection</h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editForm.inspectionEnabled}
                        onChange={(e) => setEditForm({ ...editForm, inspectionEnabled: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="text-sm text-slate-600">Enable</span>
                    </label>
                    {editForm.inspectionEnabled && (
                      <button
                        type="button"
                        className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600"
                        onClick={() => {
                          const today = new Date().toISOString().split('T')[0];
                          const nextInspectionDueAt = (() => {
                            const lastDate = new Date(today);
                            const durationDays = parseInt(editForm.inspectionDurationDays) || 180;
                            const nextDate = new Date(lastDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                            return nextDate.toISOString().split('T')[0];
                          })();
                          setEditForm({ ...editForm, lastInspectionAt: today, nextInspectionDueAt });
                        }}
                      >
                        Reset Inspection
                      </button>
                    )}
                  </div>
                </div>
                
                {editForm.inspectionEnabled && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Last Inspection Date</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        value={editForm.lastInspectionAt}
                        onChange={(e) => {
                  const newLastInspectionAt = e.target.value;
                  const nextInspectionDueAt = newLastInspectionAt && editForm.inspectionEnabled
                    ? (() => {
                        const lastDate = new Date(newLastInspectionAt);
                        const durationDays = parseInt(editForm.inspectionDurationDays) || 180;
                        const nextDate = new Date(lastDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                        return nextDate.toISOString().split('T')[0];
                      })()
                    : editForm.nextInspectionDueAt;
                  setEditForm({ ...editForm, lastInspectionAt: newLastInspectionAt, nextInspectionDueAt });
                }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Inspection Duration (days)</label>
                      <input
                        type="number"
                        min="1"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        value={editForm.inspectionDurationDays}
                        onChange={(e) => {
                  const newDurationDays = e.target.value;
                  const nextInspectionDueAt = editForm.lastInspectionAt && editForm.inspectionEnabled
                    ? (() => {
                        const lastDate = new Date(editForm.lastInspectionAt);
                        const durationDays = parseInt(newDurationDays) || 180;
                        const nextDate = new Date(lastDate.getTime() + (durationDays * 24 * 60 * 60 * 1000));
                        return nextDate.toISOString().split('T')[0];
                      })()
                    : editForm.nextInspectionDueAt;
                  setEditForm({ ...editForm, inspectionDurationDays: newDurationDays, nextInspectionDueAt });
                }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700">Next Inspection Due</label>
                      <input
                        type="date"
                        className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                        value={editForm.nextInspectionDueAt}
                        onChange={(e) => setEditForm({ ...editForm, nextInspectionDueAt: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black hover:brightness-95 disabled:opacity-60"
                  disabled={updateTool.isPending}
                >
                  {updateTool.isPending ? 'Updating...' : 'Update Tool'}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setEditToolId('');
                    setEditForm({
                      toolName: '',
                      toolCode: '',
                      category: '',
                      calibrationEnabled: true,
                      inspectionEnabled: true,
                      lastCalibrationAt: '',
                      lastInspectionAt: '',
                      calibrationDurationDays: '365',
                      inspectionDurationDays: '180',
                      nextCalibrationDueAt: '',
                      nextInspectionDueAt: '',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tool Modal */}
      {assignToolId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Assign Tool</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                assignTool.mutate({
                  toolId: assignToolId,
                  technicianId: assignForm.technicianId,
                  startAt: assignForm.startAt,
                  durationDays: Number(assignForm.durationDays),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Technician</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={assignForm.technicianId}
                  onChange={(e) => setAssignForm({ ...assignForm, technicianId: e.target.value })}
                  required
                >
                  <option value="">Select technician...</option>
                  {Object.entries(getTechniciansByDepartment()).map(([department, deptUsers]) => (
                    <optgroup key={department} label={department}>
                      {deptUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role})
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Start Date</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={assignForm.startAt}
                  onChange={(e) => setAssignForm({ ...assignForm, startAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={assignForm.durationDays}
                  onChange={(e) => setAssignForm({ ...assignForm, durationDays: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black hover:brightness-95 disabled:opacity-60"
                  disabled={assignTool.isPending}
                >
                  {assignTool.isPending ? 'Assigning...' : 'Assign Tool'}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setAssignToolId('');
                    setAssignForm({
                      technicianId: '',
                      startAt: '',
                      durationDays: '7',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispatch Tool Modal */}
      {dispatchToolId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Dispatch Tool</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                dispatchTool.mutate({
                  toolId: dispatchToolId,
                  type: dispatchForm.type,
                  sentAt: dispatchForm.sentAt,
                  expectedReturnAt: dispatchForm.expectedReturnAt,
                  reference: dispatchForm.reference,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700">Type</label>
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={dispatchForm.type}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, type: e.target.value })}
                  required
                >
                  <option value="Job">Job</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Calibration">Calibration</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Sent Date</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={dispatchForm.sentAt}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, sentAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Expected Return</label>
                <input
                  type="datetime-local"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={dispatchForm.expectedReturnAt}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, expectedReturnAt: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Reference/Job Number</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={dispatchForm.reference}
                  onChange={(e) => setDispatchForm({ ...dispatchForm, reference: e.target.value })}
                  placeholder="e.g. JOB-001"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black hover:brightness-95 disabled:opacity-60"
                  disabled={dispatchTool.isPending}
                >
                  {dispatchTool.isPending ? 'Dispatching...' : 'Dispatch Tool'}
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                  onClick={() => {
                    setDispatchToolId('');
                    setDispatchForm({
                      type: 'Job',
                      sentAt: '',
                      expectedReturnAt: '',
                      reference: '',
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}