import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { KpiOverviewChart } from '../components/KpiCharts';
import { useKpiEntries } from '../services/kpiEntries';

function isoDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

export default function KpiVisualsPage() {
  const { data, isLoading, isError } = useKpiEntries(60);
  const entries = data?.entries || [];

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i)), []);

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
          <div className="text-sm text-slate-600">Weekly trend by category.</div>
        </div>
        <Link
          to="/spare-parts/kpi"
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          &larr; Back to Tracker
        </Link>
      </div>

      <KpiOverviewChart entries={entries} days={last7Days} />
    </div>
  );
}
