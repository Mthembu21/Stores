const FIELD_ALIASES = {
  partnumber: 'partNumber',
  'partno': 'partNumber',
  'part#': 'partNumber',
  itemnumber: 'partNumber',
  'item#': 'partNumber',
  partdescription: 'partDescription',
  description: 'partDescription',
  name: 'partDescription',
  itemname: 'partDescription',
  parttype: 'partType',
  itemtype: 'partType',
  type: 'partType',
  componentpartnumber: 'componentPartNumber',
  'component#': 'componentPartNumber',
  componentdescription: 'componentDescription',
  functionalsystem: 'functionalSystem',
  subsystem: 'subSystem',
  machinetype: 'machineType',
  serialnumber: 'serialNumber',
  'serial#': 'serialNumber',
  lotnumber: 'serialNumber',
  'lot#': 'serialNumber',
  stockonhand: 'stockOnHand',
  onhand: 'stockOnHand',
  stock: 'stockOnHand',
  quantity: 'stockOnHand',
  qty: 'stockOnHand',
  allocatablestock: 'allocatableStock',
  allocatable: 'allocatableStock',
  allocatableqty: 'allocatableStock',
  allocatble: 'allocatableStock',
  minimumstocklevel: 'minimumStockLevel',
  minlevel: 'minimumStockLevel',
  minstock: 'minimumStockLevel',
  maximumstocklevel: 'maximumStockLevel',
  maxlevel: 'maximumStockLevel',
  maxstock: 'maximumStockLevel',
  unitofmeasure: 'unitOfMeasure',
  uom: 'unitOfMeasure',
  storagelocation: 'storageLocation',
  location: 'storageLocation',
  status: 'status',
};

function normalizeHeader(header) {
  return String(header || '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function splitLine(line, delimiter) {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current);
  return cells.map((c) => c.trim());
}

// Locations that mark a row as a serialized/pool-tracked unit (one physical item
// checked in/out of an equipment pool) rather than a simple bin quantity — matches
// the export format seen from the ERP balance report. "_OUT" means checked out,
// i.e. not currently available.
const POOL_LOCATION_KEYWORDS = ['pool_sup', 'pool_out', 'pool_ready', 'pool_scrap', 'osmi'];

function isPoolLocation(location) {
  return POOL_LOCATION_KEYWORDS.includes(String(location || '').trim().toLowerCase());
}

// Some exports list the same Part Number on multiple rows — one per bin/lot it's
// stocked in, or one per physical unit for pool-tracked equipment. Each distinct
// (Part Number, Location) pair becomes its own inventory record — a part at two
// different bins stays as two separate rows, so the storeman can see exactly which
// bin has how much rather than one merged, location-ambiguous total. Only rows that
// share BOTH the same part number AND the same location get combined (true
// duplicates — e.g. the same bin listed twice, or two units in the same pool state).
export function aggregateByPartNumber(rows) {
  const order = [];
  const groups = new Map();

  rows.forEach((row, i) => {
    const locationKey = String(row.storageLocation || '').trim().toLowerCase();
    const key = row.partNumber ? `${row.partNumber.trim()}|${locationKey}` : `__row-${i}__`;
    if (!groups.has(key)) {
      groups.set(key, []);
      order.push(key);
    }
    groups.get(key).push(row);
  });

  return order.map((key) => {
    const group = groups.get(key);
    const isPool = isPoolLocation(group[0].storageLocation);
    const isPoolOut = String(group[0].storageLocation || '').trim().toLowerCase() === 'pool_out';

    if (group.length === 1 && !isPool) return group[0];

    let stockOnHand = 0;
    let allocatableStock = 0;

    if (isPool) {
      // Pool-tracked equipment is counted as units, not a raw on-hand quantity —
      // a blank On-hand cell means "1 unit present". POOL_OUT units aren't
      // allocatable; every other pool state is.
      for (const r of group) {
        stockOnHand += r.stockOnHand === '' || r.stockOnHand === undefined ? 1 : Number(r.stockOnHand) || 1;
      }
      allocatableStock = isPoolOut ? 0 : stockOnHand;
    } else {
      for (const r of group) {
        const qty = r.stockOnHand === '' || r.stockOnHand === undefined ? 0 : Number(r.stockOnHand) || 0;
        stockOnHand += qty;
        allocatableStock += r.allocatableStock === '' || r.allocatableStock === undefined ? qty : Number(r.allocatableStock) || 0;
      }
    }

    allocatableStock = Math.max(0, Math.min(allocatableStock, stockOnHand));

    return {
      ...group[0],
      stockOnHand: String(stockOnHand),
      allocatableStock: String(allocatableStock),
    };
  });
}

// Shared by the CSV/paste parser and the direct .xlsx parser: given a header row
// and the data rows (each already split into cells), map them onto our field names,
// then combine any rows sharing the same Part Number.
export function mapSpreadsheetRows(headerCells, dataRowsOfCells) {
  const fieldKeys = headerCells.map((h) => FIELD_ALIASES[normalizeHeader(h)] || null);
  const unmatchedHeaders = headerCells.filter((h, i) => !fieldKeys[i]);

  const rawRows = dataRowsOfCells.map((cells) => {
    const row = {};
    fieldKeys.forEach((key, i) => {
      if (key) row[key] = cells[i] !== undefined && cells[i] !== null ? String(cells[i]).trim() : '';
    });
    if (row.partType) {
      row.partType = /consumable/i.test(row.partType) ? 'Consumable' : 'Returnable';
    }
    return row;
  });

  const rows = aggregateByPartNumber(rawRows);

  return { rows, unmatchedHeaders, sourceRowCount: rawRows.length };
}

export function parseSpreadsheetText(text) {
  const lines = String(text || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim() !== '');

  if (lines.length === 0) {
    return { rows: [], unmatchedHeaders: [] };
  }

  const delimiter = lines[0].includes('\t') ? '\t' : ',';
  const headerCells = splitLine(lines[0], delimiter);
  const dataRowsOfCells = lines.slice(1).map((line) => splitLine(line, delimiter));

  return mapSpreadsheetRows(headerCells, dataRowsOfCells);
}

export const SPREADSHEET_TEMPLATE_HEADERS = [
  'Part Number',
  'Part Description',
  'Part Type',
  'Component Part Number',
  'Component Description',
  'Functional System',
  'Sub-System',
  'Machine Type',
  'Serial Number',
  'Stock On Hand',
  'Allocatable Stock',
  'Minimum Stock Level',
  'Maximum Stock Level',
  'Unit Of Measure',
  'Storage Location',
  'Status',
];
