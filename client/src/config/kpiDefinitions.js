export const KPI_DEFINITIONS = [
  {
    key: 'receivingAccuracy',
    label: 'Receiving Accuracy and System Receipt',
    description: '% of inbound shipments received without errors',
    target: 99,
    unit: '%',
    direction: 'higher',
  },
  {
    key: 'putAwayTime',
    label: 'Put-Away Time',
    description: 'Time from receiving to bin location',
    target: 3,
    unit: 'hours',
    direction: 'lower',
  },
  {
    key: 'pickingAccuracy',
    label: 'Picking Accuracy',
    description: '% of picks completed without error',
    target: 99,
    unit: '%',
    direction: 'higher',
  },
  {
    key: 'despatchTime',
    label: 'Despatch (physical and system)',
    description: 'Time from physical despatch to system despatch',
    target: 24,
    unit: 'hours',
    direction: 'lower',
  },
  {
    key: 'cycleCount',
    label: 'Cycle Count',
    description: 'Daily variances recorded',
    target: 100,
    unit: '%',
    direction: 'higher',
  },
  {
    key: 'stockAccuracy',
    label: 'Stock Accuracy',
    description: 'Physical matching system',
    target: 100,
    unit: '%',
    direction: 'higher',
  },
  {
    key: 'housekeeping',
    label: 'Housekeeping (5S)',
    description:
      'Sort, Set in order, Clean, Standardize, Sustain — daily workstation, aisle checks, PPE store, consumables cupboard and outside',
    target: 100,
    unit: '%',
    direction: 'higher',
  },
  {
    key: 'safetyChecks',
    label: 'Safety Checks',
    description: 'PPE compliance, equipment process, SLAM',
    target: 100,
    unit: '%',
    direction: 'higher',
  },
];

export function formatTarget(def) {
  if (def.unit === '%') return `${def.target}%`;
  return def.direction === 'lower' ? `≤ ${def.target} ${def.unit}` : `${def.target} ${def.unit}`;
}

export function meetsTarget(def, value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  if (Number.isNaN(num)) return null;
  return def.direction === 'lower' ? num <= def.target : num >= def.target;
}
