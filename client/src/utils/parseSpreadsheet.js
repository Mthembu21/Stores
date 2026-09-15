const FIELD_ALIASES = {
  partnumber: 'partNumber',
  'partno': 'partNumber',
  'part#': 'partNumber',
  partdescription: 'partDescription',
  description: 'partDescription',
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
  stockonhand: 'stockOnHand',
  onhand: 'stockOnHand',
  stock: 'stockOnHand',
  quantity: 'stockOnHand',
  qty: 'stockOnHand',
  allocatablestock: 'allocatableStock',
  allocatable: 'allocatableStock',
  allocatableqty: 'allocatableStock',
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

// Shared by the CSV/paste parser and the direct .xlsx parser: given a header row
// and the data rows (each already split into cells), map them onto our field names.
export function mapSpreadsheetRows(headerCells, dataRowsOfCells) {
  const fieldKeys = headerCells.map((h) => FIELD_ALIASES[normalizeHeader(h)] || null);
  const unmatchedHeaders = headerCells.filter((h, i) => !fieldKeys[i]);

  const rows = dataRowsOfCells.map((cells) => {
    const row = {};
    fieldKeys.forEach((key, i) => {
      if (key) row[key] = cells[i] !== undefined && cells[i] !== null ? String(cells[i]).trim() : '';
    });
    if (row.partType) {
      row.partType = /consumable/i.test(row.partType) ? 'Consumable' : 'Returnable';
    }
    return row;
  });

  return { rows, unmatchedHeaders };
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
