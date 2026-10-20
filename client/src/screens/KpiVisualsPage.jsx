import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { KpiOverviewChart } from '../components/KpiCharts';
import { Gauge, scoreColor } from '../components/Gauge';
import { useKpiEntries } from '../services/kpiEntries';
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

function MeasureTile({ def, data }) {
  const score = measureScore(def, data);

  return (
    <div className="rounded-xl border border-slate-200 p-3 flex items-center gap-3">
      {def.type === 'count' ? (
        <div
          className="w-14 h-14 rounded-full grid place-items-center text-lg font-bold flex-shrink-0 bg-slate-100 text-slate-700"
        >
          {data?.count ?? '—'}
        </div>
      ) : (
        <Gauge value={score} size={56} strokeWidth={6} />
      )}
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900 truncate">{def.label}</div>
        <div className="text-xs text-slate-500 truncate">{def.description}</div>
        {def.type === 'ratio' && (
          <div className="text-xs text-slate-400 mt-0.5">
            {data?.numerator ?? '—'} of {data?.denominator ?? '—'}
          </div>
        )}
        {def.type === 'check' && (
          <div
            className="text-xs font-semibold mt-0.5"
            style={{ color: data?.confirmed === undefined || data?.confirmed === null ? '#94a3b8' : scoreColor(score) }}
          >
            {data?.confirmed === true ? 'Confirmed' : data?.confirmed === false ? 'Not confirmed' : 'No entry'}
          </div>
        )}
      </div>
    </div>
  );
}

export default function KpiVisualsPage() {
  const { data, isLoading, isError } = useKpiEntries(60);
  const entries = data?.entries || [];

  const [selectedDate, setSelectedDate] = useState(todayIso());
  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i)), []);

  const selectedEntry = useMemo(
    () => entries.find((e) => dateOnly(e.date) === selectedDate),
    [entries, selectedDate]
  );
  const measures = selectedEntry?.measures || {};
  const overallScore = computeOverallScore(measures);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <div className="text-epiroc-gray font-semibold">Loading KPI visuals…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-gray">Could not load KPI data</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="text-2xl font-semibold text-epiroc-gray">KPI Visuals</div>
          <div className="text-sm text-slate-600">Every measure captured on the KPI form, visualized for the selected day.</div>
        </div>
        <Link
          to="/spare-parts/kpi"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          &larr; Back to Tracker
        </Link>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-5 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Gauge value={overallScore} size={88} strokeWidth={9} label="Overall" />
          <div>
            <div className="text-sm font-semibold text-epiroc-gray">
              {selectedEntry ? 'Showing KPIs for' : 'No KPIs captured for'}
            </div>
            <div className="text-xs text-slate-500">
              {selectedEntry ? 'Recorded by ' + (selectedEntry.recordedBy?.fullName || 'unknown') : 'Pick a different date, or capture KPIs for this day on the Tracker'}
            </div>
          </div>
        </div>
        <input
          type="date"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
          value={selectedDate}
          max={todayIso()}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {KPI_CATEGORIES.map((cat) => {
        const catScore = computeCategoryScore(cat, measures);
        return (
          <div key={cat.key} className="rounded-xl bg-white shadow-soft p-5 space-y-4">
            <div className="flex items-center gap-4">
              <Gauge value={catScore} size={64} strokeWidth={7} />
              <div className="text-base font-semibold text-epiroc-gray">{cat.label}</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {cat.measures.map((def) => (
                <MeasureTile key={def.key} def={def} data={measures[def.key]} />
              ))}
            </div>
          </div>
        );
      })}

      <KpiOverviewChart entries={entries} days={last7Days} />
    </div>
  );
}
