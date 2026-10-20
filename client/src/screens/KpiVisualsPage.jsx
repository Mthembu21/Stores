import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Table } from '../components/Table';
import { KpiOverviewChart } from '../components/KpiCharts';
import { useKpiEntries } from '../services/kpiEntries';
import { KPI_MEASURES, measureScore } from '../config/kpiDefinitions';
import { formatDateTime } from '../utils/format';

function isoDaysAgo(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const tzOffsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tzOffsetMs).toISOString().slice(0, 10);
}

const CATEGORY_LABELS = {
  receiving: 'Receiving',
  dispatching: 'Dispatching',
  picking: 'Picking',
  housekeeping: 'Housekeeping',
  safety: 'Safety',
};

export default function KpiVisualsPage() {
  const { data, isLoading, isError } = useKpiEntries(60);
  const entries = data?.entries || [];

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => isoDaysAgo(6 - i)), []);

  // Flatten every measure's comment across every captured day, newest first — the
  // justification behind a category's score, since the chart alone only shows the
  // number.
  const comments = useMemo(() => {
    const rows = [];
    entries.forEach((entry) => {
      KPI_MEASURES.forEach((def) => {
        const measureData = entry.measures?.[def.key];
        const comment = measureData?.comment?.trim();
        if (!comment) return;
        rows.push({
          id: `${entry._id}-${def.key}`,
          date: entry.date,
          category: CATEGORY_LABELS[def.categoryKey] || def.categoryKey,
          measure: def.label,
          score: measureScore(def, measureData),
          comment,
        });
      });
    });
    return rows.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [entries]);

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

      <div className="space-y-3">
        <div>
          <div className="text-sm font-semibold text-epiroc-gray">Comments</div>
          <div className="text-xs text-slate-500">
            Notes left against individual measures — the reasoning behind a score, where one was given.
          </div>
        </div>
        <Table
          emptyLabel="No comments captured yet"
          columns={[
            { key: 'date', header: 'Date', render: (r) => formatDateTime(r.date) },
            { key: 'category', header: 'Category' },
            { key: 'measure', header: 'Measure' },
            { key: 'score', header: '%', render: (r) => (r.score === null ? '—' : `${r.score}%`) },
            { key: 'comment', header: 'Comment' },
          ]}
          rows={comments}
          maxHeight="400px"
        />
      </div>
    </div>
  );
}
