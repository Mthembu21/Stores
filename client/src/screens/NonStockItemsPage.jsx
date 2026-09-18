import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Table } from '../components/Table';
import { useNonStockItems, useBulkImportNonStockItems, useDeleteNonStockItem } from '../services/nonStockItems';
import { mapNonStockItemRows } from '../utils/parseNonStockItems';

export default function NonStockItemsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError } = useNonStockItems({ search: search || undefined });
  const items = useMemo(() => (data?.items || []).map((i) => ({ ...i, id: i._id })), [data]);

  const deleteItem = useDeleteNonStockItem();
  const bulkImport = useBulkImportNonStockItems();

  const fileInputRef = useRef(null);
  const [bulkRows, setBulkRows] = useState([]);
  const [bulkUnmatchedHeaders, setBulkUnmatchedHeaders] = useState([]);
  const [bulkSourceRowCount, setBulkSourceRowCount] = useState(null);
  const [bulkFileName, setBulkFileName] = useState('');

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBulkFileName(file.name);
    const isExcel = /\.xlsx?$/i.test(file.name);
    const reader = new FileReader();

    reader.onload = () => {
      try {
        let headerRow;
        let dataRows;

        if (isExcel) {
          const wbData = new Uint8Array(reader.result);
          const workbook = XLSX.read(wbData, { type: 'array' });
          const sheet = workbook.Sheets[workbook.SheetNames[0]];
          const rows2d = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
          if (rows2d.length === 0) throw new Error('Empty file');
          [headerRow, ...dataRows] = rows2d;
          headerRow = headerRow.map((h) => String(h));
        } else {
          const lines = String(reader.result || '')
            .replace(/\r\n/g, '\n')
            .split('\n')
            .filter((line) => line.trim() !== '');
          if (lines.length === 0) throw new Error('Empty file');
          const delimiter = lines[0].includes('\t') ? '\t' : ',';
          headerRow = lines[0].split(delimiter).map((h) => h.trim());
          dataRows = lines.slice(1).map((line) => line.split(delimiter).map((c) => c.trim()));
        }

        const { rows, unmatchedHeaders, sourceRowCount } = mapNonStockItemRows(headerRow, dataRows);
        setBulkRows(rows);
        setBulkUnmatchedHeaders(unmatchedHeaders);
        setBulkSourceRowCount(sourceRowCount ?? null);
      } catch (err) {
        setBulkRows([]);
        setBulkUnmatchedHeaders([]);
        setBulkSourceRowCount(null);
        window.alert(`Could not read ${file.name}: ${err.message || 'invalid file'}`);
      }
    };

    if (isExcel) reader.readAsArrayBuffer(file);
    else reader.readAsText(file);
  }

  const bulkValidRows = useMemo(() => bulkRows.filter((r) => r.partNumber && r.partDescription), [bulkRows]);

  function handleBulkUpload() {
    if (bulkValidRows.length === 0) return;
    bulkImport.mutate(bulkValidRows, {
      onSuccess: () => {
        setBulkRows([]);
        setBulkUnmatchedHeaders([]);
        setBulkSourceRowCount(null);
        setBulkFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
    });
  }

  function handleDelete(item) {
    if (window.confirm(`Remove "${item.partDescription}" (${item.partNumber}) from the non-stock catalog?`)) {
      deleteItem.mutate(item._id);
    }
  }

  const columns = useMemo(
    () => [
      { key: 'partNumber', header: 'Part Number' },
      { key: 'partDescription', header: 'Description' },
      { key: 'supplier', header: 'Supplier' },
      { key: 'leadTimeDays', header: 'Lead Time (days)', render: (i) => (i.leadTimeDays === null ? '—' : i.leadTimeDays) },
      { key: 'unitCost', header: 'Unit Cost', render: (i) => (i.unitCost === null ? '—' : i.unitCost) },
      { key: 'pickClass', header: 'Pick Class' },
      {
        key: 'actions',
        header: '',
        render: (i) => (
          <button
            type="button"
            className="rounded-lg border border-red-200 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50"
            onClick={() => handleDelete(i)}
            disabled={deleteItem.isPending}
          >
            Delete
          </button>
        ),
      },
    ],
    [deleteItem]
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-gray">Non-Stock Items</div>
        <div className="text-sm text-slate-600">
          A reference catalog of items the ERP knows about that aren't normally kept in stock. Search this list
          from "Flag a part to order" on the Parts To Order page when a technician asks for something we don't
          usually stock.
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6 space-y-4">
        <div className="text-sm font-semibold text-epiroc-gray">Import from ERP export</div>
        <div className="text-xs text-slate-500">
          Upload the item-master CSV/Excel export. Re-uploading a refreshed export updates existing entries and
          adds new ones — nothing gets deleted.
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="w-full text-sm"
          onChange={handleFileChange}
        />

        {bulkUnmatchedHeaders.length > 0 && (
          <div className="text-xs text-epiroc-yellow">
            Unrecognized column(s) ignored: {bulkUnmatchedHeaders.join(', ')}
          </div>
        )}

        {bulkRows.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-slate-600">
              Loaded {bulkFileName}: {bulkSourceRowCount} row(s) → {bulkValidRows.length} valid item(s) ready to
              import{bulkRows.length - bulkValidRows.length > 0 ? ` (${bulkRows.length - bulkValidRows.length} skipped)` : ''}
            </div>
            <div className="flex justify-center">
              <button
                type="button"
                className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
                disabled={bulkValidRows.length === 0 || bulkImport.isPending}
                onClick={handleBulkUpload}
              >
                {bulkImport.isPending ? 'Importing...' : `Import ${bulkValidRows.length} item(s)`}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
          <label className="text-xs font-semibold text-slate-600">Search (part #, description)</label>
          <input
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
        ) : isError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load non-stock items</div>
        ) : (
          <Table emptyLabel="No non-stock items imported yet" columns={columns} rows={items} maxHeight="500px" />
        )}
      </div>
    </div>
  );
}
