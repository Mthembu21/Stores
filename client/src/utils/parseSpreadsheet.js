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
  stock: 'stockOnHand',
  quantity: 'stockOnHand',
  qty: 'stockOnHand',
  minimumstocklevel: 'minimumStockLevel',
  minlevel: 'minimumStockLevel',
  minstock: 'minimumStockLevel',
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
  const fieldKeys = headerCells.map((h) => FIELD_ALIASES[normalizeHeader(h)] || null);
  const unmatchedHeaders = headerCells.filter((h, i) => !fieldKeys[i]);

  const rows = lines.slice(1).map((line) => {
    const cells = splitLine(line, delimiter);
    const row = {};
    fieldKeys.forEach((key, i) => {
      if (key) row[key] = cells[i] !== undefined ? cells[i] : '';
    });
    if (row.partType) {
      row.partType = /consumable/i.test(row.partType) ? 'Consumable' : 'Returnable';
    }
    return row;
  });

  return { rows, unmatchedHeaders };
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
  'Minimum Stock Level',
  'Unit Of Measure',
  'Storage Location',
  'Status',
];
