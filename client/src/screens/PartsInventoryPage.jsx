import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useCreateSparePart, useSpareParts, useUpdateSparePart } from '../services/spareParts';

function stockBadge(part) {
  if (part.stockOnHand <= 0) return { label: 'OUT OF STOCK', className: 'text-red-600 font-semibold' };
  if (part.stockOnHand <= part.minimumStockLevel) return { label: 'LOW STOCK', className: 'text-epiroc-yellow font-semibold' };
  return { label: 'OK', className: 'text-green-600 font-semibold' };
}

export default function PartsInventoryPage() {
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
    }),
    [search, functionalSystem, subSystem, machineType, status, storageLocation, stockFilter]
  );

  const { data, isLoading, isError } = useSpareParts(filters);
  const parts = data?.parts || [];

  const createPart = useCreateSparePart();
  const updatePart = useUpdateSparePart();

  const [partNumber, setPartNumber] = useState('');
  const [partDescription, setPartDescription] = useState('');
  const [componentPartNumber, setComponentPartNumber] = useState('');
  const [componentDescription, setComponentDescription] = useState('');
  const [functionalSystemInput, setFunctionalSystemInput] = useState('');
  const [subSystemInput, setSubSystemInput] = useState('');
  const [machineTypeInput, setMachineTypeInput] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [stockOnHand, setStockOnHand] = useState('0');
  const [minimumStockLevel, setMinimumStockLevel] = useState('0');
  const [unitOfMeasure, setUnitOfMeasure] = useState('EA');
  const [storageLocationInput, setStorageLocationInput] = useState('');

  const columns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'componentPartNumber', header: 'Component #' },
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
                componentPartNumber,
                componentDescription,
                functionalSystem: functionalSystemInput,
                subSystem: subSystemInput,
                machineType: machineTypeInput,
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
                  setComponentPartNumber('');
                  setComponentDescription('');
                  setFunctionalSystemInput('');
                  setSubSystemInput('');
                  setMachineTypeInput('');
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
              <label className="text-sm font-medium text-slate-700">Component part number</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={componentPartNumber} onChange={(e) => setComponentPartNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Component description</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={componentDescription} onChange={(e) => setComponentDescription(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Functional system</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={functionalSystemInput} onChange={(e) => setFunctionalSystemInput(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Sub-system</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={subSystemInput} onChange={(e) => setSubSystemInput(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Machine type</label>
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2" value={machineTypeInput} onChange={(e) => setMachineTypeInput(e.target.value)} />
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

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Parts list</div>

        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <label className="text-xs font-semibold text-slate-600">Search (part #, description, component #)</label>
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
    </div>
  );
}
