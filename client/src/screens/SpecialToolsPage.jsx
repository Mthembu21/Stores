import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useUsers } from '../services/users';
import { useTools, useUpdateTool } from '../services/tools';
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

  const [editToolId, setEditToolId] = useState('');

  const allTools = toolsData?.tools || [];
  const users = usersData?.users || [];
  const dispatches = dispatchesData?.dispatches || [];

  const specialTools = allTools.filter(t => t.isSpecialTool);

  const ALERT_DAYS = 30;

  const getTechnicianName = (tool) => {
    if (tool.assignedTo?.fullName) return tool.assignedTo.fullName;
    if (tool.currentAssignment?.technician?.fullName) return tool.currentAssignment.technician.fullName;
    if (tool.technician?.fullName) return tool.technician.fullName;

    if (tool.assignedToTechnicianId && users.length > 0) {
      const techId = String(tool.assignedToTechnicianId);
      const technician = users.find(u => String(u._id || u.id) === techId);
      return technician?.fullName || 'Assigned';
    }

    return 'Unassigned';
  };

  // Precompute alert info (days until calibration/inspection)
  const specialToolsWithAlerts = useMemo(() => {
    const now = Date.now();

    const daysUntil = (date) => {
      if (!date) return null;
      return Math.ceil((new Date(date).getTime() - now) / (24 * 60 * 60 * 1000));
    };

    return specialTools.map(tool => {
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
  }, [specialTools]);

  // Columns array, no inline functions with changing references
  const columns = useMemo(() => [
    {
      key: 'toolName',
      header: 'Tool',
      render: (tool) => <button onClick={() => setEditToolId(tool._id)}>?? {tool.toolName}</button>,
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
      key: 'assignmentEndAt',
      header: 'End',
      render: (tool) => (tool.assignmentEndAt ? formatDateTime(tool.assignmentEndAt) : ''),
    },
  ], [users]); // ? safe: only users array dependency

  // Early returns after all hooks are called
  if (toolsLoading) return <div>Loading...</div>;
  if (toolsError || !toolsData) return <div>Error loading tools</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-semibold">Special Tools</h1>

      <Table
        columns={columns}
        rows={specialToolsWithAlerts}
        getRowClassName={(tool) =>
          tool.__rowState === 'overdue'
            ? 'bg-red-50'
            : tool.__rowState === 'soon'
            ? 'bg-yellow-50'
            : ''
        }
      />

      {editToolId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl">
            <h2>Edit Tool</h2>
            <button onClick={() => setEditToolId('')}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}