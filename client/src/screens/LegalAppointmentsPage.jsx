import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '../components/Card';
import { Table } from '../components/Table';
import {
  useLegalAppointments,
  useCreateLegalAppointment,
  useUpdateLegalAppointment,
  useDeleteLegalAppointment,
} from '../services/legalAppointments';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DUE_SOON_WINDOW_DAYS = 30;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dueStatus(dueDate) {
  if (!dueDate) return 'Not Set';
  const today = startOfToday();
  const due = new Date(dueDate);
  const diffDays = Math.floor((due - today) / 86_400_000);
  if (diffDays < 0) return 'Overdue';
  if (diffDays <= DUE_SOON_WINDOW_DAYS) return 'Due Soon';
  return 'Scheduled';
}

const STATUS_BADGE = {
  Overdue: 'bg-red-100 text-red-700',
  'Due Soon': 'bg-epiroc-yellow/30 text-epiroc-black',
  Scheduled: 'bg-green-100 text-green-700',
  'Not Set': 'bg-slate-100 text-slate-500',
};

export default function LegalAppointmentsPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [search, setSearch] = useState('');
  const [appointmentTypeFilter, setAppointmentTypeFilter] = useState('');
  const [workshopAreaFilter, setWorkshopAreaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployeeMode, setNewEmployeeMode] = useState(false);
  const [addForm, setAddForm] = useState({
    employeeName: '',
    workshopArea: '',
    position: '',
    appointmentType: '',
    dueDate: '',
  });

  const { data, isLoading, isError } = useLegalAppointments({ search: search || undefined });
  const appointments = data?.appointments || [];
  const appointmentTypes = data?.appointmentTypes || [];

  const createAppointment = useCreateLegalAppointment();
  const updateAppointment = useUpdateLegalAppointment();
  const deleteAppointment = useDeleteLegalAppointment();

  const employees = useMemo(() => {
    const byName = new Map();
    appointments.forEach((a) => {
      if (!byName.has(a.employeeName)) {
        byName.set(a.employeeName, { employeeName: a.employeeName, workshopArea: a.workshopArea, position: a.position });
      }
    });
    return Array.from(byName.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  }, [appointments]);

  const workshopAreas = useMemo(() => {
    const set = new Set(appointments.map((a) => a.workshopArea).filter(Boolean));
    return Array.from(set).sort();
  }, [appointments]);

  const availableYears = useMemo(() => {
    const years = new Set([currentYear]);
    appointments.forEach((a) => {
      if (a.dueDate) years.add(new Date(a.dueDate).getFullYear());
    });
    return Array.from(years).sort();
  }, [appointments, currentYear]);

  const stats = useMemo(() => {
    let overdue = 0;
    let dueSoon = 0;
    let notSet = 0;
    appointments.forEach((a) => {
      const s = dueStatus(a.dueDate);
      if (s === 'Overdue') overdue += 1;
      else if (s === 'Due Soon') dueSoon += 1;
      else if (s === 'Not Set') notSet += 1;
    });
    return { overdue, dueSoon, notSet, total: appointments.length };
  }, [appointments]);

  const monthlyData = useMemo(() => {
    const today = startOfToday();
    const buckets = MONTH_LABELS.map((label, i) => ({ label, monthIndex: i + 1, due: 0, isPast: false }));
    appointments.forEach((a) => {
      if (!a.dueDate) return;
      const d = new Date(a.dueDate);
      if (d.getFullYear() !== year) return;
      buckets[d.getMonth()].due += 1;
    });
    buckets.forEach((b) => {
      const monthEnd = new Date(year, b.monthIndex, 0);
      b.isPast = monthEnd < today;
    });
    return buckets;
  }, [appointments, year]);

  const filteredRows = useMemo(() => {
    return appointments.filter((a) => {
      if (appointmentTypeFilter && a.appointmentType !== appointmentTypeFilter) return false;
      if (workshopAreaFilter && a.workshopArea !== workshopAreaFilter) return false;
      if (statusFilter && dueStatus(a.dueDate) !== statusFilter) return false;
      if (monthFilter) {
        if (!a.dueDate) return false;
        const d = new Date(a.dueDate);
        if (d.getFullYear() !== year || d.getMonth() + 1 !== monthFilter) return false;
      }
      return true;
    });
  }, [appointments, appointmentTypeFilter, workshopAreaFilter, statusFilter, monthFilter, year]);

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!addForm.employeeName.trim() || !addForm.appointmentType) {
      return;
    }
    createAppointment.mutate(
      {
        employeeName: addForm.employeeName.trim(),
        workshopArea: addForm.workshopArea.trim(),
        position: addForm.position.trim(),
        appointmentType: addForm.appointmentType,
        dueDate: addForm.dueDate || null,
      },
      {
        onSuccess: () => {
          setAddForm({ employeeName: '', workshopArea: '', position: '', appointmentType: '', dueDate: '' });
          setNewEmployeeMode(false);
          setShowAddForm(false);
        },
      }
    );
  }

  function handleSelectExistingEmployee(name) {
    const emp = employees.find((e) => e.employeeName === name);
    setAddForm((f) => ({
      ...f,
      employeeName: name,
      workshopArea: emp?.workshopArea || '',
      position: emp?.position || '',
    }));
  }

  const employeeAppointmentTypes = useMemo(() => {
    if (!addForm.employeeName) return appointmentTypes;
    const held = new Set(
      appointments.filter((a) => a.employeeName === addForm.employeeName).map((a) => a.appointmentType)
    );
    return appointmentTypes.filter((t) => !held.has(t));
  }, [appointmentTypes, appointments, addForm.employeeName]);

  const columns = useMemo(
    () => [
      { key: 'employeeName', header: 'Employee' },
      { key: 'workshopArea', header: 'Area' },
      { key: 'position', header: 'Position' },
      { key: 'appointmentType', header: 'Appointment' },
      {
        key: 'dueDate',
        header: 'Due Date',
        render: (a) => (
          <input
            type="date"
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
            value={a.dueDate ? a.dueDate.slice(0, 10) : ''}
            onChange={(e) => updateAppointment.mutate({ id: a._id, dueDate: e.target.value || null })}
          />
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (a) => {
          const s = dueStatus(a.dueDate);
          return (
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_BADGE[s]}`}>
              {s}
            </span>
          );
        },
      },
      {
        key: 'remove',
        header: '',
        render: (a) => (
          <button
            type="button"
            className="text-red-600 text-xs font-semibold hover:underline"
            onClick={() => {
              if (window.confirm(`Remove "${a.appointmentType}" for ${a.employeeName}?`)) {
                deleteAppointment.mutate(a._id);
              }
            }}
          >
            Remove
          </button>
        ),
      },
    ],
    [updateAppointment, deleteAppointment]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-2xl font-semibold text-epiroc-gray">Legal Appointments</div>
          <div className="text-sm text-slate-600">
            Epiroc SA Legal Appointment Matrix — track renewal due dates so nothing lapses unnoticed.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm((v) => !v)}
          className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
        >
          {showAddForm ? 'Cancel' : '+ Add Appointment'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card title="Overdue" value={stats.overdue} tone={stats.overdue > 0 ? 'danger' : 'default'} />
        <Card title={`Due Within ${DUE_SOON_WINDOW_DAYS} Days`} value={stats.dueSoon} tone={stats.dueSoon > 0 ? 'warning' : 'default'} />
        <Card title="No Due Date Set" value={stats.notSet} />
        <Card title="Total Tracked" value={stats.total} />
      </div>

      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="rounded-xl bg-white shadow-soft p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-epiroc-gray">Add Appointment</div>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <input
                type="checkbox"
                checked={newEmployeeMode}
                onChange={(e) => {
                  setNewEmployeeMode(e.target.checked);
                  setAddForm((f) => ({ ...f, employeeName: '', workshopArea: '', position: '' }));
                }}
              />
              New employee (not in the matrix yet)
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Employee</label>
              {newEmployeeMode ? (
                <input
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={addForm.employeeName}
                  onChange={(e) => setAddForm((f) => ({ ...f, employeeName: e.target.value }))}
                  required
                />
              ) : (
                <select
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                  value={addForm.employeeName}
                  onChange={(e) => handleSelectExistingEmployee(e.target.value)}
                  required
                >
                  <option value="">Select an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.employeeName} value={emp.employeeName}>
                      {emp.employeeName}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Appointment Type</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={addForm.appointmentType}
                onChange={(e) => setAddForm((f) => ({ ...f, appointmentType: e.target.value }))}
                required
              >
                <option value="">Select an appointment...</option>
                {employeeAppointmentTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Workshop Area</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={addForm.workshopArea}
                onChange={(e) => setAddForm((f) => ({ ...f, workshopArea: e.target.value }))}
                readOnly={!newEmployeeMode}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Position</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={addForm.position}
                onChange={(e) => setAddForm((f) => ({ ...f, position: e.target.value }))}
                readOnly={!newEmployeeMode}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Due Date (optional)</label>
              <input
                type="date"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={addForm.dueDate}
                onChange={(e) => setAddForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createAppointment.isPending}
            className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
          >
            {createAppointment.isPending ? 'Adding...' : 'Add'}
          </button>
        </form>
      )}

      <div className="rounded-xl bg-white shadow-soft p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-sm font-semibold text-epiroc-gray">Expiry Dates by Month</div>
            <div className="text-xs text-slate-500 flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-epiroc-yellow" /> Upcoming
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-600" /> Already passed
              </span>
            </div>
          </div>
          <select
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setMonthFilter(null);
            }}
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 16, right: 10, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(value) => [`${value} due`, undefined]}
                labelFormatter={(label) => `${label} ${year}`}
              />
              <Bar dataKey="due" radius={[4, 4, 0, 0]} cursor="pointer">
                <LabelList dataKey="due" position="top" style={{ fontSize: 11, fill: '#54565B' }} formatter={(v) => (v > 0 ? v : '')} />
                {monthlyData.map((entry) => (
                  <Cell
                    key={entry.monthIndex}
                    fill={entry.isPast ? '#DC2626' : '#FFCD00'}
                    opacity={monthFilter && monthFilter !== entry.monthIndex ? 0.4 : 1}
                    onClick={() => setMonthFilter((prev) => (prev === entry.monthIndex ? null : entry.monthIndex))}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {monthFilter && (
          <div className="mt-2 text-xs text-slate-600">
            Showing {MONTH_LABELS[monthFilter - 1]} {year} only —{' '}
            <button type="button" className="font-semibold text-epiroc-gray hover:underline" onClick={() => setMonthFilter(null)}>
              clear
            </button>
          </div>
        )}
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Search</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Employee, area, appointment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Appointment Type</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            value={appointmentTypeFilter}
            onChange={(e) => setAppointmentTypeFilter(e.target.value)}
          >
            <option value="">All</option>
            {appointmentTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Workshop Area</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            value={workshopAreaFilter}
            onChange={(e) => setWorkshopAreaFilter(e.target.value)}
          >
            <option value="">All</option>
            {workshopAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Status</label>
          <select
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="Overdue">Overdue</option>
            <option value="Due Soon">Due Soon</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Not Set">Not Set</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading legal appointments...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load legal appointments</div>
      ) : (
        <Table emptyLabel="No appointments match these filters" columns={columns} rows={filteredRows} maxHeight="600px" />
      )}
    </div>
  );
}
