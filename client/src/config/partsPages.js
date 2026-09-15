// Mirrors server/src/config/partsPages.js. Pages a Storeman's access can be
// restricted to, and the pageKey each Spare Parts route is protected under.
// True if this user is allowed to see the given Spare Parts page. Users with no
// custom allowedPages list use their normal role-based access (always true here);
// users with a non-empty list are restricted to exactly those page keys.
export function hasPartsPageAccess(user, pageKey) {
  if (!user) return false;
  if (!Array.isArray(user.allowedPages) || user.allowedPages.length === 0) return true;
  return user.allowedPages.includes(pageKey);
}

export const PARTS_PAGES = [
  { key: 'spare-parts', label: 'Parts Dashboard' },
  { key: 'spare-parts/inventory', label: 'Parts Inventory' },
  { key: 'spare-parts/issue', label: 'Issue Parts' },
  { key: 'spare-parts/issue-consumables', label: 'Issue Consumables' },
  { key: 'spare-parts/store-issues', label: 'Store Issues' },
  { key: 'spare-parts/returns', label: 'Returns' },
  { key: 'spare-parts/low-stock', label: 'Low Stock' },
  { key: 'spare-parts/to-order', label: 'Parts To Order' },
  { key: 'spare-parts/movements', label: 'Stock Movements' },
  { key: 'spare-parts/kpi', label: 'Daily KPIs' },
];
