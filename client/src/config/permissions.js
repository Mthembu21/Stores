export const APP_ROLES = ['Admin', 'ToolsStoreman', 'PartsStoreman', 'Supervisor', 'SHEQ', 'DAAWarehouse'];

export const MODULE_ROLES = {
  tools: ['Admin', 'ToolsStoreman'],
  spareParts: ['Admin', 'PartsStoreman', 'Supervisor'],
  admin: ['Admin', 'ToolsStoreman'],
  specialTools: ['Admin', 'ToolsStoreman', 'SHEQ'],
  sheq: ['Admin', 'SHEQ'],
  daa: ['Admin', 'DAAWarehouse'],
};
