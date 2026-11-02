import { Link, useParams } from 'react-router-dom';
import { usePartReturn } from '../services/partReturns';
import { ISSUE_SLIP_STYLES } from '../components/IssueSlip';
import epirocLogo from '../components/logo.png';

function dateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function Field({ label, value }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-value">{value || ' '}</div>
    </div>
  );
}

function personLabel(name, zNumber) {
  if (!name) return ' ';
  return zNumber ? `${name} (${zNumber})` : name;
}

export default function ReturnPrintPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = usePartReturn(id);
  const partReturn = data?.partReturn;

  if (isLoading) return <div className="p-8 text-sm text-slate-600">Loading...</div>;
  if (isError || !partReturn) return <div className="p-8 text-sm text-slate-600">Could not load this return.</div>;

  return (
    <div className="print-page">
      <style>{ISSUE_SLIP_STYLES}</style>

      <div className="print-toolbar no-print">
        <Link to="/spare-parts/issue?tab=return" className="text-sm text-epiroc-gray font-semibold hover:underline">
          &larr; Back to Return parts
        </Link>
        <div className="flex items-center gap-4">
          <Link to={`/spare-parts/store-issues/${partReturn.storeIssue}/print`} className="text-sm text-epiroc-gray font-semibold hover:underline">
            View issue slip {partReturn.issueNumber}
          </Link>
          <button
            className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
            onClick={() => window.print()}
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      <div className="print-header">
        <div className="brand">
          <img src={epirocLogo} alt="Epiroc" />
          <div>
            <h1>Epiroc South Africa (Pty) Ltd</h1>
            <div className="sub">Parts Return Slip</div>
          </div>
        </div>
        <div className="meta">
          <div className="issue-number">{partReturn.returnNumber}</div>
          <div>Against issue {partReturn.issueNumber}</div>
          <div>{dateOnly(partReturn.returnDate)}</div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Original issue</div>
        <div className="section-body">
          <div className="grid grid-4">
            <Field label="Issue slip number" value={partReturn.issueNumber} />
            <Field label="Machine number" value={partReturn.machineNumber} />
            <Field label="Machine type" value={partReturn.machineType} />
            <Field label="Service order number" value={partReturn.serviceOrderNumber} />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Parts returned</div>
        <div className="section-body">
          <table className="print-table">
            <thead>
              <tr>
                <th>Part number</th>
                <th>Description</th>
                <th>Qty returned</th>
                <th>Condition</th>
                <th>Serial number</th>
              </tr>
            </thead>
            <tbody>
              {(partReturn.items || []).map((item) => (
                <tr key={item._id}>
                  <td>{item.partNumber}</td>
                  <td>{item.partDescription}</td>
                  <td>{item.quantity}</td>
                  <td>{item.condition}</td>
                  <td>{item.serialNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="grid grid-2" style={{ marginTop: 12 }}>
            <Field label="Reason for return" value={partReturn.reason} />
          </div>
        </div>
      </div>

      <div className="section">
        <div className="section-title">Sign-off</div>
        <div className="section-body">
          <div className="signature-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <div>
              <div className="field-label">Returned by</div>
              <div className="field-value">{personLabel(partReturn.returnedByName, partReturn.returnedByZNumber)}</div>
              <div className="signature-box">Signature</div>
            </div>
            <div>
              <div className="field-label">Received by (Storeman)</div>
              <div className="field-value">{personLabel(partReturn.receivedByName, partReturn.receivedByZNumber)}</div>
              <div className="signature-box">Signature</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
