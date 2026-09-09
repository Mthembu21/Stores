import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useUsers } from '../services/users';
import {
  useConsumableItems,
  useCreateConsumableItem,
  useUpdateConsumableItem,
  useRestockConsumableItem,
  useDeleteConsumableItem,
  useConsumables,
  useIssueConsumable,
} from '../services/consumables';
import { formatDateTime } from '../utils/format';

function RestockCell({ item, onRestock, isPending }) {
  const [qty, setQty] = useState('');

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="1"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="Qty"
        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
      />
      <button
        type="button"
        disabled={!qty || isPending}
        onClick={() => {
          onRestock(Number(qty));
          setQty('');
        }}
        className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
      >
        + Restock
      </button>
    </div>
  );
}

function MinQtyCell({ item, onUpdate, isPending }) {
  const [value, setValue] = useState(String(item.minimumStockLevel ?? 0));

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-sm"
      />
      <button
        type="button"
        disabled={isPending}
        onClick={() => onUpdate(Number(value) || 0)}
        className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
      >
        Save
      </button>
    </div>
  );
}

export default function ConsumablesPage() {
  const { data: usersData } = useUsers();
  const { data: itemsData, isLoading: itemsLoading, isError: itemsError } = useConsumableItems();
  const { data: recordsData, isLoading: recordsLoading, isError: recordsError } = useConsumables();

  const createItem = useCreateConsumableItem();
  const updateItem = useUpdateConsumableItem();
  const restockItem = useRestockConsumableItem();
  const deleteItem = useDeleteConsumableItem();
  const issueConsumable = useIssueConsumable();

  const users = usersData?.users || [];
  const items = itemsData?.items || [];
  const records = recordsData?.records || [];

  const technicians = useMemo(() => users.filter((u) => u.role !== 'Admin'), [users]);

  // Add consumable form
  const [newName, setNewName] = useState('');
  const [newUom, setNewUom] = useState('');
  const [newQty, setNewQty] = useState('0');
  const [newMinQty, setNewMinQty] = useState('0');

  function handleAddConsumable(e) {
    e.preventDefault();
    if (!newName.trim() || !newUom.trim()) return;
    createItem.mutate(
      {
        name: newName.trim(),
        unitOfMeasure: newUom.trim(),
        stockOnHand: Number(newQty) || 0,
        minimumStockLevel: Number(newMinQty) || 0,
      },
      {
        onSuccess: () => {
          setNewName('');
          setNewUom('');
          setNewQty('0');
          setNewMinQty('0');
        },
      }
    );
  }

  // Book out form
  const [technicianId, setTechnicianId] = useState('');
  const [consumableId, setConsumableId] = useState('');
  const [bookOutQty, setBookOutQty] = useState('1');

  const selectedItem = items.find((i) => i._id === consumableId);

  function handleBookOut(e) {
    e.preventDefault();
    if (!technicianId || !consumableId || !bookOutQty) return;
    issueConsumable.mutate(
      { technicianId, consumableId, quantity: Number(bookOutQty) },
      {
        onSuccess: () => {
          setTechnicianId('');
          setConsumableId('');
          setBookOutQty('1');
        },
      }
    );
  }

  const [searchQuery, setSearchQuery] = useState('');
  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) => {
      const name = String(r.consumableName || '').toLowerCase();
      const tech = String(r.technician?.fullName || '').toLowerCase();
      return name.includes(q) || tech.includes(q);
    });
  }, [records, searchQuery]);

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      <div>
        <div className="text-2xl font-semibold text-epiroc-gray">Consumables</div>
        <div className="text-sm text-slate-600">Add consumables to stock and book them out to technicians at the Tools Store.</div>
      </div>

      {/* Add Consumable */}
      <form className="rounded-xl bg-white shadow-soft p-6 space-y-4" onSubmit={handleAddConsumable}>
        <div className="text-sm font-semibold text-epiroc-gray">Add Consumable</div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Nitrile gloves"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Unit of Measure</label>
            <input
              type="text"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={newUom}
              onChange={(e) => setNewUom(e.target.value)}
              placeholder="e.g. Box, EA, Litre"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={newQty}
              onChange={(e) => setNewQty(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Minimum Stock Qty</label>
            <input
              type="number"
              min="0"
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={newMinQty}
              onChange={(e) => setNewMinQty(e.target.value)}
              placeholder="Reorder point"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            disabled={createItem.isPending}
          >
            {createItem.isPending ? 'Adding...' : 'Add Consumable'}
          </button>
        </div>
      </form>

      {/* Consumables catalog */}
      <div className="rounded-xl bg-white shadow-soft p-6 space-y-3">
        <div className="text-sm font-semibold text-epiroc-gray">Consumables Stock</div>
        {itemsLoading ? (
          <div className="text-sm text-slate-600">Loading consumables...</div>
        ) : itemsError ? (
          <div className="text-sm text-slate-600">Could not load consumables</div>
        ) : (
          <Table
            emptyLabel="No consumables added yet"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'unitOfMeasure', header: 'Unit' },
              { key: 'stockOnHand', header: 'Qty On Hand' },
              { key: 'minimumStockLevel', header: 'Min Qty' },
              {
                key: 'setMinQty',
                header: 'Set Min Qty',
                render: (item) => (
                  <MinQtyCell
                    item={item}
                    isPending={updateItem.isPending}
                    onUpdate={(minimumStockLevel) =>
                      updateItem.mutate({ id: item._id, patch: { minimumStockLevel } })
                    }
                  />
                ),
              },
              {
                key: 'restock',
                header: 'Restock',
                render: (item) => (
                  <RestockCell
                    item={item}
                    isPending={restockItem.isPending}
                    onRestock={(quantity) => restockItem.mutate({ id: item._id, quantity })}
                  />
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (item) => (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`Remove "${item.name}" from consumables?`)) {
                        deleteItem.mutate(item._id);
                      }
                    }}
                    className="text-red-500 hover:text-red-700 text-xs font-semibold"
                  >
                    Remove
                  </button>
                ),
              },
            ]}
            rows={items}
            getRowClassName={(item) =>
              item.stockOnHand <= 0
                ? 'bg-red-100'
                : item.stockOnHand <= item.minimumStockLevel
                ? 'bg-yellow-50'
                : ''
            }
            maxHeight="360px"
          />
        )}
      </div>

      {/* Book Out */}
      <form className="rounded-xl bg-white shadow-soft p-6 space-y-4" onSubmit={handleBookOut}>
        <div className="text-sm font-semibold text-epiroc-gray">Book Out Consumable</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Consumable</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={consumableId}
              onChange={(e) => setConsumableId(e.target.value)}
              required
            >
              <option value="">Select consumable...</option>
              {items.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({item.stockOnHand} {item.unitOfMeasure} available)
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Technician</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              required
            >
              <option value="">Select technician...</option>
              {technicians.map((u) => (
                <option key={u.id || u._id} value={u.id || u._id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Quantity</label>
            <input
              type="number"
              min="1"
              max={selectedItem?.stockOnHand || undefined}
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={bookOutQty}
              onChange={(e) => setBookOutQty(e.target.value)}
              required
            />
            {selectedItem && (
              <div className="mt-1 text-xs text-slate-500">{selectedItem.stockOnHand} {selectedItem.unitOfMeasure} in stock</div>
            )}
          </div>
        </div>
        <div className="text-xs text-slate-500">The date and time are captured automatically when you book out.</div>
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            disabled={issueConsumable.isPending}
          >
            {issueConsumable.isPending ? 'Booking out...' : 'Book Out'}
          </button>
        </div>
      </form>

      {/* Recent issuance log */}
      <div className="rounded-xl bg-white shadow-soft p-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-sm font-semibold text-epiroc-gray">Recent Consumables Booked Out</div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by technician or consumable..."
            className="w-full max-w-xs rounded-xl border border-slate-300 px-3 py-1.5 text-sm"
          />
        </div>

        {recordsLoading ? (
          <div className="text-sm text-slate-600">Loading records...</div>
        ) : recordsError ? (
          <div className="text-sm text-slate-600">Could not load records</div>
        ) : (
          <Table
            emptyLabel="No consumables booked out yet"
            columns={[
              { key: 'technician', header: 'Technician', render: (r) => r.technician?.fullName || '' },
              { key: 'consumableName', header: 'Consumable' },
              {
                key: 'quantity',
                header: 'Quantity',
                render: (r) => `${r.quantity}${r.unitOfMeasure ? ` ${r.unitOfMeasure}` : ''}`,
              },
              { key: 'takenAt', header: 'Booked Out At', render: (r) => formatDateTime(r.takenAt) },
            ]}
            rows={filteredRecords}
            maxHeight="500px"
          />
        )}
      </div>
    </div>
  );
}
