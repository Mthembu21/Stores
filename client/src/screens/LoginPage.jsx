import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLogin } from '../services/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLogin();

  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');

  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (login.isSuccess) {
      navigate(from, { replace: true });
    }
  }, [login.isSuccess, navigate, from]);

  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="w-full max-w-md rounded-xl bg-white shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-epiroc-blue">Workshop System</div>
          <div className="h-3 w-10 rounded-full bg-epiroc-yellow" />
        </div>
        <div className="mt-1 text-sm text-slate-600">Storeman login</div>

        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate({ employeeNumber, password });
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700">Employee Number</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epiroc-yellow"
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              placeholder="e.g. 12345"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epiroc-yellow"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black shadow-soft hover:brightness-95 disabled:opacity-60"
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-500">
          Admin users only. Ask the Storeman to create your account.
        </div>
      </div>
    </div>
  );
}
