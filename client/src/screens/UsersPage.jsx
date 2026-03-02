import { useMemo, useState } from 'react';
import { Table } from '../components/Table';
import { useCreateUser, useDeleteUser, useUsers } from '../services/users';

const roles = ['Technician', 'Apprentice', 'Intern', 'Admin'];

export default function UsersPage() {
  const { data, isLoading, isError } = useUsers();
  const createUser = useCreateUser();
  const deleteUser = useDeleteUser();

  const users = data?.users || [];

  const [fullName, setFullName] = useState('');
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [role, setRole] = useState('Technician');
  const [department, setDepartment] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [password, setPassword] = useState('');

  const columns = useMemo(
    () => [
      { key: 'fullName', header: 'Name' },
      { key: 'employeeNumber', header: 'Employee #' },
      { key: 'role', header: 'Role' },
      { key: 'department', header: 'Department' },
      { key: 'contactNumber', header: 'Contact' },
      {
        key: 'actions',
        header: '',
        render: (u) => (
          <button
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            onClick={() => deleteUser.mutate(u.id)}
            disabled={deleteUser.isPending}
            type="button"
          >
            Delete
          </button>
        ),
      },
    ],
    [deleteUser]
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-2xl font-semibold text-epiroc-blue">Users</div>
        <div className="text-sm text-slate-600">Create technicians, interns and apprentices.</div>
      </div>

      <div className="rounded-xl bg-white shadow-soft p-6">
        <div className="text-sm font-semibold text-epiroc-blue">Create user</div>
        <form
          className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            createUser.mutate(
              { fullName, employeeNumber, role, department, contactNumber, password },
              {
                onSuccess: () => {
                  setFullName('');
                  setEmployeeNumber('');
                  setDepartment('');
                  setContactNumber('');
                  setPassword('');
                  setRole('Technician');
                },
              }
            );
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Employee number</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <select
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Department</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Contact number</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="md:col-span-2">
            <button
              className="rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
              type="submit"
              disabled={createUser.isPending}
            >
              {createUser.isPending ? 'Creating…' : 'Create user'}
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-3">
        <div className="text-sm font-semibold text-epiroc-blue">All users</div>
        {isLoading ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Loading…</div>
        ) : isError ? (
          <div className="rounded-xl bg-white shadow-soft p-4 text-sm text-slate-600">Could not load users</div>
        ) : (
          <Table emptyLabel="No users" columns={columns} rows={users} />
        )}
      </div>
    </div>
  );
}
