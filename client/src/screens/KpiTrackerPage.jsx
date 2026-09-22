import { useEffect, useMemo, useState } from 'react';
import { KpiOverviewChart } from '../components/KpiCharts';
import { useKpiEntries, useSaveKpiEntry } from '../services/kpiEntries';
import { KPI_CATEGORIES, computeCategoryScore, computeOverallScore, measureScore } from '../config/kpiDefinitions';

function todayIso() {
  const d = new Date();
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function isoDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

function dateOnly(value) {
  if (!value) return '';
  return new Date(value).toISOString().slice(0, 10);
}

function scoreClass(score) {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score >= 90) return 'text-green-700 font-semibold';
  if (score >= 70) return 'text-epiroc-yellow font-semibold';
  return 'text-red-600 font-semibold';
}

function scoreLabel(score) {
  return score === null || score === undefined ? '—' : `${score}%`;
}

function MeasureRow({ def, data, onChange }) {
  const data_ = data || {};
  const score = measureScore(def, data_);

  function set(patch) {
    onChange({ ...data_, ...patch });
  }

  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0 last:pb-0 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium text-slate-900">{def.label}</div>
          <div className="text-xs text-slate-500">{def.description}</div>
        </div>
        {def.type !== 'count' && <div className={`text-sm whitespace-nowrap ${scoreClass(score)}`}>{scoreLabel(score)}</div>}
      </div>

      {def.type === 'check' && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`rounded-lg px-3 py-1 text-xs font-semibold border ${
              data_.confirmed === true ? 'bg-green-600 text-white border-green-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => set({ confirmed: true })}
          >
            Yes
          </button>
          <button
            type="button"
            className={`rounded-lg px-3 py-1 text-xs font-semibold border ${
              data_.confirmed === false ? 'bg-red-600 text-white border-red-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => set({ confirmed: false })}
          >
            No
          </button>
          {data_.confirmed !== null && data_.confirmed !== undefined && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:underline"
              onClick={() => set({ confirmed: null })}
            >
              Clear
            </button>
          )}
        </div>
      )}

      {def.type === 'ratio' && (
        <div className="flex items-center gap-2 text-sm">
          <input
            type="number"
            min="0"
            className="w-20 rounded-lg border border-slate-200 px-2 py-1"
            value={data_.numerator ?? ''}
            onChange={(e) => set({ numerator: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="0"
          />
          <span className="text-slate-500">of</span>
          <input
            type="number"
            min="0"
            className="w-20 rounded-lg border border-slate-200 px-2 py-1"
            value={data_.denominator ?? ''}
            onChange={(e) => set({ denominator: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="0"
          />
        </div>
      )}

      {def.type === 'count' && (
        <input
          type="number"
          min="0"
          className="w-28 rounded-lg border border-slate-200 px-2 py-1 text-sm"
          value={data_.count ?? ''}
          onChange={(e) => set({ count: e.target.value === '' ? null : Number(e.target.value) })}
          placeholder="0"
        />
      )}

      <input
        className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
        value={data_.comment || ''}
        onChange={(e) => set({ comment: e.target.value })}
        placeholder="Add a comment (optional)"
      />
    </div>
  );
}

export default function KpiTrackerPage() {
  const { data, isLoading, isError } = useKpiEntries(60);
  const entries = data?.entries || [];
  const saveEntry = useSaveKpiEntry();

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const [measures, setMeasures] = useState({});
  const [categoryIndex, setCategoryIndex] = useState(0);

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i)), []);

  const existingEntry = useMemo(
    () => entries.find((e) => dateOnly(e.date) === selectedDate),
    [entries, selectedDate]
  );

  useEffect(() => {
    setMeasures(existingEntry ? { ...existingEntry.measures } : {});
    setCategoryIndex(0);
  }, [selectedDate, existingEntry]);

  function updateMeasure(key, data) {
    setMeasures((prev) => ({ ...prev, [key]: data }));
  }

  function handleSave(e) {
    e.preventDefault();
    saveEntry.mutate({ date: selectedDate, measures });
  }

  const overallScore = computeOverallScore(measures);

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-gray">Daily KPI Tracker</div>
        <div className="text-sm text-slate-600">
          Confirm today's checks and counts per category — percentages are calculated automatically from what you
          confirm, not typed in.
        </div>
      </div>

      <form className="max-w-3xl mx-auto w-full rounded-xl bg-white shadow-soft p-6 space-y-6" onSubmit={handleSave}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="text-sm font-semibold text-epiroc-gray">
            {existingEntry ? 'Edit KPIs for' : 'Capture KPIs for'}
          </div>
          <input
            type="date"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={selectedDate}
            max={todayIso()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex items-center justify-between">
          <div className="text-sm font-semibold text-epiroc-gray">Overall score for the day</div>
          <div className={`text-xl ${scoreClass(overallScore)}`}>{scoreLabel(overallScore)}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          {KPI_CATEGORIES.map((cat, i) => {
            const catScore = computeCategoryScore(cat, measures);
            const active = i === categoryIndex;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategoryIndex(i)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold border text-left ${
                  active ? 'border-epiroc-yellow bg-epiroc-yellow/15 text-epiroc-gray' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div>{i + 1}. {cat.label}</div>
                <div className={scoreClass(catScore)}>{scoreLabel(catScore)}</div>
              </button>
            );
          })}
        </div>

        {(() => {
          const cat = KPI_CATEGORIES[categoryIndex];
          const catScore = computeCategoryScore(cat, measures);
          const isFirst = categoryIndex === 0;
          const isLast = categoryIndex === KPI_CATEGORIES.length - 1;
          return (
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="text-sm font-semibold text-epiroc-gray">
                  {categoryIndex + 1} of {KPI_CATEGORIES.length} — {cat.label}
                </div>
                <div className={`text-sm ${scoreClass(catScore)}`}>{scoreLabel(catScore)}</div>
              </div>
              <div>
                {cat.measures.map((def) => (
                  <MeasureRow
                    key={def.key}
                    def={def}
                    data={measures[def.key]}
                    onChange={(data) => updateMeasure(def.key, data)}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between pt-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  onClick={() => setCategoryIndex((i) => Math.max(0, i - 1))}
                  disabled={isFirst}
                >
                  &larr; Back
                </button>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                  onClick={() => setCategoryIndex((i) => Math.min(KPI_CATEGORIES.length - 1, i + 1))}
                  disabled={isLast}
                >
                  Next &rarr;
                </button>
              </div>
            </div>
          );
        })()}

        <div className="flex justify-center pt-2 border-t border-slate-100">
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60 mt-4"
            disabled={saveEntry.isPending}
          >
            {saveEntry.isPending ? 'Saving...' : 'Save KPIs'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-gray">Weekly progress by category</div>
        {isLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading KPI history...</div>
        ) : isError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load KPI history</div>
        ) : (
          <KpiOverviewChart entries={entries} days={last7Days} />
        )}
      </div>
    </div>
  );
}
