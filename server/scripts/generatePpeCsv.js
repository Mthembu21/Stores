const fs = require('fs');
const path = require('path');
const { CATEGORIES, FOOTWEAR_CATEGORIES, SPREADSHEET_TEMPLATE_HEADERS } = require('./ppeItemsData');

const rows = [SPREADSHEET_TEMPLATE_HEADERS.join(',')];

for (const category of CATEGORIES) {
  const unitOfMeasure = FOOTWEAR_CATEGORIES.has(category.name) ? 'Pair' : 'EA';
  for (const [size, min, max] of category.sizes) {
    const partDescription = `${category.name} - ${size}`;
    // Part Number, Part Description, Part Type, Component Part Number, Component Description,
    // Functional System, Sub-System, Machine Type, Serial Number, Stock On Hand, Allocatable Stock,
    // Minimum Stock Level, Maximum Stock Level, Unit Of Measure, Storage Location, Status
    rows.push(`,"${partDescription}",Consumable,,,,,,,0,0,${min},${max},${unitOfMeasure},,Active`);
  }
}

const outPath = path.join(__dirname, 'output', 'ppe-items.csv');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, rows.join('\n') + '\n');
console.log(`Wrote ${rows.length - 1} rows to ${outPath}`);
