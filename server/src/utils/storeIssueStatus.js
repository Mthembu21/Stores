function deriveItemStatus(quantityRequested, quantityIssued, quantityReturned) {
  if (quantityIssued > 0 && quantityReturned >= quantityIssued) return 'Returned';
  if (quantityIssued <= 0) return 'Awaiting Order';
  if (quantityIssued >= quantityRequested) return 'Issued';
  return 'Partially Issued';
}

function deriveOverallStatus(items) {
  if (items.every((i) => i.status === 'Returned')) return 'Returned';
  if (items.every((i) => i.status === 'Issued')) return 'Issued';
  if (items.every((i) => i.status === 'Awaiting Order')) return 'Awaiting Order';
  return 'Partially Issued';
}

module.exports = { deriveItemStatus, deriveOverallStatus };
