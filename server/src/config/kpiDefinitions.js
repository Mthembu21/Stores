// Each measure is one of:
//  - 'check'  a daily yes/no confirmation
//  - 'ratio'  "X of Y" — a percentage is computed from the two numbers
//  - 'count'  a plain running number with no percentage (e.g. incidents, LTI days)
const KPI_CATEGORIES = [
  {
    key: 'receiving',
    label: 'Receiving',
    measures: [
      { key: 'linesReceivedQuality', label: 'Lines Received Quality', description: 'Lines received without damage or defects', type: 'ratio' },
      { key: 'receivingAccuracy', label: 'Accuracy', description: 'Physical items received matches paperwork and system entries', type: 'ratio' },
      { key: 'nonConformance', label: 'Non-Conformance Reporting', description: 'Number of discrepancies logged (damage, shortages, over supply)', type: 'count' },
      { key: 'putAwaySpeed', label: 'Put-Away Speed', description: 'Line items put away within 24 hours of receipt', type: 'ratio' },
      { key: 'binLocationRecording', label: 'Bin Location Recording', description: 'Line items with bin locations correctly written on delivery notes', type: 'ratio' },
    ],
  },
  {
    key: 'dispatching',
    label: 'Dispatching',
    measures: [
      { key: 'dispatchAccuracy', label: 'Physical Dispatch Accuracy', description: 'Line items dispatched correctly against system records', type: 'ratio' },
      { key: 'dispatchBooksSigned', label: 'Dispatch', description: 'Books signed daily for dispatch approval (OOC machines)', type: 'check' },
      { key: 'inContractMachineParts', label: 'In-Contract Machine Parts', description: 'Line items of in-contract machine parts dispatched on time and accurately', type: 'ratio' },
      { key: 'returnsProcessed', label: 'Return', description: 'Returns written and subtracted from the M3', type: 'check' },
    ],
  },
  {
    key: 'picking',
    label: 'Picking',
    measures: [
      { key: 'pickingAccuracy', label: 'Picking Accuracy', description: 'Lines picked correctly (no errors in item, quantity or location)', type: 'ratio' },
      { key: 'pickingCompliance', label: 'Picking Compliance', description: 'Picking completed following the process (ticked, signed, date)', type: 'check' },
      { key: 'reportedErrors', label: 'Reported Errors', description: 'Items not available, items damaged', type: 'count' },
    ],
  },
  {
    key: 'housekeeping',
    label: 'Housekeeping',
    measures: [
      { key: 'externalStoreArea', label: 'External Store Area', description: 'Cleanliness, labeling, and accessibility outside the store', type: 'check' },
      { key: 'ppeStore', label: 'PPE Store', description: 'PPE items stored correctly, labeling, accessible, and compliant with safety standards', type: 'check' },
      { key: 'internalStoreArea', label: 'Internal Store Area', description: 'Cleanliness, labeling, and accessibility inside the store', type: 'check' },
      { key: 'boltsNutsSection', label: 'Bolts & Nuts Section', description: 'Proper segregation, cleanliness, labeling, and replenishment checks', type: 'check' },
      { key: 'edgCage', label: 'EDG Cage', description: 'Security, cleanliness, accessibility, labeling, and replenishment checks', type: 'check' },
      { key: 'cupboardsConsumables', label: 'Cupboards & Consumables', description: 'Orderly, cleanliness, and labeling', type: 'check' },
      { key: 'consumableStore', label: 'Consumable Store', description: 'Consumables available', type: 'check' },
    ],
  },
  {
    key: 'safety',
    label: 'Safety',
    measures: [
      { key: 'ppeCompliance', label: 'PPE Compliance', description: 'Staff wearing correct PPE during operations', type: 'check' },
      { key: 'incidentReporting', label: 'Incident Reporting', description: 'Number of near-misses, accidents, or hazards reported', type: 'count' },
      { key: 'correctiveActions', label: 'Corrective Actions', description: 'Safety issues resolved', type: 'ratio' },
      { key: 'ptoVflCompliance', label: 'Compliance', description: 'PTO and VFL completed for the week', type: 'check' },
      { key: 'auditScores', label: 'Audit Scores', description: 'Results of internal/external safety audits', type: 'ratio' },
      { key: 'zeroHarmTarget', label: 'Zero Harm Target', description: 'Days without lost-time injury (LTI)', type: 'count' },
    ],
  },
];

const KPI_MEASURES = KPI_CATEGORIES.flatMap((cat) => cat.measures.map((m) => ({ ...m, categoryKey: cat.key })));

// A measure "counts" toward its category's percentage only once it actually has data
// for the day — an unanswered check or an empty ratio is excluded, not scored as 0.
function measureScore(def, data) {
  if (!data) return null;
  if (def.type === 'check') {
    if (data.confirmed === null || data.confirmed === undefined) return null;
    return data.confirmed ? 100 : 0;
  }
  if (def.type === 'ratio') {
    const denominator = Number(data.denominator);
    const numerator = Number(data.numerator);
    if (!denominator || Number.isNaN(denominator) || Number.isNaN(numerator)) return null;
    return Math.max(0, Math.min(100, (numerator / denominator) * 100));
  }
  return null; // 'count' measures don't contribute a percentage
}

function computeCategoryScore(category, measuresData) {
  const scores = category.measures
    .map((def) => measureScore(def, measuresData?.[def.key]))
    .filter((s) => s !== null);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

function computeOverallScore(measuresData) {
  const scores = KPI_CATEGORIES.map((cat) => computeCategoryScore(cat, measuresData)).filter((s) => s !== null);
  if (scores.length === 0) return null;
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

module.exports = { KPI_CATEGORIES, KPI_MEASURES, measureScore, computeCategoryScore, computeOverallScore };
