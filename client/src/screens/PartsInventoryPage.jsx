import { useMemo, useRef, useState } from 'react';
import { Table } from '../components/Table';
import { useBulkCreateSpareParts, useCreateSparePart, useSpareParts, useUpdateSparePart } from '../services/spareParts';
import { parseSpreadsheetText, SPREADSHEET_TEMPLATE_HEADERS } from '../utils/parseSpreadsheet';

function stockBadge(part) {
  if (part.stockOnHand <= 0) return { label: 'OUT OF STOCK', className: 'text-red-600 font-semibold' };
  if (part.stockOnHand <= part.minimumStockLevel) return { label: 'LOW STOCK', className: 'text-epiroc-yellow font-semibold' };
  return { label: 'OK', className: 'text-green-600 font-semibold' };
}

function bulkRowError(row) {
  if (!row.partDescription || !row.partDescription.trim()) return 'Missing part description';
  if (row.stockOnHand !== undefined && row.stockOnHand !== '' && Number.isNaN(Number(row.stockOnHand))) {
    return 'Invalid stock on hand';
  }
  return null;
}

function downloadTemplate() {
  const csv = `${SPREADSHEET_TEMPLATE_HEADERS.join(',')}\n,Example bracket assembly,Returnable,,,,,,,10,2,EA,Bin A1,Active\n,Example brake cleaner,Consumable,,,,,,,24,6,EA,Bin B2,Active\n`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'spare-parts-template.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function PartsInventoryPage() {
  const [search, setSearch] = useState('');
  const [functionalSystem, setFunctionalSystem] = useState('');
  const [subSystem, setSubSystem] = useState('');
  const [machineType, setMachineType] = useState('');
  const [status, setStatus] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [partTypeFilter, setPartTypeFilter] = useState('');

  const filters = useMemo(
    () => ({
      search: search || undefined,
      functionalSystem: functionalSystem || undefined,
      subSystem: subSystem || undefined,
      machineType: machineType || undefined,
      status: status || undefined,
      storageLocation: storageLocation || undefined,
      stock: stockFilter || undefined,
      partType: partTypeFilter || undefined,
    }),
    [search, functionalSystem, subSystem, machineType, status, storageLocation, stockFilter, partTypeFilter]
  );

  const { data, isLoading, isError } = useSpareParts(filters);
  const parts = data?.parts || [];

  const createPart = useCreateSparePart();
  const updatePart = useUpdateSparePart();
  const bulkCreateParts = useBulkCreateSpareParts();

  const fileInputRef = useRef(null);
  const [bulkText, setBulkText] = useState('');
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkUnmatchedHeaders, setBulkUnmatchedHeaders] = useState([]);
  const [bulkResult, setBulkResult] = useState(null);

  function parseBulkText(text) {
    setBulkText(text);
    setBulkResult(null);
    const { rows, unmatchedHeaders } = parseSpreadsheetText(text);
    setBulkRows(rows);
    setBulkUnmatchedHeaders(unmatchedHeaders);
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => parseBulkText(String(reader.result || ''));
    reader.readAsText(file);
  }

  const bulkValidRows = useMemo(() => bulkRows.filter((r) => !bulkRowError(r)), [bulkRows]);

  function handleBulkUpload() {
    if (bulkValidRows.length === 0) return;
    bulkCreateParts.mutate(bulkValidRows, {
      onSuccess: (data) => {
        setBulkResult(data);
        setBulkText('');
        setBulkRows([]);
        setBulkUnmatchedHeaders([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  }

  const [partNumber, setPartNumber] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [partTypeInput, setPartTypeInput] = useState('Returnable');
  const [serialNumber, setSerialNumber] = useState('');
  const [stockOnHand, setStockOnHand] = useState('0');
  const [minimumStockLevel, setMinimumStockLevel] = useState('0');
  const [unitOfMeasure, setUnitOfMeasure] = useState('EA');
  const [storageLocationInput, setStorageLocationInput] = useState('');

  const columns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'partType', header: 'Type' },
      { key: 'functionalSystem', header: 'Functional System' },
      { key: 'subSystem', header: 'Sub-System' },
      { key: 'machineType', header: 'Machine Type' },
      {
        key: 'stockOnHand',
        header: 'Stock',
        render: (p) => (
          <div className="flex items-center gap-2">
            <span>{p.stockOnHand}</span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
              onClick={() => {
                const raw = window.prompt('Set new Stock On Hand:', String(p.stockOnHand));
                if (raw === null) return;
                const next = Number.parseInt(raw, 10);
                if (raw.trim() === '' || Number.isNaN(next) || next < 0) return;
                updatePart.mutate({ id: p._id, patch: { stockOnHand: next } });
              }}
              disabled={updatePart.isPending}
            >
              Set
            </button>
          </div>
        ),
      },
      { key: 'minimumStockLevel', header: 'Min Level' },
      { key: 'unitOfMeasure', header: 'UoM' },
      { key: 'storageLocation', header: 'Location' },
      { key: 'status', header: 'Status' },
      {
        key: 'stockStatus',
        header: 'Stock Status',
        render: (p) => {
          const badge = stockBadge(p);
          return <span className={badge.className}>{badge.label}</span>;
        },
      },
    ],
    [updatePart]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Parts Inventory</div>
        <div className="text-sm text-slate-600">Manage spare parts stock levels and details.</div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Add spare part</div>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            createPart.mutate(
              {
                partNumber: partNumber || undefined,
                partDescription,
                partType: partTypeInput,
                serialNumber,
                stockOnHand: Number(stockOnHand),
                minimumStockLevel: Number(minimumStockLevel),
                unitOfMeasure,
                storageLocation: storageLocationInput,
              },
              {
                onSuccess: () => {
                  setPartNumber('');
                  setPartDescription('');
                  setPartTypeInput('Returnable');
                  setSerialNumber('');
                  setStockOnHand('0');
                  setMinimumStockLevel('0');
                  setStorageLocationInput('');
                },
              }
            );
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Part number (leave blank to auto-generate)</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} placeholder="e.g. SP-00001" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Part description</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={partDescription} onChange={(e) => setPartDescription(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Part type</label>
              <select className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={partTypeInput} onChange={(e) => setPartTypeInput(e.target.value)}>
                <option value="Returnable">Returnable (spares, tools)</option>
                <option value="Consumable">Consumable (used up, not returned)</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Serial number</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Stock on hand</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" value={stockOnHand} onChange={(e) => setStockOnHand(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Minimum stock level</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" value={minimumStockLevel} onChange={(e) => setMinimumStockLevel(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Unit of measure</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={unitOfMeasure} onChange={(e) => setUnitOfMeasure(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Storage location</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={storageLocationInput} onChange={(e) => setStorageLocationInput(e.target.value)} />
            </div>
          </div>

          <div className="flex justify-center">
            <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={createPart.isPending}>
              {createPart.isPending ? 'Adding part...' : 'Add part'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-epiroc-blue">Bulk add parts</div>
            <div className="text-xs text-slate-500">
              Upload a CSV export, or paste rows copied from a spreadsheet. Include a "Part Type" column set to
              Consumable or Returnable to load consumable stock in one go.
            </div>
          </div>
          <button type="button" className="text-xs font-semibold text-epiroc-blue underline" onClick={downloadTemplate}>
            Download CSV template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Upload CSV file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="mt-1 w-full text-sm"
              onChange={handleFileChange}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">...or paste from Excel/Sheets</label>
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-mono"
              rows={4}
              placeholder={'Part Number\tPart Description\tStock On Hand\t...'}
              value={bulkText}
              onChange={(e) => parseBulkText(e.target.value)}
            />
          </div>
        </div>

        {bulkUnmatchedHeaders.length > 0 && (
          <div className="text-xs text-epiroc-yellow">
            Unrecognized column(s) ignored: {bulkUnmatchedHeaders.join(', ')}
          </div>
        )}

        {bulkRows.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">
              {bulkValidRows.length} of {bulkRows.length} row(s) ready to import
              {bulkRows.length - bulkValidRows.length > 0 ? ` (${bulkRows.length - bulkValidRows.length} will be skipped)` : ''}
            </div>
            <div className="max-h-64 overflow-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-2 py-1">#</th>
                    <th className="text-left px-2 py-1">Part Number</th>
                    <th className="text-left px-2 py-1">Description</th>
                    <th className="text-left px-2 py-1">Type</th>
                    <th className="text-left px-2 py-1">Stock</th>
                    <th className="text-left px-2 py-1">UoM</th>
                    <th className="text-left px-2 py-1">Location</th>
                    <th className="text-left px-2 py-1">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {bulkRows.map((row, i) => {
                    const error = bulkRowError(row);
                    return (
                      <tr key={i} className={error ? 'bg-red-50' : ''}>
                        <td className="px-2 py-1">{i + 1}</td>
                        <td className="px-2 py-1">{row.partNumber || <span className="text-slate-400">auto</span>}</td>
                        <td className="px-2 py-1">{row.partDescription}</td>
                        <td className="px-2 py-1">{row.partType || 'Returnable'}</td>
                        <td className="px-2 py-1">{row.stockOnHand}</td>
                        <td className="px-2 py-1">{row.unitOfMeasure}</td>
                        <td className="px-2 py-1">{row.storageLocation}</td>
                        <td className="px-2 py-1 text-red-600">{error}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
                disabled={bulkValidRows.length === 0 || bulkCreateParts.isPending}
                onClick={handleBulkUpload}
              >
                {bulkCreateParts.isPending ? 'Uploading...' : `Upload ${bulkValidRows.length} part(s)`}
              </button>
            </div>
          </div>
        )}

        {bulkResult && (
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1">
            <div className="font-semibold text-slate-700">
              {bulkResult.createdCount} part(s) created, {bulkResult.errorCount} skipped
            </div>
            {bulkResult.errors?.length > 0 && (
              <ul className="list-disc pl-4 text-red-600">
                {bulkResult.errors.map((e, i) => (
                  <li key={i}>Row {e.row}{e.partNumber ? ` (${e.partNumber})` : ''}: {e.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Parts list</div>

        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Search (part #, description)</label>
            <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="e.g. SP-00001 / filter" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Functional system</label>
            <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={functionalSystem} onChange={(e) => setFunctionalSystem(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Sub-system</label>
            <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={subSystem} onChange={(e) => setSubSystem(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Machine type</label>
            <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={machineType} onChange={(e) => setMachineType(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Storage location</label>
            <input className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={storageLocation} onChange={(e) => setStorageLocation(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Status</label>
            <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Obsolete">Obsolete</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Stock</label>
            <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
              <option value="">All</option>
              <option value="low">Low stock</option>
              <option value="out">Out of stock</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600">Part type</label>
            <select className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" value={partTypeFilter} onChange={(e) => setPartTypeFilter(e.target.value)}>
              <option value="">All</option>
              <option value="Returnable">Returnable</option>
              <option value="Consumable">Consumable</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading parts...</div>
        ) : isError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load parts</div>
        ) : (
          <Table emptyLabel="No spare parts found" columns={columns} rows={parts} maxHeight="500px" />
        )}
      </div>
    </div>
  );
}
