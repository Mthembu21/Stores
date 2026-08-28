export function flattenIssueItems(issues) {
  return (issues || []).flatMap((issue) =>
    (issue.items || []).map((item) => ({
      ...item,
      itemId: item._id,
      issueId: issue._id,
      issueNumber: issue.issueNumber,
      machineNumber: issue.machineNumber,
      machineType: issue.machineType,
      serviceOrderNumber: issue.serviceOrderNumber,
      workOrderNumber: issue.workOrderNumber,
      riskAssessmentNumber: issue.riskAssessmentNumber,
      location: issue.location,
      section: issue.section,
      workplace: issue.workplace,
      responsibleForeman: issue.responsibleForeman,
      requestorName: issue.requestorName,
      requestorSurname: issue.requestorSurname,
      requestorClockNumber: issue.requestorClockNumber,
      requestorContactNumber: issue.requestorContactNumber,
      justification: issue.justification,
      foremanName: issue.foremanName,
      foremanSurname: issue.foremanSurname,
      storemanName: issue.storemanName,
      storemanSurname: issue.storemanSurname,
      issuedBy: issue.issuedBy,
      issueDate: issue.issueDate,
      issueStatus: issue.status,
    }))
  );
}
