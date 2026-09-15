const fs = require('fs');
const path = require('path');
const XLSX = require(process.env.XLSX_MODULE_PATH || 'xlsx');
const { SPREADSHEET_TEMPLATE_HEADERS } = require('./ppeItemsData');

const SOURCE_FILE = path.join(__dirname, 'output', 'Balance+Identity+Open+Toolbox (54).xlsx');
const OUT_FILE = path.join(__dirname, 'output', 'part-inventory-import.csv');

const POOL_LOCATIONS = new Set(['POOL_SUP', 'POOL_OUT', 'POOL_READY', 'POOL_SCRAP', 'OSMI']);

const wb = XLSX.readFile(SOURCE_FILE);
const ws = wb.Sheets['Sheet0'];
const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
const data = rows.slice(1);

const items = new Map();
const anomalies = [];

for (const r of data) {
  const itemNumber = String(r[2] || '').trim();
  if (!itemNumber) continue;
  const name = String(r[3] || '').trim();
  const location = String(r[4] || '').trim();
  const onHand = Number(r[6]) || 0;
  const allocRaw = r[7];
  const isPoolRow = POOL_LOCATIONS.has(location);

  if (!items.has(itemNumber)) {
    items.set(itemNumber, {
      description: name,
      onHand: 0,
      allocatable: 0,
      locations: new Set(),
      sawPool: false,
      sawRegular: false,
    });
  }
  const entry = items.get(itemNumber);
  entry.onHand += onHand;

  if (isPoolRow) {
    entry.sawPool = true;
    if (location !== 'POOL_OUT') entry.allocatable += onHand;
  } else {
    entry.sawRegular = true;
    if (location) entry.locations.add(location);
    const allocVal = allocRaw === '' || allocRaw === undefined || allocRaw === null ? onHand : Number(allocRaw);
    entry.allocatable += allocVal;
  }
}

for (const [itemNumber, entry] of items) {
  if (entry.sawPool && entry.sawRegular) {
    anomalies.push(`${itemNumber} (${entry.description}) has BOTH pool and regular rows — check manually`);
  }
}

function csvField(value) {
  const s = String(value ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const outRows = [SPREADSHEET_TEMPLATE_HEADERS.join(',')];

for (const [itemNumber, entry] of items) {
  const allocatable = Math.max(0, Math.min(entry.allocatable, entry.onHand));
  const storageLocation = [...entry.locations].join('; ');
  const fields = [
    itemNumber, // Part Number
    entry.description, // Part Description
    'Returnable', // Part Type
    '', '', '', '', '', // Component Part Number, Component Description, Functional System, Sub-System, Machine Type
    '', // Serial Number
    entry.onHand, // Stock On Hand
    allocatable, // Allocatable Stock
    0, // Minimum Stock Level
    0, // Maximum Stock Level
    'EA', // Unit Of Measure
    storageLocation, // Storage Location
    'Active', // Status
  ];
  outRows.push(fields.map(csvField).join(','));
}

fs.writeFileSync(OUT_FILE, outRows.join('\n') + '\n');

console.log(`Wrote ${items.size} unique part records to ${OUT_FILE}`);
console.log(`Total source rows processed: ${data.length}`);
if (anomalies.length) {
  console.log('\nAnomalies (mixed pool/regular rows for the same item number):');
  anomalies.forEach((a) => console.log(' -', a));
} else {
  console.log('No anomalies found.');
}
