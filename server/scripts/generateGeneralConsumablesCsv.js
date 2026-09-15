const fs = require('fs');
const path = require('path');
const { SPREADSHEET_TEMPLATE_HEADERS } = require('./ppeItemsData');

const ITEMS = [
  ['Cutting Disc', 50, 200],
  ['Flapper Disc', 30, 50],
  ['Grinding Disc', 30, 100],
  ['Lappies', 10, 150],
  ['Welder Hose Clamps Plastic', 20, 50],
  ['Welder Hose Clamps Metal', 20, 50],
  ['Treaded Tape', 20, 100],
  ['Insulation Tape', 20, 100],
  ['Spark', 12, 72],
  ['Q20', 12, 72],
  ['Lectro Kleen', 12, 72],
  ['Q Bond', 10, 24],
  ['Loctite', 10, 30],
  ['Handcleaner', 10, 30],
  ['AA Batteries', 10, 30],
  ['AAA Batteries', 10, 30],
  ['9V Batteries', 10, 20],
  ['Pratley Steel Green', 6, 20],
  ['Pratley Steel Black', 6, 20],
  ['Barrier Tape 500m', 4, 10],
  ['Meg Wire', 4, 10],
  ['Hacksaw Blades', 20, 100],
  ['Fluke Test Leads', 5, 20],
  ['Cable Ties 5x400', 20, 50],
  ['Cable Ties 5x300', 20, 50],
  ['Cable Ties 5x200', 20, 50],
  ['Cable Ties 4x150', 20, 50],
  ['Flint Lighter', 4, 10],
  ['Gasket Maker', 4, 15],
  ['Silicone', 4, 12],
  ['Boilermaker Chalk', 50, 144],
  ['Croc Type E/Clamp', 2, 6],
  ['Coupler Spring Loaded', 4, 10],
  ['Electrical Contact Lube', 4, 8],
  ['Spraypaint Black', 12, 48],
  ['Spraypaint Red', 12, 48],
  ['Spraypaint Yellow', 12, 48],
  ['Spraypaint Green', 12, 48],
  ['Spraypaint White', 12, 48],
  ['Plasma Cutters', 2, 5],
  ['Crack Test Agent', 6, 12],
  ['Castor Solid Rubber wheel 200mm', 2, 4],
  ['Plastic Bags (service kits)', 50, 500],
  ['American Lock Green(Key-different)', 12, 48],
  ['American Lock Purple(Key-different)', 12, 48],
  ['American Lock Blue(Key-different)', 12, 48],
  ['American Lock Red(Key-different)', 12, 48],
  ['American Lock Brown(Key-different)', 12, 48],
  ['American Lock Gold (Key-alike)', 12, 48],
  ['American Lock Black (Key-alike)', 12, 48],
  ['Unplanned Maintenance WO Book', 100, 500],
  ['Backlog Book', 100, 500],
  ['Service Exchange Book', 20, 50],
  ['Maintenance WO Book', 100, 500],
  ['Crane Lock Out Key Control Book', 10, 20],
  ['EDG Register', 10, 20],
  ['Boretech Register', 10, 20],
  ['Cylinders Register', 10, 20],
  ['Batteries Register', 10, 20],
  ['Cummins Register', 10, 20],
  ['Screens Register', 10, 20],
  ['Modules Register', 10, 20],
  ['Propshafts Register', 10, 20],
  ['Remotes Register', 10, 20],
];

const rows = [SPREADSHEET_TEMPLATE_HEADERS.join(',')];

for (const [partDescription, min, max] of ITEMS) {
  // Part Number, Part Description, Part Type, Component Part Number, Component Description,
  // Functional System, Sub-System, Machine Type, Serial Number, Stock On Hand,
  // Minimum Stock Level, Maximum Stock Level, Unit Of Measure, Storage Location, Status
  rows.push(`,"${partDescription}",Consumable,,,,,,,0,${min},${max},EA,,Active`);
}

const outPath = path.join(__dirname, 'output', 'general-consumables-part-stores-cleaned.csv');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, rows.join('\n') + '\n');
console.log(`Wrote ${rows.length - 1} rows to ${outPath}`);
