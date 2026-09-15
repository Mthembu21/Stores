import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Table } from '../components/Table';
import {
  useBulkCreateSpareParts,
  useConsumablesTracking,
  useCreateSparePart,
  useDeleteSparePart,
  useRestockSparePart,
  useSpareParts,
  useUpdateSparePart,
} from '../services/spareParts';
import { parseSpreadsheetText, mapSpreadsheetRows, SPREADSHEET_TEMPLATE_HEADERS } from '../utils/parseSpreadsheet';
import { formatDateTime } from '../utils/format';

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
  const csv = `${SPREADSHEET_TEMPLATE_HEADERS.join(',')}\n,Example bracket assembly,Returnable,,,,,,,10,8,2,20,EA,Bin A1,Active\n,Example brake cleaner,Consumable,,,,,,,24,20,6,48,EA,Bin B2,Active\n`;
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
  const [activeTab, setActiveTab] = useState('parts');

  const [search, setSearch] = useState('');
  const [functionalSystem, setFunctionalSystem] = useState('');
  const [subSystem, setSubSystem] = useState('');
  const [machineType, setMachineType] = useState('');
  const [status, setStatus] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [stockFilter, setStockFilter] = useState('');

  const filters = useMemo(
    () => ({
      search: search || undefined,
      functionalSystem: functionalSystem || undefined,
      subSystem: subSystem || undefined,
      machineType: machineType || undefined,
      status: status || undefined,
      storageLocation: storageLocation || undefined,
      stock: stockFilter || undefined,
      // Consumables have their own Consumables Inventory tab
      partType: 'Returnable',
    }),
    [search, functionalSystem, subSystem, machineType, status, storageLocation, stockFilter]
  );

  const { data, isLoading, isError } = useSpareParts(filters);
  const parts = data?.parts || [];

  const createPart = useCreateSparePart();
  const updatePart = useUpdateSparePart();
  const deletePart = useDeleteSparePart();
  const bulkCreateParts = useBulkCreateSpareParts();

  const { data: consumablesData, isLoading: consumablesLoading, isError: consumablesError } = useConsumablesTracking();
  const consumables = consumablesData?.consumables || [];
  const restockPart = useRestockSparePart();

  function handleDelete(part) {
    if (!window.confirm(`Delete "${part.partDescription}" (${part.partNumber})? This cannot be undone.`)) return;
    deletePart.mutate(part._id);
  }

  function handleRestock(part) {
    const raw = window.prompt(`Quantity received for ${part.partNumber} (${part.partDescription}):`);
    if (raw === null) return;
    const quantity = Number(raw);
    if (!(quantity > 0)) {
      window.alert('Enter a quantity greater than 0');
      return;
    }
    const reason = window.prompt('Reason / PO reference (optional):', '') || undefined;
    restockPart.mutate({ id: part._id, quantity, reason });
  }

  function handleSetStock(part) {
    const raw = window.prompt(
      `Set current physical count for ${part.partNumber} (${part.partDescription}):`,
      String(part.stockOnHand)
    );
    if (raw === null) return;
    const next = Number.parseInt(raw, 10);
    if (raw.trim() === '' || Number.isNaN(next) || next < 0) {
      window.alert('Enter a valid number (0 or higher)');
      return;
    }
    updatePart.mutate({ id: part._id, patch: { stockOnHand: next } });
  }

  function handleSetAllocatable(part) {
    const current = part.allocatableStock === null || part.allocatableStock === undefined ? part.stockOnHand : part.allocatableStock;
    const raw = window.prompt(
      `Set allocatable (bookable) quantity for ${part.partNumber} (${part.partDescription}). On Hand is ${part.stockOnHand}:`,
      String(current)
    );
    if (raw === null) return;
    const next = Number.parseInt(raw, 10);
    if (raw.trim() === '' || Number.isNaN(next) || next < 0) {
      window.alert('Enter a valid number (0 or higher)');
      return;
    }
    if (next > part.stockOnHand) {
      window.alert('Allocatable stock cannot exceed Stock On Hand');
      return;
    }
    updatePart.mutate({ id: part._id, patch: { allocatableStock: next } });
  }

  const consumablesColumns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      {
        key: 'stockOnHand',
        header: 'On Hand',
        render: (p) => (
          <div className="flex items-center gap-2">
            <span>{p.stockOnHand}</span>
            <span className={stockBadge(p).className}>{stockBadge(p).label}</span>
          </div>
        ),
      },
      {
        key: 'allocatableStock',
        header: 'Allocatable',
        render: (p) => (p.allocatableStock === null || p.allocatableStock === undefined ? p.stockOnHand : p.allocatableStock),
      },
      { key: 'minimumStockLevel', header: 'Min Level' },
      { key: 'maximumStockLevel', header: 'Max Level' },
      { key: 'unitOfMeasure', header: 'UoM' },
      {
        key: 'lastRestockedAt',
        header: 'Last Restocked',
        render: (p) => (p.lastRestockedAt ? formatDateTime(p.lastRestockedAt) : 'Never'),
      },
      { key: 'lastRestockedQuantity', header: 'Qty Received' },
      {
        key: 'daysSinceRestock',
        header: 'Days Since Restock',
        render: (p) => (p.daysSinceRestock === null ? '—' : p.daysSinceRestock),
      },
      { key: 'issuedSinceRestock', header: 'Issued Since Restock' },
      { key: 'storageLocation', header: 'Location' },
      {
        key: 'actions',
        header: '',
        render: (p) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
              onClick={() => handleSetStock(p)}
              disabled={updatePart.isPending}
              title="Set the stock on hand to match a physical count"
            >
              Set Stock
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
              onClick={() => handleSetAllocatable(p)}
              disabled={updatePart.isPending}
              title="Set how much of On Hand is actually bookable right now"
            >
              Set Allocatable
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
              onClick={() => handleRestock(p)}
              disabled={restockPart.isPending}
              title="Add newly received stock"
            >
              Restock
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-200 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50"
              onClick={() => handleDelete(p)}
              disabled={deletePart.isPending}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [restockPart, updatePart, deletePart]
  );

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

    const isExcel = /\.xlsx?$/i.test(file.name);
    if (isExcel) {
      const reader = new FileReader();
      reader.onload = () => {
        setBulkResult(null);
        try {
          const data = new Uint8Array(reader.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows2d = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (rows2d.length === 0) {
            setBulkText('');
            setBulkRows([]);
            setBulkUnmatchedHeaders([]);
            return;
          }
          const [headerRow, ...dataRows] = rows2d;
          const { rows, unmatchedHeaders } = mapSpreadsheetRows(
            headerRow.map((h) => String(h)),
            dataRows
          );
          setBulkText(`Loaded ${rows.length} row(s) from ${file.name}`);
          setBulkRows(rows);
          setBulkUnmatchedHeaders(unmatchedHeaders);
        } catch (err) {
          setBulkText('');
          setBulkRows([]);
          setBulkUnmatchedHeaders([]);
          window.alert(`Could not read ${file.name}: ${err.message || 'invalid file'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = () => parseBulkText(String(reader.result || ''));
      reader.readAsText(file);
    }
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
  const [serialNumber, setSerialNumber] = useState('');
  const [stockOnHand, setStockOnHand] = useState('0');
  const [allocatableStock, setAllocatableStock] = useState('');
  const [minimumStockLevel, setMinimumStockLevel] = useState('0');
  const [maximumStockLevel, setMaximumStockLevel] = useState('0');
  const [unitOfMeasure, setUnitOfMeasure] = useState('EA');
  const [storageLocationInput, setStorageLocationInput] = useState('');

  const [consumableName, setConsumableName] = useState('');
  const [consumableQuantity, setConsumableQuantity] = useState('0');
  const [consumableMinLevel, setConsumableMinLevel] = useState('0');
  const [consumableMaxLevel, setConsumableMaxLevel] = useState('0');
  const [consumableLocation, setConsumableLocation] = useState('');

  function handleAddConsumable(e) {
    e.preventDefault();
    createPart.mutate(
      {
        partDescription: consumableName,
        partType: 'Consumable',
        stockOnHand: Number(consumableQuantity),
        minimumStockLevel: Number(consumableMinLevel) || 0,
        maximumStockLevel: Number(consumableMaxLevel) || 0,
        unitOfMeasure: 'EA',
        storageLocation: consumableLocation,
      },
      {
        onSuccess: () => {
          setConsumableName('');
          setConsumableQuantity('0');
          setConsumableMinLevel('0');
          setConsumableMaxLevel('0');
          setConsumableLocation('');
        },
      }
    );
  }

  const columns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'functionalSystem', header: 'Functional System' },
      { key: 'subSystem', header: 'Sub-System' },
      { key: 'machineType', header: 'Machine Type' },
      {
        key: 'stockOnHand',
        header: 'On Hand',
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
      {
        key: 'allocatableStock',
        header: 'Allocatable',
        render: (p) => (
          <div className="flex items-center gap-2">
            <span>{p.allocatableStock === null || p.allocatableStock === undefined ? p.stockOnHand : p.allocatableStock}</span>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
              onClick={() => handleSetAllocatable(p)}
              disabled={updatePart.isPending}
              title="Set how much of On Hand is actually bookable right now"
            >
              Set
            </button>
          </div>
        ),
      },
      { key: 'minimumStockLevel', header: 'Min Level' },
      { key: 'maximumStockLevel', header: 'Max Level' },
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
      {
        key: 'actions',
        header: '',
        render: (p) => (
          <button
            type="button"
            className="rounded-lg border border-red-200 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50"
            onClick={() => handleDelete(p)}
            disabled={deletePart.isPending}
          >
            Delete
          </button>
        ),
      },
    ],
    [updatePart, deletePart]
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-gray">Parts Inventory</div>
        <div className="text-sm text-slate-600">Manage spare parts and consumables stock levels and details.</div>
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
            activeTab === 'parts'
              ? 'border-epiroc-yellow text-epiroc-gray'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('parts')}
        >
          Parts Inventory
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-semibold border-b-2 -mb-px transition ${
            activeTab === 'consumables'
              ? 'border-epiroc-yellow text-epiroc-gray'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
          onClick={() => setActiveTab('consumables')}
        >
          Consumables Inventory
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-epiroc-gray">Bulk add {activeTab === 'consumables' ? 'consumables' : 'parts'}</div>
            <div className="text-xs text-slate-500">
              Upload a CSV or Excel (.xlsx) export, or paste rows copied from a spreadsheet. Include a "Part Type"
              column set to Consumable or Returnable to load either from the same file.
            </div>
          </div>
          <button type="button" className="text-xs font-semibold text-epiroc-gray underline" onClick={downloadTemplate}>
            Download CSV template
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Upload CSV or Excel file</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
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

      {activeTab === 'parts' && (
        <>
          <div className="rounded-xl bg-white shadow-soft p-6 max-w-4xl mx-auto">
            <div className="text-sm font-semibold text-epiroc-gray">Add spare part</div>
            <div className="text-xs text-slate-500">Returnable spares and tools that get issued and are expected back.</div>
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createPart.mutate(
                  {
                    partNumber: partNumber || undefined,
                    partDescription,
                    partType: 'Returnable',
                    serialNumber,
                    stockOnHand: Number(stockOnHand),
                    allocatableStock: allocatableStock === '' ? undefined : Number(allocatableStock),
                    minimumStockLevel: Number(minimumStockLevel),
                    maximumStockLevel: Number(maximumStockLevel),
                    unitOfMeasure,
                    storageLocation: storageLocationInput,
                  },
                  {
                    onSuccess: () => {
                      setPartNumber('');
                      setPartDescription('');
                      setSerialNumber('');
                      setStockOnHand('0');
                      setAllocatableStock('');
                      setMinimumStockLevel('0');
                      setMaximumStockLevel('0');
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
                  <label className="text-sm font-medium text-slate-700">Serial number</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Stock on hand</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" value={stockOnHand} onChange={(e) => setStockOnHand(e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Allocatable stock (blank = same as On Hand)</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" value={allocatableStock} onChange={(e) => setAllocatableStock(e.target.value)} placeholder={stockOnHand} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Minimum stock level</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" value={minimumStockLevel} onChange={(e) => setMinimumStockLevel(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Maximum stock level</label>
                  <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" type="number" min="0" value={maximumStockLevel} onChange={(e) => setMaximumStockLevel(e.target.value)} />
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

          <div className="space-y-3">
            <div className="text-sm font-semibold text-epiroc-gray">Parts list</div>

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
            </div>

            {isLoading ? (
              <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading parts...</div>
            ) : isError ? (
              <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load parts</div>
            ) : (
              <Table emptyLabel="No spare parts found" columns={columns} rows={parts} maxHeight="500px" />
            )}
          </div>
        </>
      )}

      {activeTab === 'consumables' && (
        <>
          <div className="rounded-xl bg-white shadow-soft p-6 max-w-4xl mx-auto">
            <div className="text-sm font-semibold text-epiroc-gray">Add consumable</div>
            <div className="text-xs text-slate-500">Oils, grease, filters, PPE — issued but never returned. Just a name and quantity.</div>
            <form className="mt-4 space-y-4" onSubmit={handleAddConsumable}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-700">Name</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    value={consumableName}
                    onChange={(e) => setConsumableName(e.target.value)}
                    placeholder="e.g. Brake cleaner 500ml"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700">Quantity on hand</label>
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                    type="number"
                    min="0"
                    value={consumableQuantity}
                    onChange={(e) => setConsumableQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>
              <details className="text-sm">
                <summary className="cursor-pointer text-epiroc-gray font-medium">More options (optional)</summary>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Minimum stock level</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      type="number"
                      min="0"
                      value={consumableMinLevel}
                      onChange={(e) => setConsumableMinLevel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Maximum stock level</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      type="number"
                      min="0"
                      value={consumableMaxLevel}
                      onChange={(e) => setConsumableMaxLevel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Storage location</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                      value={consumableLocation}
                      onChange={(e) => setConsumableLocation(e.target.value)}
                    />
                  </div>
                </div>
              </details>
              <div className="flex justify-center">
                <button className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60" type="submit" disabled={createPart.isPending}>
                  {createPart.isPending ? 'Adding consumable...' : 'Add consumable'}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold text-epiroc-gray">Consumables Inventory</div>
              <div className="text-xs text-slate-500">
                Remaining stock, min/max levels, last restock, and consumption since then.
              </div>
            </div>

            {consumablesLoading ? (
              <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading consumables...</div>
            ) : consumablesError ? (
              <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load consumables</div>
            ) : (
              <Table
                emptyLabel="No consumables added yet. Use the Add consumable form above."
                columns={consumablesColumns}
                rows={consumables}
                maxHeight="500px"
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
