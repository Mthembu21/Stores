import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { usePartsPeople, useCreatePartsPerson, useDeletePartsPerson } from '../services/partsPeople';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../services/users';
import { PARTS_PAGES } from '../config/partsPages';

function PageAccessCheckboxes({ selected, onChange }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
      {PARTS_PAGES.map((page) => (
        <label key={page.key} className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={selected.includes(page.key)}
            onChange={(e) => {
              if (e.target.checked) {
                onChange([...selected, page.key]);
              } else {
                onChange(selected.filter((k) => k !== page.key));
              }
            }}
          />
          {page.label}
        </label>
      ))}
    </div>
  );
}

function StoremanAccessCell({ user, onSave, isPending }) {
  const [selected, setSelected] = useState(user.allowedPages || []);
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-600">
          {user.allowedPages && user.allowedPages.length > 0
            ? `${user.allowedPages.length} page(s)`
            : 'All Parts Store pages'}
        </span>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-2 py-0.5 text-xs hover:bg-slate-50"
          onClick={() => {
            setSelected(user.allowedPages || []);
            setEditing(true);
          }}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-w-xs">
      <PageAccessCheckboxes selected={selected} onChange={setSelected} />
      <div className="flex gap-2">
        <button
          type="button"
          className="rounded-lg bg-epiroc-yellow px-2 py-1 text-xs font-semibold text-epiroc-black hover:brightness-95 disabled:opacity-60"
          disabled={isPending}
          onClick={() => {
            onSave(selected);
            setEditing(false);
          }}
        >
          Save
        </button>
        <button
          type="button"
          className="rounded-lg border border-slate-200 px-2 py-1 text-xs hover:bg-slate-50"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function PartsUsersTab() {
  // Foremen — simple name + Z number directory, no login
  const { data: foremenData, isLoading: foremenLoading } = usePartsPeople('Foreman');
  const foremen = foremenData?.people || [];
  const createPerson = useCreatePartsPerson();
  const deletePerson = useDeletePartsPerson();

  const [foremanName, setForemanName] = useState('');
  const [foremanZNumber, setForemanZNumber] = useState('');

  function handleAddForeman(e) {
    e.preventDefault();
    createPerson.mutate(
      { name: foremanName.trim(), zNumber: foremanZNumber.trim(), role: 'Foreman' },
      {
        onSuccess: () => {
          setForemanName('');
          setForemanZNumber('');
        },
      }
    );
  }

  // Storemen — real login accounts with configurable per-page access
  const { data: usersData, isLoading: usersLoading } = useUsers();
  const storemen = useMemo(() => (usersData?.users || []).filter((u) => u.role === 'PartsStoreman'), [usersData]);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const [storemanName, setStoremanName] = useState('');
  const [storemanZNumber, setStoremanZNumber] = useState('');
  const [storemanPassword, setStoremanPassword] = useState('');
  const [storemanPages, setStoremanPages] = useState([]);

  function handleAddStoreman(e) {
    e.preventDefault();
    createUser.mutate(
      {
        fullName: storemanName.trim(),
        employeeNumber: storemanZNumber.trim(),
        zNumber: storemanZNumber.trim(),
        role: 'PartsStoreman',
        department: 'Parts Store',
        contactNumber: '',
        allowedPages: storemanPages,
        password: storemanPassword,
      },
      {
        onSuccess: () => {
          setStoremanName('');
          setStoremanZNumber('');
          setStoremanPassword('');
          setStoremanPages([]);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      {/* Foremen */}
      <div className="rounded-xl bg-white shadow-soft p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <div className="text-sm font-semibold text-epiroc-gray">Add Foreman</div>
          <div className="text-xs text-slate-500">
            Name and Z Number only — used for attribution on forms like Issue Consumables. No login access.
          </div>
        </div>
        <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" onSubmit={handleAddForeman}>
          <div>
            <label className="text-sm font-medium text-slate-700">Name</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={foremanName}
              onChange={(e) => setForemanName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Z Number</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={foremanZNumber}
              onChange={(e) => setForemanZNumber(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
            disabled={createPerson.isPending}
          >
            {createPerson.isPending ? 'Adding...' : 'Add Foreman'}
          </button>
        </form>
      </div>

      <div className="max-w-3xl mx-auto">
        {foremenLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
        ) : (
          <Table
            emptyLabel="No foremen added yet"
            columns={[
              { key: 'name', header: 'Name' },
              { key: 'zNumber', header: 'Z Number' },
              {
                key: 'actions',
                header: '',
                render: (p) => (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm(`Remove ${p.name}?`)) deletePerson.mutate(p._id);
                    }}
                    disabled={deletePerson.isPending}
                  >
                    Delete
                  </button>
                ),
              },
            ]}
            rows={foremen}
            maxHeight="300px"
          />
        )}
      </div>

      {/* Storemen */}
      <div className="rounded-xl bg-white shadow-soft p-6 max-w-3xl mx-auto space-y-4">
        <div>
          <div className="text-sm font-semibold text-epiroc-gray">Add Storeman</div>
          <div className="text-xs text-slate-500">
            Creates a login account. Tick which Spare Parts pages they can access — leave all unticked to give them
            every page a Storeman normally has.
          </div>
        </div>
        <form className="space-y-4" onSubmit={handleAddStoreman}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={storemanName}
                onChange={(e) => setStoremanName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Z Number</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={storemanZNumber}
                onChange={(e) => setStoremanZNumber(e.target.value)}
                placeholder="Also used to log in"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
                value={storemanPassword}
                onChange={(e) => setStoremanPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Page access</label>
            <div className="mt-1">
              <PageAccessCheckboxes selected={storemanPages} onChange={setStoremanPages} />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="rounded-xl bg-epiroc-yellow px-6 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? 'Adding...' : 'Add Storeman'}
            </button>
          </div>
        </form>
      </div>

      <div className="max-w-3xl mx-auto">
        {usersLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading...</div>
        ) : (
          <Table
            emptyLabel="No storemen added yet"
            columns={[
              { key: 'fullName', header: 'Name' },
              { key: 'zNumber', header: 'Z Number', render: (u) => u.zNumber || u.employeeNumber },
              {
                key: 'access',
                header: 'Page Access',
                render: (u) => (
                  <StoremanAccessCell
                    user={u}
                    isPending={updateUser.isPending}
                    onSave={(allowedPages) => updateUser.mutate({ id: u.id, patch: { allowedPages } })}
                  />
                ),
              },
              {
                key: 'actions',
                header: '',
                render: (u) => (
                  <button
                    type="button"
                    className="rounded-lg border border-red-200 text-red-600 px-2 py-0.5 text-xs hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm(`Remove ${u.fullName}?`)) deleteUser.mutate(u.id);
                    }}
                    disabled={deleteUser.isPending}
                  >
                    Delete
                  </button>
                ),
              },
            ]}
            rows={storemen}
            maxHeight="400px"
          />
        )}
      </div>
    </div>
  );
}
