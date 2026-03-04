import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Table } from '../components/Table';
import { useBorrowTool, useBorrowings } from '../services/borrow';
import { useCreateTool, useDeleteTool, useTools, useUpdateTool } from '../services/tools';
import { useReturnTool } from '../services/return';
import { useUsers } from '../services/users';
import { formatDateTime } from '../utils/format';

export default function ToolsPage() {
  const { data: toolsData, isLoading: toolsLoading, isError: toolsError } = useTools();
  const { data: usersData, isLoading: usersLoading, isError: usersError } = useUsers();
  const { data: borrowData, isLoading: borrowLoading, isError: borrowError } = useBorrowings('open');
  const borrowTool = useBorrowTool();
  const createTool = useCreateTool();
  const deleteTool = useDeleteTool();
  const updateTool = useUpdateTool();
  const returnTool = useReturnTool();

  const tools = toolsData?.tools || [];
  const users = usersData?.users || [];
  const openBorrowings = borrowData?.records || [];

  const [toolId, setToolId] = useState('');
  const [borrowerId, setBorrowerId] = useState('');
  const [jobNumber, setJobNumber] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 16);
  });

  const [toolName, setToolName] = useState('');
  const [toolCode, setToolCode] = useState('');
  const [category, setCategory] = useState('Hand Tools');
  const [quantityTotal, setQuantityTotal] = useState('1');

  const [toolsCategoryFilter, setToolsCategoryFilter] = useState('All');
  const [toolsSearch, setToolsSearch] = useState('');

  const filteredTools = useMemo(() => {
    const q = toolsSearch.trim().toLowerCase();
    return tools.filter((t) => {
      if (toolsCategoryFilter !== 'All' && t.category !== toolsCategoryFilter) return false;
      if (!q) return true;
      const name = String(t.toolName || '').toLowerCase();
      const code = String(t.toolCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [tools, toolsCategoryFilter, toolsSearch]);

  const toolColumns = useMemo(
    () => [
      { key: 'toolName', header: 'Tool Name' },
      { key: 'toolCode', header: 'Tool Code' },
      { key: 'category', header: 'Category' },
      { key: 'quantityAvailable', header: 'Available' },
      { key: 'quantityTotal', header: 'Total' },
      { key: 'status', header: 'Status' },
      { key: 'flag', header: 'Flag' },
      {
        key: 'lastReturnCondition',
        header: 'Last Return',
        render: (t) => t.lastReturnCondition || '',
      },
      {
        key: 'lastReturnedAt',
        header: 'Returned At',
        render: (t) => (t.lastReturnedAt ? formatDateTime(t.lastReturnedAt) : ''),
      },
      {
        key: 'updateQty',
        header: 'Update Qty',
        render: (t) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                const id = t._id || t.id;
                if (!id) {
                  toast.error('Could not update tool: missing id');
                  return;
                }
                const nextTotal = Number(t.quantityTotal) + 1;
                const nextAvail = Number(t.quantityAvailable) + 1;
                updateTool.mutate({
                  id,
                  patch: { quantityTotal: nextTotal, quantityAvailable: nextAvail },
                });
              }}
              disabled={updateTool.isPending}
              title="Increase total and available by 1"
            >
              +1
            </button>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              onClick={() => {
                const id = t._id || t.id;
                if (!id) {
                  toast.error('Could not update tool: missing id');
                  return;
                }
                const raw = window.prompt('Set new TOTAL quantity for this tool:', String(t.quantityTotal));
                if (raw === null) return;
                const nextTotal = Number.parseInt(raw, 10);
                if (raw.trim() === '' || Number.isNaN(nextTotal) || nextTotal < 0) {
                  toast.error('Please enter a valid number (0 or higher)');
                  return;
                }

                const currentTotal = Number(t.quantityTotal);
                const currentAvail = Number(t.quantityAvailable);
                const delta = nextTotal - currentTotal;

                const nextAvail = delta >= 0 ? Math.min(currentAvail + delta, nextTotal) : Math.min(currentAvail, nextTotal);
                updateTool.mutate({
                  id,
                  patch: { quantityTotal: nextTotal, quantityAvailable: nextAvail },
                });
              }}
              disabled={updateTool.isPending}
              title="Set total quantity"
            >
              Set
            </button>
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        render: (t) => (
          <button
            type="button"
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => {
              const id = t._id || t.id;
              if (!id) {
                toast.error('Could not delete tool: missing id');
                return;
              }
              if (!window.confirm('Delete this tool?')) return;
              deleteTool.mutate(id);
            }}
            disabled={deleteTool.isPending}
          >
            Delete
          </button>
        ),
      },
    ],
    [deleteTool, updateTool]
  );

  const borrowingColumns = useMemo(
    () => [
      { key: 'jobNumber', header: 'Job #', render: (r) => r.jobNumber || '' },
      { key: 'tool', header: 'Tool', render: (r) => r.tool?.toolName || '' },
      { key: 'borrower', header: 'Used By', render: (r) => r.borrower?.fullName || '' },
      { key: 'borrowedAt', header: 'Borrowed', render: (r) => formatDateTime(r.borrowedAt) },
      { key: 'expectedReturnAt', header: 'Expected', render: (r) => formatDateTime(r.expectedReturnAt) },
      { key: 'processedBy', header: 'Processed By', render: (r) => r.processedBy?.fullName || '' },
      {
        key: 'return',
        header: '',
        render: (r) => (
          <div className="flex items-center gap-2">
            <select
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              defaultValue="Good"
              onChange={(e) => {
                r.__returnCondition = e.target.value;
              }}
            >
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Damaged">Damaged</option>
              <option value="Missing">Missing</option>
            </select>
            <button
              type="button"
              className="rounded-lg bg-epiroc-yellow px-3 py-1.5 text-xs font-semibold text-epiroc-black hover:brightness-95 disabled:opacity-60"
              onClick={() => {
                const condition = r.__returnCondition || 'Good';
                returnTool.mutate({ recordId: r._id || r.id, condition });
              }}
              disabled={returnTool.isPending}
            >
              Return
            </button>
          </div>
        ),
      },
    ],
    [returnTool]
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Tools</div>
        <div className="text-sm text-slate-600">Borrow and return tools linked to a job number.</div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Create tool</div>

        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            createTool.mutate(
              {
                toolName,
                toolCode,
                category,
                quantityTotal: Number(quantityTotal),
              },
              {
                onSuccess: () => {
                  setToolName('');
                  setToolCode('');
                  setCategory('Hand Tools');
                  setQuantityTotal('1');
                },
              }
            );
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Tool name</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={toolName}
              onChange={(e) => setToolName(e.target.value)}
              required
              placeholder="e.g. Drill"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Tool code</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={toolCode}
              onChange={(e) => setToolCode(e.target.value)}
              required
              placeholder="e.g. TL-001"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Category</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Hand Tools">Hand Tools</option>
              <option value="Power Tools">Power Tools</option>
              <option value="Equipment">Equipment</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Quantity total</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              type="number"
              min="0"
              value={quantityTotal}
              onChange={(e) => setQuantityTotal(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              type="submit"
              disabled={createTool.isPending}
            >
              {createTool.isPending ? 'Creating…' : 'Create tool'}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Borrow tool</div>

        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            borrowTool.mutate(
              {
                toolId,
                borrowerId,
                jobNumber,
                expectedReturnAt: new Date(expectedReturnAt).toISOString(),
              },
              {
                onSuccess: () => {
                  setToolId('');
                  setBorrowerId('');
                  setJobNumber('');
                },
              }
            );
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Job number</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              required
              placeholder="e.g. JOB-001"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Used by</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={borrowerId}
              onChange={(e) => setBorrowerId(e.target.value)}
              required
              disabled={usersLoading || usersError}
            >
              <option value="">Select person…</option>
              {users
                .filter((u) => u.role !== 'Admin')
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role})
                  </option>
                ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Tool</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={toolId}
              onChange={(e) => setToolId(e.target.value)}
              required
              disabled={toolsLoading || toolsError}
            >
              <option value="">Select tool…</option>
              {filteredTools.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.toolName} ({t.toolCode}) - Available: {t.quantityAvailable}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Expected return</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              type="datetime-local"
              value={expectedReturnAt}
              onChange={(e) => setExpectedReturnAt(e.target.value)}
              required
            />
          </div>

          <div className="flex items-end">
            <button
              className="w-full rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              type="submit"
              disabled={borrowTool.isPending}
            >
              {borrowTool.isPending ? 'Borrowing…' : 'Borrow tool'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Tools list</div>
        <div className="rounded-xl bg-white shadow-soft p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Category</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={toolsCategoryFilter}
                onChange={(e) => setToolsCategoryFilter(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Hand Tools">Hand Tools</option>
                <option value="Power Tools">Power Tools</option>
                <option value="Equipment">Equipment</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Search (name or code)</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={toolsSearch}
                onChange={(e) => setToolsSearch(e.target.value)}
                placeholder="e.g. drill / TL-001"
              />
            </div>
          </div>
        </div>
        {toolsLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading…</div>
        ) : toolsError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load tools</div>
        ) : (
          <Table emptyLabel="No tools" columns={toolColumns} rows={filteredTools} maxHeight="520px" />
        )}
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">Open borrowings</div>
        {borrowLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading…</div>
        ) : borrowError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load borrowings</div>
        ) : (
          <Table emptyLabel="No open borrowings" columns={borrowingColumns} rows={openBorrowings} />
        )}
      </div>
    </div>
  );
}
