const SPREADSHEET_TEMPLATE_HEADERS = [
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

const FOOTWEAR_CATEGORIES = new Set([
  'Bova Neoflex',
  'Dromex Bolt Boot',
  'Rebel Trakka Boilermaker',
  'Lukas Safety Shoes',
  'Gumboots',
  'Gloves',
]);

const CATEGORIES = [
  {
    name: 'Overalls - ARC',
    sizes: [
      ['28/32', 2, 4],
      ['30/34', 3, 6],
      ['32/36', 0, 0],
      ['34/38', 5, 10],
      ['36/40', 4, 7],
      ['38/42', 2, 4],
      ['40/44', 4, 6],
      ['42/46', 2, 4],
      ['44/48', 2, 4],
      ['46/50', 2, 4],
      ['48/52', 3, 6],
      ['50/54', 2, 4],
      ['54/58', 2, 4],
    ],
  },
  {
    name: 'Overalls - Sasol Spec',
    sizes: [
      ['28/32', 2, 4],
      ['30/34', 2, 6],
      ['32/36', 3, 8],
      ['34/38', 3, 8],
      ['36/40', 3, 8],
      ['38/42', 3, 8],
      ['40/44', 3, 8],
      ['42/46', 3, 8],
      ['44/48', 3, 8],
      ['46/50', 3, 8],
      ['48/52', 3, 8],
      ['50/54', 3, 6],
      ['52/56', 2, 4],
      ['54/58', 2, 4],
    ],
  },
  {
    name: 'Overalls - Safety Pink',
    sizes: [
      ['48/52 ARCH', 2, 4],
      ['34/38 SASOL', 2, 4],
    ],
  },
  {
    name: 'Overalls - Yellow Safety',
    sizes: [
      ['32/36', 2, 4],
      ['38/42', 2, 4],
    ],
  },
  {
    name: 'Bova Neoflex',
    sizes: [
      ['#3', 1, 2],
      ['#4', 1, 2],
      ['#5', 1, 2],
      ['#6', 2, 6],
      ['#7', 2, 10],
      ['#8', 2, 10],
      ['#9', 2, 10],
      ['#10', 2, 10],
      ['#11', 2, 6],
      ['#12', 2, 6],
      ['#13', 1, 4],
    ],
  },
  {
    name: 'Dromex Bolt Boot',
    sizes: [
      ['#4', 1, 2],
      ['#5', 1, 2],
      ['#6', 2, 4],
      ['#7', 2, 4],
      ['#8', 2, 8],
      ['#9', 2, 9],
      ['#10', 2, 5],
      ['#11', 2, 3],
      ['#12', 1, 2],
      ['#13', 1, 2],
    ],
  },
  {
    name: 'Rebel Trakka Boilermaker',
    sizes: [
      ['#7', 2, 4],
      ['#8', 1, 2],
    ],
  },
  {
    name: 'Lukas Safety Shoes',
    sizes: [['US #17 2E Wide', 1, 4]],
  },
  {
    name: 'Gumboots',
    sizes: [
      ['#3', 2, 5],
      ['#5 Wideleg', 3, 10],
      ['#6 Wideleg', 3, 10],
    ],
  },
  {
    name: 'Gloves',
    sizes: [
      ['#7', 432, 1440],
      ['#8', 432, 1440],
      ['#9', 432, 1440],
      ['#10', 432, 1440],
      ['#11', 432, 1440],
    ],
  },
];

module.exports = { CATEGORIES, FOOTWEAR_CATEGORIES, SPREADSHEET_TEMPLATE_HEADERS };
