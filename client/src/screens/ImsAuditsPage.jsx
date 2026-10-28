import { Fragment, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { useImsAudits, useCreateImsAudit, useUpdateImsAudit, useDeleteImsAudit } from '../services/imsAudits';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COMPLETION_TARGET = 0.8;

// Colours and wording taken from the IMS audit programme workbook's legend.
const STATUS_META = {
  Planned: { color: '#FFC000', textColor: '#1f2937', label: 'Audit planned' },
  'Invite Sent': { color: '#FFFF00', textColor: '#1f2937', label: 'Invite sent, awaiting response' },
  Confirmed: { color: '#FF99FF', textColor: '#1f2937', label: 'Confirmed / accepted by auditee' },
  'In Progress': { color: '#00B0F0', textColor: '#0f172a', label: 'Conducted, report outstanding' },
  Completed: { color: '#92D050', textColor: '#1f2937', label: 'Audit completed' },
  Cancelled: { color: '#FF0000', textColor: '#ffffff', label: 'Postponed / cancelled' },
};
const STATUS_ORDER = Object.keys(STATUS_META);
const PRE_CONDUCT_STATUSES = new Set(['Planned', 'Invite Sent', 'Confirmed']);
const CONDUCTED_STATUSES = new Set(['In Progress', 'Completed']);
const FOCUS_AREAS_FALLBACK = ['Internal', 'Branch', 'Regional', 'Contract sites', 'Contractors', 'Suppliers', 'Compliance', 'Outsourced processes'];
const FINDING_KINDS = [
  { key: 'major', label: 'Major', short: 'Maj' },
  { key: 'minor', label: 'Minor', short: 'Min' },
  { key: 'observation', label: 'Observation', short: 'Obs' },
];

// The latest scheduled month decides where an audit stands; earlier months are
// kept as history (e.g. a postponed slot shown in red before the new one).
function currentEntry(audit) {
  const schedule = audit.schedule || [];
  return schedule.length ? schedule[schedule.length - 1] : null;
}

function currentStatus(audit) {
  return currentEntry(audit)?.status || 'Not Scheduled';
}

function isPastPlannedMonth(audit, year) {
  const entry = currentEntry(audit);
  if (!entry || !PRE_CONDUCT_STATUSES.has(entry.status)) return false;
  const now = new Date();
  if (year < now.getFullYear()) return true;
  return year === now.getFullYear() && entry.month < now.getMonth() + 1;
}

function formatDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
}

function percent(n, d) {
  return d > 0 ? `${Math.round((n / d) * 100)}%` : '–';
}

function emptyFindings() {
  return { major: { raised: 0, closed: 0 }, minor: { raised: 0, closed: 0 }, observation: { raised: 0, closed: 0 } };
}

function formFromAudit(audit, year) {
  return {
    year,
    number: audit?.number ?? '',
    focusArea: audit?.focusArea || '',
    processArea: audit?.processArea || '',
    businessArea: audit?.businessArea || '',
    responsible: audit?.responsible || '',
    auditor: audit?.auditor || '',
    auditDates: audit?.auditDates || '',
    reportSubmittedDate: audit?.reportSubmittedDate ? audit.reportSubmittedDate.slice(0, 10) : '',
    comments: audit?.comments || '',
    schedule: (audit?.schedule || []).map((s) => ({ ...s })),
    findings: {
      ...emptyFindings(),
      ...Object.fromEntries(FINDING_KINDS.map(({ key }) => [key, { ...emptyFindings()[key], ...(audit?.findings?.[key] || {}) }])),
    },
  };
}

function StatusSwatch({ status, className = '' }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-block h-3 w-3 rounded-sm border border-black/10 ${className}`.trim()}
      style={{ backgroundColor: meta?.color || '#e2e8f0' }}
    />
  );
}

function StatusBadge({ status }) {
  const meta = STATUS_META[status];
  return (
    <span
      className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap"
      style={meta ? { backgroundColor: meta.color, color: meta.textColor } : { backgroundColor: '#f1f5f9', color: '#64748b' }}
    >
      {status}
    </span>
  );
}

// Small menu for setting one month's status straight from the planning grid.
// Positioned against the viewport so the grid's horizontal scroll can't clip it.
function MonthMenu({ menu, onSelect, onClose }) {
  useEffect(() => {
    window.addEventListener('scroll', onClose, true);
    window.addEventListener('resize', onClose);
    return () => {
      window.removeEventListener('scroll', onClose, true);
      window.removeEventListener('resize', onClose);
    };
  }, [onClose]);

  const width = 230;
  const left = Math.max(8, Math.min(menu.rect.left, window.innerWidth - width - 8));
  const openUp = menu.rect.bottom + 300 > window.innerHeight;
  const style = openUp
    ? { left, width, bottom: window.innerHeight - menu.rect.top + 4 }
    : { left, width, top: menu.rect.bottom + 4 };
  const entry = menu.entry;
  const auditType = entry?.auditType || 'External';

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed z-50 rounded-xl bg-white shadow-lg border border-slate-200 p-2 text-sm" style={style}>
        <div className="px-2 pb-1 text-xs font-semibold text-slate-500">
          {MONTH_LABELS[menu.month - 1]} — {menu.processArea}
        </div>
        <div className="flex gap-1 px-2 pb-2">
          {['External', 'Internal'].map((t) => (
            <button
              key={t}
              type="button"
              className={`flex-1 rounded-lg border px-2 py-1 text-xs font-semibold ${
                auditType === t ? 'border-epiroc-gray bg-epiroc-gray text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              onClick={() => onSelect({ status: entry?.status || 'Planned', auditType: t })}
            >
              {t === 'External' ? 'E — External' : 'I — Internal'}
            </button>
          ))}
        </div>
        {STATUS_ORDER.map((status) => (
          <button
            key={status}
            type="button"
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-50 ${
              entry?.status === status ? 'font-semibold bg-slate-50' : ''
            }`}
            onClick={() => onSelect({ status, auditType })}
          >
            <StatusSwatch status={status} />
            <span>{STATUS_META[status].label}</span>
          </button>
        ))}
        {entry && (
          <button
            type="button"
            className="mt-1 w-full rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50"
            onClick={() => onSelect(null)}
          >
            Remove from {MONTH_LABELS[menu.month - 1]}
          </button>
        )}
      </div>
    </>
  );
}

function AuditForm({ initial, isNew, focusAreas, onCancel, onSubmit, onDelete, isSaving }) {
  const [form, setForm] = useState(initial);
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  function setMonth(month, patch) {
    setForm((f) => {
      const others = f.schedule.filter((s) => s.month !== month);
      if (!patch) return { ...f, schedule: others };
      const existing = f.schedule.find((s) => s.month === month) || { month, auditType: 'External', status: 'Planned' };
      return { ...f, schedule: [...others, { ...existing, ...patch }].sort((a, b) => a.month - b.month) };
    });
  }

  function setFinding(kind, field, value) {
    setForm((f) => ({
      ...f,
      findings: { ...f.findings, [kind]: { ...f.findings[kind], [field]: value === '' ? '' : Math.max(0, Number(value) || 0) } },
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      number: form.number === '' ? null : Number(form.number),
      reportSubmittedDate: form.reportSubmittedDate || null,
      findings: Object.fromEntries(
        FINDING_KINDS.map(({ key }) => [key, { raised: Number(form.findings[key].raised) || 0, closed: Number(form.findings[key].closed) || 0 }])
      ),
    });
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2';
  const labelClass = 'text-sm font-medium text-slate-700';

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
      <form onSubmit={handleSubmit} className="w-full max-w-4xl rounded-xl bg-white shadow-soft p-5 space-y-5 my-8">
        <div className="flex items-center justify-between">
          <div className="text-lg font-semibold text-epiroc-gray">{isNew ? `Add Audit — ${form.year}` : 'Edit Audit'}</div>
          <button type="button" className="text-sm text-slate-500 hover:text-slate-800" onClick={onCancel}>
            Close
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>#</label>
            <input type="number" min="1" className={inputClass} value={form.number} onChange={set('number')} placeholder="Auto" />
          </div>
          <div>
            <label className={labelClass}>Focus Area</label>
            <select className={inputClass} value={form.focusArea} onChange={set('focusArea')} required>
              <option value="">Select...</option>
              {focusAreas.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Process / Area</label>
            <input className={inputClass} value={form.processArea} onChange={set('processArea')} required />
          </div>
          <div>
            <label className={labelClass}>Business Area</label>
            <input className={inputClass} value={form.businessArea} onChange={set('businessArea')} />
          </div>
          <div>
            <label className={labelClass}>Responsible</label>
            <input className={inputClass} value={form.responsible} onChange={set('responsible')} />
          </div>
          <div>
            <label className={labelClass}>Auditor</label>
            <input className={inputClass} value={form.auditor} onChange={set('auditor')} />
          </div>
          <div>
            <label className={labelClass}>Audit Date(s)</label>
            <input className={inputClass} value={form.auditDates} onChange={set('auditDates')} placeholder="e.g. 26 - 27 May" />
          </div>
          <div>
            <label className={labelClass}>Report Submitted</label>
            <input type="date" className={inputClass} value={form.reportSubmittedDate} onChange={set('reportSubmittedDate')} />
          </div>
        </div>

        <div>
          <div className={labelClass}>Schedule</div>
          <div className="text-xs text-slate-500">
            Set a status in each month the audit is planned. When an audit is postponed, mark the old month as postponed/cancelled
            and add the new month — the latest month is the audit&apos;s current status.
          </div>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {MONTH_LABELS.map((label, i) => {
              const month = i + 1;
              const entry = form.schedule.find((s) => s.month === month);
              return (
                <div
                  key={label}
                  className="rounded-lg border border-slate-200 p-2 space-y-1"
                  style={entry ? { borderColor: STATUS_META[entry.status].color, borderWidth: 2 } : undefined}
                >
                  <div className="text-xs font-semibold text-slate-600">{label}</div>
                  <select
                    className="w-full rounded-md border border-slate-200 px-1 py-0.5 text-xs"
                    value={entry?.status || ''}
                    onChange={(e) => setMonth(month, e.target.value ? { status: e.target.value } : null)}
                  >
                    <option value="">—</option>
                    {STATUS_ORDER.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {entry && (
                    <select
                      className="w-full rounded-md border border-slate-200 px-1 py-0.5 text-xs"
                      value={entry.auditType}
                      onChange={(e) => setMonth(month, { auditType: e.target.value })}
                    >
                      <option value="External">External</option>
                      <option value="Internal">Internal</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className={labelClass}>Findings</div>
          <table className="mt-2 text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-500">
                <th className="pr-4 py-1 font-semibold" />
                <th className="pr-4 py-1 font-semibold">Raised</th>
                <th className="pr-4 py-1 font-semibold">Closed</th>
                <th className="pr-4 py-1 font-semibold">Open</th>
              </tr>
            </thead>
            <tbody>
              {FINDING_KINDS.map(({ key, label }) => {
                const raised = Number(form.findings[key].raised) || 0;
                const closed = Number(form.findings[key].closed) || 0;
                return (
                  <tr key={key}>
                    <td className="pr-4 py-1 font-medium text-slate-700">{label}</td>
                    <td className="pr-4 py-1">
                      <input
                        type="number"
                        min="0"
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1"
                        value={form.findings[key].raised}
                        onChange={(e) => setFinding(key, 'raised', e.target.value)}
                      />
                    </td>
                    <td className="pr-4 py-1">
                      <input
                        type="number"
                        min="0"
                        max={raised}
                        className="w-20 rounded-lg border border-slate-200 px-2 py-1"
                        value={form.findings[key].closed}
                        onChange={(e) => setFinding(key, 'closed', e.target.value)}
                      />
                    </td>
                    <td className={`pr-4 py-1 font-semibold ${raised - closed > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                      {Math.max(0, raised - closed)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div>
          <label className={labelClass}>Comment(s)</label>
          <textarea className={inputClass} rows={3} value={form.comments} onChange={set('comments')} placeholder="Reason for selection, rescheduling notes..." />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            >
              {isSaving ? 'Saving...' : isNew ? 'Add Audit' : 'Save Changes'}
            </button>
            <button type="button" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600" onClick={onCancel}>
              Cancel
            </button>
          </div>
          {!isNew && (
            <button type="button" className="text-sm font-semibold text-red-600 hover:underline" onClick={onDelete}>
              Remove from programme
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default function ImsAuditsPage() {
  const now = new Date();
  const thisYear = now.getFullYear();
  const [year, setYear] = useState(thisYear);
  const [search, setSearch] = useState('');
  const [focusFilter, setFocusFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState(null); // { audit } for edit, { audit: null } for add
  const [monthMenu, setMonthMenu] = useState(null);

  const { data, isLoading, isError } = useImsAudits(year);
  const audits = data?.audits || [];
  const focusAreas = data?.focusAreas || FOCUS_AREAS_FALLBACK;

  const createAudit = useCreateImsAudit();
  const updateAudit = useUpdateImsAudit();
  const deleteAudit = useDeleteImsAudit();

  const yearOptions = useMemo(() => {
    const set = new Set([...(data?.years || []), thisYear, thisYear + 1, year]);
    return Array.from(set).sort();
  }, [data?.years, thisYear, year]);

  const performance = useMemo(() => {
    const blank = () => ({ identified: 0, selected: 0, conducted: 0, upcoming: 0, cancelled: 0 });
    const rows = new Map(focusAreas.map((a) => [a, blank()]));
    const total = blank();
    audits.forEach((a) => {
      const row = rows.get(a.focusArea) || blank();
      rows.set(a.focusArea, row);
      const status = currentStatus(a);
      [row, total].forEach((r) => {
        r.identified += 1;
        if (status !== 'Not Scheduled') r.selected += 1;
        if (CONDUCTED_STATUSES.has(status)) r.conducted += 1;
        if (PRE_CONDUCT_STATUSES.has(status)) r.upcoming += 1;
        if (status === 'Cancelled') r.cancelled += 1;
      });
    });
    return { rows: Array.from(rows.entries()).filter(([, r]) => r.identified > 0), total };
  }, [audits, focusAreas]);

  const stats = useMemo(() => {
    let reportsOutstanding = 0;
    let pastPlanned = 0;
    let openFindings = 0;
    audits.forEach((a) => {
      if (currentStatus(a) === 'In Progress') reportsOutstanding += 1;
      if (isPastPlannedMonth(a, year)) pastPlanned += 1;
      FINDING_KINDS.forEach(({ key }) => {
        openFindings += Math.max(0, (a.findings?.[key]?.raised || 0) - (a.findings?.[key]?.closed || 0));
      });
    });
    return { reportsOutstanding, pastPlanned, openFindings };
  }, [audits, year]);

  const { total } = performance;
  const completionRate = total.selected > 0 ? total.conducted / total.selected : 0;
  const projectedRate = total.selected > 0 ? (total.conducted + total.upcoming) / total.selected : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return audits.filter((a) => {
      if (focusFilter && a.focusArea !== focusFilter) return false;
      if (statusFilter === 'Past Planned Month') {
        if (!isPastPlannedMonth(a, year)) return false;
      } else if (statusFilter && currentStatus(a) !== statusFilter) {
        return false;
      }
      if (q) {
        const haystack = [a.processArea, a.auditor, a.responsible, a.businessArea, a.comments].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [audits, focusFilter, statusFilter, search, year]);

  // Rows grouped under their focus area, in the programme's focus-area order.
  const groups = useMemo(() => {
    const byArea = new Map();
    filtered.forEach((a) => {
      if (!byArea.has(a.focusArea)) byArea.set(a.focusArea, []);
      byArea.get(a.focusArea).push(a);
    });
    return focusAreas.filter((a) => byArea.has(a)).map((a) => [a, byArea.get(a)]);
  }, [filtered, focusAreas]);

  function openMonthMenu(e, audit, month) {
    setMonthMenu({
      auditId: audit._id,
      processArea: audit.processArea.split('\n')[0],
      month,
      entry: (audit.schedule || []).find((s) => s.month === month) || null,
      rect: e.currentTarget.getBoundingClientRect(),
    });
  }

  function handleMonthSelect(patch) {
    const audit = audits.find((a) => a._id === monthMenu.auditId);
    if (audit) {
      const others = (audit.schedule || []).filter((s) => s.month !== monthMenu.month);
      const schedule = patch ? [...others, { month: monthMenu.month, ...patch }] : others;
      updateAudit.mutate({ id: audit._id, schedule: schedule.sort((a, b) => a.month - b.month) });
    }
    setMonthMenu(null);
  }

  function handleFormSubmit(payload) {
    const options = { onSuccess: () => setEditing(null) };
    if (editing.audit) {
      updateAudit.mutate({ id: editing.audit._id, ...payload }, options);
    } else {
      createAudit.mutate({ ...payload, year }, options);
    }
  }

  function handleDelete() {
    const audit = editing.audit;
    if (window.confirm(`Remove "${audit.processArea.split('\n')[0]}" from the ${year} programme?`)) {
      deleteAudit.mutate(audit._id, { onSuccess: () => setEditing(null) });
    }
  }

  const isCurrentYear = year === thisYear;
  const currentMonth = now.getMonth() + 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-2xl font-semibold text-epiroc-gray">IMS Audit Programme</div>
          <div className="text-sm text-slate-600">Plan the year&apos;s IMS audits and track each one through to a submitted report.</div>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm"
            value={year}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setMonthMenu(null);
            }}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                FY {y}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setEditing({ audit: null })}
            className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
          >
            + Add Audit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card title="Selected for Audit" value={`${total.selected} / ${total.identified}`} />
        <Card title="Conducted" value={`${total.conducted} (${percent(total.conducted, total.selected)})`} />
        <Card
          title={`Projected vs ${Math.round(COMPLETION_TARGET * 100)}% Target`}
          value={percent(total.conducted + total.upcoming, total.selected)}
          tone={total.selected > 0 && projectedRate < COMPLETION_TARGET ? 'danger' : 'default'}
        />
        <Card title="Reports Outstanding" value={stats.reportsOutstanding} tone={stats.reportsOutstanding > 0 ? 'warning' : 'default'} />
        <Card title="Past Planned Month" value={stats.pastPlanned} tone={stats.pastPlanned > 0 ? 'danger' : 'default'} />
        <Card title="Open Findings" value={stats.openFindings} tone={stats.openFindings > 0 ? 'warning' : 'default'} />
      </div>

      <div className="rounded-xl bg-white shadow-soft p-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-semibold text-epiroc-gray">Performance by Focus Area</div>
          <div className="text-xs text-slate-500">
            Target: complete at least {Math.round(COMPLETION_TARGET * 100)}% of planned audits for the year — currently{' '}
            <span className={`font-semibold ${completionRate >= COMPLETION_TARGET ? 'text-green-700' : 'text-slate-700'}`}>
              {percent(total.conducted, total.selected)}
            </span>{' '}
            conducted.
          </div>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left">
                <th className="px-3 py-2 font-semibold text-slate-700">Focus Area</th>
                <th className="px-3 py-2 font-semibold text-slate-700 text-right">Identified</th>
                <th className="px-3 py-2 font-semibold text-slate-700 text-right">Selected</th>
                <th className="px-3 py-2 font-semibold text-slate-700 text-right">Conducted</th>
                <th className="px-3 py-2 font-semibold text-slate-700 text-right">Upcoming</th>
                <th className="px-3 py-2 font-semibold text-slate-700 text-right">Postponed / Cancelled</th>
              </tr>
            </thead>
            <tbody>
              {performance.rows.map(([area, r]) => (
                <tr key={area} className="border-t border-slate-100">
                  <td className="px-3 py-1.5 text-slate-700">
                    <button type="button" className="hover:underline" onClick={() => setFocusFilter((f) => (f === area ? '' : area))}>
                      {area}
                    </button>
                  </td>
                  <td className="px-3 py-1.5 text-right">{r.identified}</td>
                  <td className="px-3 py-1.5 text-right">{r.selected}</td>
                  <td className="px-3 py-1.5 text-right">{r.conducted}</td>
                  <td className="px-3 py-1.5 text-right">{r.upcoming}</td>
                  <td className="px-3 py-1.5 text-right">{r.cancelled}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-semibold">
                <td className="px-3 py-1.5">Total</td>
                <td className="px-3 py-1.5 text-right">{total.identified}</td>
                <td className="px-3 py-1.5 text-right">
                  {total.selected} <span className="text-xs font-normal text-slate-500">({percent(total.selected, total.identified)})</span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  {total.conducted} <span className="text-xs font-normal text-slate-500">({percent(total.conducted, total.selected)})</span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  {total.upcoming} <span className="text-xs font-normal text-slate-500">({percent(total.upcoming, total.selected)})</span>
                </td>
                <td className="px-3 py-1.5 text-right">
                  {total.cancelled} <span className="text-xs font-normal text-slate-500">({percent(total.cancelled, total.selected)})</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-semibold text-slate-600">Search</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Process, auditor, responsible..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Focus Area</label>
          <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={focusFilter} onChange={(e) => setFocusFilter(e.target.value)}>
            <option value="">All</option>
            {focusAreas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-600">Current Status</label>
          <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All</option>
            {STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {STATUS_META[s].label}
              </option>
            ))}
            <option value="Not Scheduled">Not scheduled</option>
            <option value="Past Planned Month">Past planned month, not yet conducted</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        {STATUS_ORDER.map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <StatusSwatch status={s} /> {STATUS_META[s].label}
          </span>
        ))}
        <span className="text-slate-400">E = External · I = Internal · click a month to update it</span>
      </div>

      {isLoading ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading audit programme...</div>
      ) : isError ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load the audit programme</div>
      ) : audits.length === 0 ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">
          No audits on the FY {year} programme yet — use <span className="font-semibold">+ Add Audit</span> to start planning.
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">No audits match these filters</div>
      ) : (
        <div className="rounded-xl bg-white shadow-soft overflow-hidden">
          <div className="overflow-x-auto" style={{ maxHeight: '700px', overflowY: 'auto' }}>
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-slate-700">#</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-700 min-w-[14rem]">Process / Area</th>
                  {MONTH_LABELS.map((m, i) => (
                    <th
                      key={m}
                      className={`px-1 py-3 text-center font-semibold w-10 ${
                        isCurrentYear && i + 1 === currentMonth ? 'text-epiroc-black bg-epiroc-yellow/40' : 'text-slate-700'
                      }`}
                    >
                      {m}
                    </th>
                  ))}
                  <th className="text-left px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Status</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Audit Date(s)</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Report Submitted</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-700">Auditor</th>
                  <th className="text-left px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">Open Findings</th>
                  <th className="px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {groups.map(([area, rows]) => (
                  <Fragment key={area}>
                    <tr className="bg-slate-100">
                      <td colSpan={20} className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-epiroc-gray">
                        {area} <span className="font-normal text-slate-500">({rows.length})</span>
                      </td>
                    </tr>
                    {rows.map((a) => {
                      const status = currentStatus(a);
                      const pastPlanned = isPastPlannedMonth(a, year);
                      const openFindings = FINDING_KINDS.map(({ key, short, label }) => ({
                        short,
                        label,
                        raised: a.findings?.[key]?.raised || 0,
                        open: Math.max(0, (a.findings?.[key]?.raised || 0) - (a.findings?.[key]?.closed || 0)),
                      })).filter((f) => f.raised > 0);
                      return (
                        <tr key={a._id} className="border-t border-slate-100 align-top">
                          <td className="px-3 py-2 text-slate-500">{a.number}</td>
                          <td className="px-3 py-2 text-slate-800">
                            <div className="font-medium whitespace-pre-line">{a.processArea}</div>
                            {a.comments && <div className="mt-0.5 text-xs text-slate-500 whitespace-pre-line max-w-xs">{a.comments}</div>}
                          </td>
                          {MONTH_LABELS.map((m, i) => {
                            const month = i + 1;
                            const entry = (a.schedule || []).find((s) => s.month === month);
                            const meta = entry ? STATUS_META[entry.status] : null;
                            return (
                              <td
                                key={m}
                                className={`px-0.5 py-2 text-center ${isCurrentYear && month === currentMonth ? 'bg-epiroc-yellow/10' : ''}`}
                              >
                                <button
                                  type="button"
                                  title={entry ? `${m}: ${meta.label} (${entry.auditType})` : `Schedule in ${m}`}
                                  onClick={(e) => openMonthMenu(e, a, month)}
                                  className={`h-7 w-8 rounded-md text-xs font-bold ${
                                    entry ? 'border border-black/10' : 'border border-dashed border-transparent text-slate-300 hover:border-slate-300'
                                  }`}
                                  style={meta ? { backgroundColor: meta.color, color: meta.textColor } : undefined}
                                >
                                  {entry ? (entry.auditType === 'Internal' ? 'I' : 'E') : '+'}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 whitespace-nowrap">
                            <StatusBadge status={status} />
                            {pastPlanned && <div className="mt-1 text-xs font-semibold text-red-600">Past planned month</div>}
                          </td>
                          <td className="px-3 py-2 text-slate-700 whitespace-pre-line min-w-[7rem]">{a.auditDates || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {a.reportSubmittedDate ? (
                              <span className="text-slate-700">{formatDate(a.reportSubmittedDate)}</span>
                            ) : status === 'In Progress' ? (
                              <span className="text-xs font-semibold text-red-600">Outstanding</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{a.auditor || '—'}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {openFindings.length === 0 ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <div className="flex gap-1">
                                {openFindings.map((f) => (
                                  <span
                                    key={f.short}
                                    title={`${f.label}: ${f.open} open of ${f.raised} raised`}
                                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                      f.open > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                    }`}
                                  >
                                    {f.short} {f.open}/{f.raised}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              className="text-xs font-semibold text-epiroc-gray hover:underline"
                              onClick={() => setEditing({ audit: a })}
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {monthMenu && <MonthMenu menu={monthMenu} onSelect={handleMonthSelect} onClose={() => setMonthMenu(null)} />}

      {editing && (
        <AuditForm
          key={editing.audit?._id || 'new'}
          initial={formFromAudit(editing.audit, year)}
          isNew={!editing.audit}
          focusAreas={focusAreas}
          onCancel={() => setEditing(null)}
          onSubmit={handleFormSubmit}
          onDelete={handleDelete}
          isSaving={createAudit.isPending || updateAudit.isPending}
        />
      )}
    </div>
  );
}
