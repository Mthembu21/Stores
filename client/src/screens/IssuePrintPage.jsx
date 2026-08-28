import { useParams } from 'react-router-dom';
import { useStoreIssue } from '../services/storeIssues';
import epirocLogo from '../components/logo.png';

function dateOnly(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

function hasText(v) {
  return v !== null && v !== undefined && String(v).trim() !== '';
}

function Field({ label, value }) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      <div className="field-value">{hasText(value) ? value : ' '}</div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="section">
      <div className="section-title">{title}</div>
      <div className="section-body">{children}</div>
    </div>
  );
}

export default function IssuePrintPage() {
  const { id } = useParams();
  const { data, isLoading, isError } = useStoreIssue(id);
  const issue = data?.issue;

  if (isLoading) return <div className="p-8 text-sm text-slate-600">Loading...</div>;
  if (isError || !issue) return <div className="p-8 text-sm text-slate-600">Could not load this store issue.</div>;

  const hasMaintenance =
    hasText(issue.dateStarted) ||
    hasText(issue.dateCompleted) ||
    hasText(issue.timeStarted) ||
    hasText(issue.timeCompleted) ||
    hasText(issue.engineHours) ||
    hasText(issue.powerPackHours) ||
    hasText(issue.percussionHours) ||
    hasText(issue.extraHours);

  const nature = issue.natureOfDowntime || {};
  const hasDowntime =
    nature.damage || nature.breakdown || nature.warranty || nature.inspection ||
    hasText(issue.possibleCausesOfFailure) || hasText(issue.workPerformed);

  const hasComponentInfo =
    hasText(issue.subSystem) ||
    hasText(issue.functionalSystem) ||
    hasText(issue.componentDescription) ||
    hasText(issue.componentPartNumber) ||
    hasText(issue.serialNumberIssued) ||
    hasText(issue.serialNumberReturned);

  const laborEntries = issue.laborEntries || [];

  return (
    <div className="print-page">
      <style>{`
        .print-page {
          width: 190mm;
          margin: 8mm auto;
          background: #fff;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8.5pt;
          line-height: 1.25;
        }
        .print-toolbar {
          max-width: 190mm;
          margin: 0 auto 8px auto;
          display: flex;
          justify-content: flex-end;
        }
        .print-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #003b71;
          padding-bottom: 4px;
          margin-bottom: 6px;
        }
        .print-header .brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .print-header .brand img {
          height: 22pt;
          width: auto;
          display: block;
        }
        .print-header h1 {
          font-size: 13pt;
          font-weight: 700;
          color: #003b71;
          margin: 0;
        }
        .print-header .sub {
          font-size: 9pt;
          font-weight: 600;
          margin-top: 2px;
        }
        .print-header .meta {
          text-align: right;
          font-size: 8.5pt;
        }
        .print-header .meta .issue-number {
          font-size: 11pt;
          font-weight: 700;
        }
        .section {
          border: 1px solid #94a3b8;
          margin-bottom: 4px;
          page-break-inside: avoid;
        }
        .section-title {
          background: #e2e8f0;
          font-weight: 700;
          font-size: 7.5pt;
          text-transform: uppercase;
          letter-spacing: 0.02em;
          padding: 2px 4px;
          border-bottom: 1px solid #94a3b8;
        }
        .section-body {
          padding: 3px 4px;
        }
        .grid {
          display: grid;
          gap: 2px 8px;
        }
        .grid-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-4 { grid-template-columns: repeat(4, 1fr); }
        .field-label {
          font-size: 6.8pt;
          color: #475569;
          text-transform: uppercase;
        }
        .field-value {
          font-size: 8.5pt;
          font-weight: 600;
          border-bottom: 1px solid #cbd5e1;
          min-height: 11pt;
        }
        table.print-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        table.print-table th, table.print-table td {
          border: 1px solid #94a3b8;
          padding: 2px 4px;
          text-align: left;
        }
        table.print-table th {
          background: #f1f5f9;
          font-size: 7pt;
          text-transform: uppercase;
        }
        .checkbox-row {
          display: flex;
          gap: 12px;
          margin-bottom: 3px;
        }
        .checkbox-row span {
          font-size: 8pt;
        }
        .signature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        .signature-box {
          border-top: 1px solid #111;
          margin-top: 14px;
          padding-top: 2px;
          font-size: 7.5pt;
        }
        @media print {
          .no-print { display: none !important; }
          .print-page { margin: 0 auto; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>

      <div className="print-toolbar no-print">
        <button
          className="rounded-xl bg-epiroc-yellow px-4 py-2 text-sm font-semibold text-epiroc-black shadow-soft hover:brightness-95"
          onClick={() => window.print()}
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="print-header">
        <div className="brand">
          <img src={epirocLogo} alt="Epiroc" />
          <div>
            <h1>Epiroc South Africa (Pty) Ltd</h1>
            <div className="sub">Unplanned Maintenance Work Order &mdash; Parts Issue</div>
          </div>
        </div>
        <div className="meta">
          <div className="issue-number">{issue.issueNumber}</div>
          <div>Status: {issue.status}</div>
          <div>{dateOnly(issue.issueDate)}</div>
        </div>
      </div>

      <Section title="Machine information">
        <div className="grid grid-4">
          <Field label="Machine number" value={issue.machineNumber} />
          <Field label="Machine type" value={issue.machineType} />
          <Field label="Service order number" value={issue.serviceOrderNumber} />
          <Field label="Work order number" value={issue.workOrderNumber} />
          <Field label="Risk assessment number" value={issue.riskAssessmentNumber} />
        </div>
      </Section>

      <Section title="Machine area / location">
        <div className="grid grid-4">
          <Field label="Location" value={issue.location} />
          <Field label="Section" value={issue.section} />
          <Field label="Workplace" value={issue.workplace} />
          <Field label="Responsible foreman" value={issue.responsibleForeman} />
        </div>
      </Section>

      {hasMaintenance && (
        <Section title="Maintenance executed / hour meter readings">
          <div className="grid grid-4">
            <Field label="Date started" value={dateOnly(issue.dateStarted)} />
            <Field label="Date completed" value={dateOnly(issue.dateCompleted)} />
            <Field label="Time started" value={issue.timeStarted} />
            <Field label="Time completed" value={issue.timeCompleted} />
            <Field label="Engine hrs" value={issue.engineHours} />
            <Field label="Power pack hrs" value={issue.powerPackHours} />
            <Field label="Percussion 2 hrs" value={issue.percussionHours} />
            <Field label="Extra hrs" value={issue.extraHours} />
          </div>
        </Section>
      )}

      {hasDowntime && (
        <Section title="Nature of downtime">
          <div className="checkbox-row">
            <span>{nature.damage ? '☑' : '☐'} Damage</span>
            <span>{nature.breakdown ? '☑' : '☐'} Break down</span>
            <span>{nature.warranty ? '☑' : '☐'} Warranty</span>
            <span>{nature.inspection ? '☑' : '☐'} Inspection</span>
          </div>
          <div className="grid grid-2">
            <Field label="Possible causes of failure" value={issue.possibleCausesOfFailure} />
            <Field label="Work performed" value={issue.workPerformed} />
          </div>
        </Section>
      )}

      {hasComponentInfo && (
        <Section title="Component / equipment information">
          <div className="grid grid-3">
            <Field label="Sub system" value={issue.subSystem} />
            <Field label="Functional system" value={issue.functionalSystem} />
            <Field label="Component description" value={issue.componentDescription} />
            <Field label="Component part number" value={issue.componentPartNumber} />
            <Field label="Serial number (issued)" value={issue.serialNumberIssued} />
            <Field label="Serial number (returned)" value={issue.serialNumberReturned} />
          </div>
        </Section>
      )}

      <Section title="Parts issued">
        <table className="print-table">
          <thead>
            <tr>
              <th>Part number</th>
              <th>Description</th>
              <th>Qty issued</th>
              <th>Qty to order</th>
              <th>Qty returned</th>
            </tr>
          </thead>
          <tbody>
            {(issue.items || []).map((item) => (
              <tr key={item._id}>
                <td>{item.partNumber}</td>
                <td>{item.partDescription}</td>
                <td>{item.quantityIssued}</td>
                <td>{item.quantityToOrder}</td>
                <td>{item.quantityReturned}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {laborEntries.length > 0 && (
        <Section title="Labour">
          <table className="print-table">
            <thead>
              <tr>
                <th>Clock #</th>
                <th>Name</th>
                <th>Surname</th>
                <th>Position</th>
                <th>Total hrs</th>
              </tr>
            </thead>
            <tbody>
              {laborEntries.map((l, i) => (
                <tr key={i}>
                  <td>{l.clockNumber}</td>
                  <td>{l.name}</td>
                  <td>{l.surname}</td>
                  <td>{l.position}</td>
                  <td>{l.totalHours ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      <Section title="Justification">
        <div className="field-value" style={{ borderBottom: 'none', fontWeight: 400 }}>
          {hasText(issue.justification) ? issue.justification : ' '}
        </div>
      </Section>

      <Section title="Sign-off">
        <div className="signature-grid">
          <div>
            <div className="field-label">Spares issued to (Requestor)</div>
            <div className="field-value">
              {issue.requestorName} {issue.requestorSurname}
              {hasText(issue.requestorClockNumber) ? ` (${issue.requestorClockNumber})` : ''}
            </div>
            <div className="signature-box">Signature</div>
          </div>
          <div>
            <div className="field-label">Foreman</div>
            <div className="field-value">
              {hasText(issue.foremanName) || hasText(issue.foremanSurname)
                ? `${issue.foremanName || ''} ${issue.foremanSurname || ''}`
                : ' '}
            </div>
            <div className="signature-box">Signature</div>
          </div>
          <div>
            <div className="field-label">Storeman</div>
            <div className="field-value">
              {hasText(issue.storemanName) || hasText(issue.storemanSurname)
                ? `${issue.storemanName || ''} ${issue.storemanSurname || ''}`
                : ' '}
            </div>
            <div className="signature-box">Signature</div>
          </div>
        </div>
      </Section>
    </div>
  );
}
