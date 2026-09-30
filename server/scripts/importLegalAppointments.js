require('dotenv').config();
const path = require('path');
const mongoose = require('mongoose');
const XLSX = require('xlsx');
const { LegalAppointment, LEGAL_APPOINTMENT_TYPES } = require('../src/models/LegalAppointment');

// Source workbook: a single sheet, one employee per row (starting row 6),
// columns A-C are Name/Workshop Area/Position, columns D-AD are one column
// per legal appointment type (a '●' marks that the employee holds it).
const SOURCE_FILE = path.join(__dirname, '../../client/src/components/Epiroc SA Legal Appointment Matrix.xlsx');
const SHEET_NAME = 'Legal Appointments ';
// The sheet's populated range starts at row 2 (its !ref is "A2:AD174"), so
// XLSX's header:1 array is 0-indexed from row 2, not row 1 — row N (1-indexed
// in Excel) lands at array index N-2.
const FIRST_DATA_ROW_INDEX = 4; // Excel row 6 (first employee row)
const LAST_DATA_ROW_INDEX = 151; // exclusive; Excel row 152 is the last data row
const FIRST_APPOINTMENT_COL_INDEX = 3; // 0-indexed; column D
const MARKER = '●'; // ●

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const workbook = XLSX.readFile(SOURCE_FILE);
  const sheet = workbook.Sheets[SHEET_NAME];
  if (!sheet) {
    throw new Error(`Sheet "${SHEET_NAME}" not found. Sheets present: ${workbook.SheetNames.join(', ')}`);
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const dataRows = rows.slice(FIRST_DATA_ROW_INDEX, LAST_DATA_ROW_INDEX);

  const ops = [];
  for (const row of dataRows) {
    const employeeName = String(row[0] || '').trim();
    if (!employeeName) continue;

    const workshopArea = String(row[1] || '').trim();
    const position = String(row[2] || '').trim();

    LEGAL_APPOINTMENT_TYPES.forEach((appointmentType, i) => {
      const cell = String(row[FIRST_APPOINTMENT_COL_INDEX + i] || '').trim();
      if (cell !== MARKER) return;

      ops.push({
        updateOne: {
          filter: { employeeName, appointmentType },
          update: { $setOnInsert: { employeeName, workshopArea, position, appointmentType, dueDate: null } },
          upsert: true,
        },
      });
    });
  }

  if (ops.length === 0) {
    console.log('No marked appointments found — nothing to import.');
    await mongoose.disconnect();
    return;
  }

  const result = await LegalAppointment.bulkWrite(ops);
  console.log(`Done. Inserted ${result.upsertedCount} new record(s); ${ops.length - result.upsertedCount} already existed.`);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
