import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  todayIso,
  useDaaKpiDefinitions,
  useDaaKpiEntries,
  useSaveDaaKpiEntries,
  describeTarget,
  formatKpiValue,
} from '../services/daaKpis';

function monthLabel(day) {
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

function entryToForm(def, entry) {
  return {
    numerator: entry?.numerator ?? '',
    denominator: entry?.denominator ?? '',
    count: entry?.count ?? '',
    value: entry?.value ?? '',
    checks: def.captureType === 'checklist' ? def.checklistItems.map((_, i) => entry?.checks?.[i] ?? null) : [],
    comment: entry?.comment ?? '',
  };
}

// The day's figure for this one KPI, as it would score — shown live while typing.
function previewScore(def, f) {
  if (def.captureType === 'ratio') {
    const n = Number(f.numerator);
    const d = Number(f.denominator);
    if (f.numerator === '' || f.denominator === '' || !(d > 0) || n > d) return null;
    return Math.round((n / d) * 1000) / 10;
  }
  if (def.captureType === 'checklist') {
    const answered = f.checks.filter((c) => c !== null);
    if (answered.length === 0) return null;
    return Math.round((answered.filter(Boolean).length / answered.length) * 1000) / 10;
  }
  if (def.captureType === 'value') return f.value === '' ? null : Number(f.value);
  return null;
}

function meetsTarget(def, score) {
  if (score === null || def.target === null || def.target === undefined) return null;
  return def.targetDirection === 'max' ? score <= def.target : score >= def.target;
}

function StatusPill({ met }) {
  if (met === null) return null;
  return met ? (
    <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">✓ On target</span>
  ) : (
    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">✗ Below target</span>
  );
}

const inputClass = 'mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm';

function KpiCard({ def, form, entry, onChange }) {
  const score = previewScore(def, form);
  const met = meetsTarget(def, score);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{def.label}</div>
          <div className="text-xs text-slate-500">
            {[def.responsible, `Target ${describeTarget(def)}`].filter(Boolean).join(' · ')}
          </div>
          {def.description && <div className="text-xs text-slate-500">{def.description}</div>}
        </div>
        <div className="text-right space-y-1 shrink-0">
          {score !== null && <div className="text-lg font-semibold text-slate-900">{formatKpiValue(def, score)}</div>}
          <StatusPill met={met} />
        </div>
      </div>

      {def.captureType === 'ratio' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-700">{def.numeratorLabel}</label>
            <input type="number" min="0" step="1" className={inputClass} value={form.numerator} onChange={(e) => onChange({ numerator: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-700">{def.denominatorLabel}</label>
            <input type="number" min="0" step="1" className={inputClass} value={form.denominator} onChange={(e) => onChange({ denominator: e.target.value })} />
          </div>
        </div>
      )}

      {(def.captureType === 'count' || def.captureType === 'progress') && (
        <div>
          <label className="text-xs font-medium text-slate-700">{def.numeratorLabel || 'Count'}</label>
          <input type="number" min="0" step="1" className={inputClass} value={form.count} onChange={(e) => onChange({ count: e.target.value })} />
        </div>
      )}

      {def.captureType === 'value' && (
        <div>
          <label className="text-xs font-medium text-slate-700">{def.numeratorLabel || 'Value'}</label>
          <input type="number" step="any" className={inputClass} value={form.value} onChange={(e) => onChange({ value: e.target.value })} />
        </div>
      )}

      {def.captureType === 'checklist' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {def.checklistItems.map((item, i) => (
            <div key={item} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
              <span className="text-sm text-slate-700">{item}</span>
              <div className="flex gap-1">
                {[
                  { v: true, label: 'Yes', on: 'bg-green-600 text-white border-green-600' },
                  { v: false, label: 'No', on: 'bg-red-600 text-white border-red-600' },
                ].map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    className={`rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${
                      form.checks[i] === opt.v ? opt.on : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                    onClick={() => {
                      const checks = [...form.checks];
                      checks[i] = checks[i] === opt.v ? null : opt.v;
                      onChange({ checks });
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div>
        <label className="text-xs font-medium text-slate-700">Comment / action (optional)</label>
        <input className={inputClass} value={form.comment} onChange={(e) => onChange({ comment: e.target.value })} />
      </div>

      {entry?.capturedByName && (
        <div className="text-xs text-slate-400">
          Last captured by {entry.capturedByName} · {new Date(entry.updatedAt).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default function DaaCapturePage() {
  const [day, setDay] = useState(todayIso());
  const { data: defsData, isLoading: defsLoading } = useDaaKpiDefinitions();
  const definitions = useMemo(() => (defsData?.definitions || []).filter((d) => d.active), [defsData]);
  const { data: entriesData, isLoading: entriesLoading } = useDaaKpiEntries(day);
  const saveEntries = useSaveDaaKpiEntries();
  const savingRef = useRef(false);

  const monthDay = `${day.slice(0, 7)}-01`;
  const entriesByKey = useMemo(() => {
    const map = new Map();
    for (const e of entriesData?.entries || []) map.set(e.kpiKey, e);
    return map;
  }, [entriesData]);
  // Monthly KPIs' entries live on the 1st; daily ones on the day itself.
  const entryFor = (def) => {
    const e = entriesByKey.get(def.key);
    if (!e) return null;
    return e.day === (def.frequency === 'monthly' ? monthDay : day) ? e : null;
  };

  const [forms, setForms] = useState({});
  const [dirty, setDirty] = useState(() => new Set());
  const loadedFor = useRef(null);

  // Load the saved figures once per day (and after saving) — not on every background
  // refetch, which would wipe out what the clerk is typing.
  useEffect(() => {
    if (!entriesData || definitions.length === 0 || loadedFor.current === day) return;
    const next = {};
    for (const def of definitions) next[def.key] = entryToForm(def, entryFor(def));
    setForms(next);
    setDirty(new Set());
    loadedFor.current = day;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entriesData, definitions, day]);

  function updateForm(key, patch) {
    setForms((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));
    setDirty((prev) => new Set(prev).add(key));
  }

  function handleDayChange(next) {
    if (dirty.size > 0 && !window.confirm('You have unsaved changes. Switch day and discard them?')) return;
    loadedFor.current = null;
    setDay(next);
  }

  function handleSave(e) {
    e.preventDefault();
    if (savingRef.current) return;
    if (dirty.size === 0) {
      toast('Nothing has changed');
      return;
    }

    const payload = [];
    for (const key of dirty) {
      const def = definitions.find((d) => d.key === key);
      const f = forms[key];
      if (!def || !f) continue;
      if (def.captureType === 'ratio' && (f.numerator === '') !== (f.denominator === '')) {
        toast.error(`${def.label}: fill in both numbers`);
        return;
      }
      if (def.captureType === 'ratio' && f.numerator !== '' && Number(f.numerator) > Number(f.denominator)) {
        toast.error(`${def.label}: ${f.numerator} can't be more than ${f.denominator}`);
        return;
      }
      const answered = f.checks.filter((c) => c !== null).length;
      if (def.captureType === 'checklist' && answered > 0 && answered < f.checks.length) {
        toast.error(`${def.label}: answer every item, or clear them all`);
        return;
      }
      payload.push({
        kpiKey: key,
        numerator: f.numerator,
        denominator: f.denominator,
        count: f.count,
        value: f.value,
        checks: answered > 0 ? f.checks : [],
        comment: f.comment,
      });
    }

    savingRef.current = true;
    saveEntries.mutate(
      { day, entries: payload },
      {
        onSuccess: () => {
          loadedFor.current = null; // reload what was saved, including who captured it
          setDirty(new Set());
        },
        onSettled: () => {
          savingRef.current = false;
        },
      }
    );
  }

  const daily = definitions.filter((d) => d.frequency === 'daily');
  const monthly = definitions.filter((d) => d.frequency === 'monthly');
  const loading = defsLoading || entriesLoading || loadedFor.current !== day;
  const isToday = day === todayIso();

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-2xl font-semibold text-epiroc-gray">DAA Warehouse — Daily KPIs</div>
          <div className="text-sm text-slate-600">
            Capture today's figures. Percentages, weekly, monthly and quarterly results are worked out automatically.
          </div>
        </div>
        <Link
          to="/daa/dashboard"
          className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
        >
          KPI Dashboard
        </Link>
      </div>

      <form className="space-y-6" onSubmit={handleSave}>
        <div className="rounded-xl bg-white shadow-soft p-4 flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm font-semibold text-epiroc-gray">
            Capturing for {isToday ? 'today' : new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <input
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={day}
            max={todayIso()}
            onChange={(e) => e.target.value && handleDayChange(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="rounded-xl bg-white shadow-soft p-6 text-sm text-slate-600">Loading KPIs…</div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="text-sm font-semibold text-epiroc-gray">Daily KPIs</div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {daily.map((def) => (
                  <KpiCard key={def.key} def={def} form={forms[def.key] || entryToForm(def, null)} entry={entryFor(def)} onChange={(patch) => updateForm(def.key, patch)} />
                ))}
              </div>
            </div>

            {monthly.length > 0 && (
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-semibold text-epiroc-gray">Monthly KPIs — {monthLabel(day)}</div>
                  <div className="text-xs text-slate-500">Captured once a month; saving again updates the month's figure.</div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {monthly.map((def) => (
                    <KpiCard key={def.key} def={def} form={forms[def.key] || entryToForm(def, null)} entry={entryFor(def)} onChange={(patch) => updateForm(def.key, patch)} />
                  ))}
                </div>
              </div>
            )}

            <div className="sticky bottom-0 -mx-4 md:-mx-8 border-t border-slate-200 bg-white/95 px-4 py-3 flex items-center justify-center gap-4 backdrop-blur">
              {dirty.size > 0 && <span className="text-sm text-slate-600">Unsaved changes</span>}
              <button
                type="submit"
                className="rounded-xl bg-epiroc-yellow px-8 py-2.5 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
                disabled={saveEntries.isPending}
              >
                {saveEntries.isPending ? 'Saving, please wait…' : dirty.size > 0 ? `Save KPIs (${dirty.size} changed)` : 'Save KPIs'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
