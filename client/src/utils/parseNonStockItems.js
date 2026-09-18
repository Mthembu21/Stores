// Parses the ERP's item-master export (e.g. "items (19).xlsx") — a reference list of
// items the ERP knows about, most of which aren't normally kept in stock. Kept
// separate from parseSpreadsheet.js since the field set and semantics are different
// (no quantities to aggregate, no per-location grouping — one row per item code).

const FIELD_ALIASES = {
  itemcode: 'partNumber',
  'item#': 'partNumber',
  partnumber: 'partNumber',
  description: 'partDescription',
  itemdescription: 'partDescription',
  binloc: 'storageLocation',
  location: 'storageLocation',
  storagelocation: 'storageLocation',
  supplier: 'supplier',
  effleadtime: 'leadTimeDays',
  leadtime: 'leadTimeDays',
  picksclass: 'pickClass',
  unitcostoriginalcurrency: 'unitCost',
  unitcost: 'unitCost',
};

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function mapNonStockItemRows(headerCells, dataRowsOfCells) {
  const fieldKeys = headerCells.map((h) => FIELD_ALIASES[normalizeHeader(h)] || null);
  const unmatchedHeaders = headerCells.filter((h, i) => !fieldKeys[i]);

  const seen = new Set();
  const rows = [];

  dataRowsOfCells.forEach((cells) => {
    const row = {};
    fieldKeys.forEach((key, i) => {
      if (key) row[key] = cells[i] !== undefined && cells[i] !== null ? String(cells[i]).trim() : '';
    });
    if (!row.partNumber || seen.has(row.partNumber)) return;
    seen.add(row.partNumber);
    rows.push(row);
  });

  return { rows, unmatchedHeaders, sourceRowCount: dataRowsOfCells.length };
}
