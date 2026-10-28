require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { ImsAudit, IMS_AUDIT_FOCUS_AREAS } = require('../src/models/ImsAudit');

// Source workbook: the "Audit programme 2026" sheet, one audit per row (Excel rows
// 5-54). Columns T-AE hold the 2026 schedule: an "E" (external) or "I" (internal)
// in the month(s) the audit is planned, with the cell's fill colour giving that
// month's status per the sheet's legend. (Columns F-S are last year's schedule,
// carried over on the sheet, and are not imported.)
//
// Usage: node scripts/importImsAudits.js [--dry-run]
const SOURCE_FILE = path.join(__dirname, '../../client/src/components/IMS audit programme.xlsx');
const SHEET_NAME = 'Audit programme 2026';
const YEAR = 2026;
const FIRST_DATA_ROW = 5; // Excel row numbers (1-indexed)
const LAST_DATA_ROW = 54;

const COL = {
  number: 'A',
  businessArea: 'B',
  responsible: 'C',
  focusArea: 'D',
  processArea: 'E',
  auditDates: 'AF',
  reportSubmitted: 'AG',
  auditor: 'AH',
  comments: 'AI',
};
const MONTH_COLS = ['T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE'];
// Raised / Closed / Open triplets; Open is derived, so only raised and closed are read.
const FINDING_COLS = {
  major: ['AJ', 'AK'],
  minor: ['AM', 'AN'],
  observation: ['AP', 'AQ'],
};

const STATUS_BY_FILL = {
  FFC000: 'Planned',
  FFFF00: 'Invite Sent',
  FF99FF: 'Confirmed',
  '00B0F0': 'In Progress',
  '92D050': 'Completed',
  FF0000: 'Cancelled',
};

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function text(sheet, addr) {
  const cell = sheet[addr];
  return cell ? String(cell.w ?? cell.v ?? '').replace(/\r\n/g, '\n').trim() : '';
}

function count(sheet, addr) {
  const n = Number(text(sheet, addr));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// "14 August 2026" or "10 September" (year defaults to the programme year).
function parseDayMonth(value) {
  const m = value.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?$/);
  if (!m) return null;
  const monthIndex = MONTHS.indexOf(m[2].toLowerCase());
  if (monthIndex < 0) return null;
  return new Date(Date.UTC(m[3] ? Number(m[3]) : YEAR, monthIndex, Number(m[1]), 12));
}

function readRow(sheet, row) {
  const processArea = text(sheet, `${COL.processArea}${row}`);
  const focusArea = text(sheet, `${COL.focusArea}${row}`);
  if (!processArea || !focusArea) return null;
  if (!IMS_AUDIT_FOCUS_AREAS.includes(focusArea)) {
    throw new Error(`Row ${row}: unknown focus area "${focusArea}"`);
  }

  const schedule = [];
  MONTH_COLS.forEach((col, i) => {
    const cell = sheet[`${col}${row}`];
    const marker = text(sheet, `${col}${row}`).toUpperCase();
    if (marker !== 'E' && marker !== 'I') return;
    const fill = cell?.s?.fgColor?.rgb;
    const status = STATUS_BY_FILL[fill];
    if (!status) {
      throw new Error(`Row ${row} ${col}: unrecognised fill colour "${fill}"`);
    }
    schedule.push({ month: i + 1, auditType: marker === 'I' ? 'Internal' : 'External', status });
  });

  let comments = text(sheet, `${COL.comments}${row}`);
  const reportText = text(sheet, `${COL.reportSubmitted}${row}`);
  const reportSubmittedDate = reportText ? parseDayMonth(reportText) : null;
  // Keep notes like "Outstanding" / "Online access" rather than silently dropping them.
  if (reportText && !reportSubmittedDate && reportText !== '-') {
    comments = comments ? `${comments}\nReport: ${reportText}` : `Report: ${reportText}`;
  }

  const findings = {};
  Object.entries(FINDING_COLS).forEach(([kind, [raisedCol, closedCol]]) => {
    const raised = count(sheet, `${raisedCol}${row}`);
    findings[kind] = { raised, closed: Math.min(raised, count(sheet, `${closedCol}${row}`)) };
  });

  const auditDates = text(sheet, `${COL.auditDates}${row}`);
  const auditor = text(sheet, `${COL.auditor}${row}`);

  return {
    year: YEAR,
    number: Number(text(sheet, `${COL.number}${row}`)) || null,
    focusArea,
    processArea,
    businessArea: text(sheet, `${COL.businessArea}${row}`),
    responsible: text(sheet, `${COL.responsible}${row}`),
    schedule,
    auditDates: auditDates === '-' ? '' : auditDates,
    reportSubmittedDate,
    auditor: auditor === '-' ? '' : auditor,
    comments,
    findings,
  };
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');

  const workbook = XLSX.readFile(SOURCE_FILE, { cellStyles: true });
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Sheets present: ${workbook.SheetNames.join(', ')}`);
  }

  const audits = [];
  for (let row = FIRST_DATA_ROW; row <= LAST_DATA_ROW; row += 1) {
    const audit = readRow(sheet, row);
    if (audit) audits.push(audit);
  }

  if (dryRun) {
    audits.forEach((a) => {
      const months = a.schedule.map((s) => `${s.month}:${s.auditType[0]}:${s.status}`).join(' ');
      console.log(`#${a.number} [${a.focusArea}] ${a.processArea.split('\n')[0]} | ${months || '(not scheduled)'} | report ${a.reportSubmittedDate ? a.reportSubmittedDate.toISOString().slice(0, 10) : '-'}`);
    });
    console.log(`${audits.length} audits parsed (dry run, nothing written).`);
    return;
  }

  await mongoose.connect(process.env.MONGO_URI);

  // Insert-only: audits already in the database (and any edits made in the app)
  // are left untouched.
  const result = await ImsAudit.bulkWrite(
    audits.map((audit) => ({
      updateOne: {
        filter: { year: audit.year, focusArea: audit.focusArea, processArea: audit.processArea },
        update: { $setOnInsert: audit },
        upsert: true,
      },
    }))
  );

  console.log(`Parsed ${audits.length} audits: ${result.upsertedCount} inserted, ${audits.length - result.upsertedCount} already present.`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
