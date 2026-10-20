import { Link, useSearchParams } from 'react-router-dom';
import { useStoreIssues } from '../services/storeIssues';
import { IssueSlip, ISSUE_SLIP_STYLES } from '../components/IssueSlip';

export default function IssuesBulkPrintPage() {
  const [searchParams] = useSearchParams();
  const ids = (searchParams.get('ids') || '').split(',').filter(Boolean);

  const { data, isLoading, isError } = useStoreIssues();
  const allIssues = data?.issues || [];
  const issues = ids.map((id) => allIssues.find((i) => i._id === id)).filter(Boolean);

  if (isLoading) return <div className="p-8 text-sm text-slate-600">Loading...</div>;
  if (isError) return <div className="p-8 text-sm text-slate-600">Could not load store issues.</div>;
  if (ids.length === 0) return <div className="p-8 text-sm text-slate-600">No issues selected.</div>;

  return (
    <div>
      <style>{ISSUE_SLIP_STYLES}</style>

      <div className="print-toolbar no-print">
        <Link to="/spare-parts/store-issues" className="text-sm text-epiroc-gray font-semibold hover:underline">
          &larr; Back to Store Issues
        </Link>
        <button
          className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
          onClick={() => window.print()}
        >
          Print / Save as PDF ({issues.length})
        </button>
      </div>

      {issues.map((issue, i) => (
        <div key={issue._id} className={`print-page ${i < issues.length - 1 ? 'print-page-break' : ''}`}>
          <IssueSlip issue={issue} />
        </div>
      ))}
    </div>
  );
}
