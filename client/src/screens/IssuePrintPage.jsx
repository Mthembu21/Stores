import { Link, useParams } from 'react-router-dom';
import { useStoreIssue } from '../services/storeIssues';
import { IssueSlip, ISSUE_SLIP_STYLES } from '../components/IssueSlip';

export default function IssuePrintPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useStoreIssue(id);
  const issue = data?.issue;

  if (isLoading) return <div className="p-8 text-sm text-slate-600">Loading...</div>;
  if (isError || !issue) return <div className="p-8 text-sm text-slate-600">Could not load this store issue.</div>;

  return (
    <div className="print-page">
      <style>{ISSUE_SLIP_STYLES}</style>

      <div className="print-toolbar no-print">
        <Link to="/spare-parts/store-issues" className="text-sm text-epiroc-gray font-semibold hover:underline">
          &larr; Back to Store Issues
        </Link>
        <button
          className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>

      <IssueSlip issue={issue} />
    </div>
  );
}
