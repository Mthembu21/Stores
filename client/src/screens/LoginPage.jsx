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
    <div className="min-h-screen grid place-items-center px-6" style={{ background: '#f6f8fb' }}>
      <div className="w-full max-w-md rounded-xl bg-white shadow-soft p-6" style={{ background: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderRadius: '12px' }}>
        <div className="flex items-center justify-between">
          <div className="text-xl font-semibold text-epiroc-blue" style={{ color: '#1e40af', fontWeight: '600' }}>Workshop System</div>
          <div className="h-3 w-10 rounded-full bg-epiroc-yellow" style={{ height: '12px', width: '40px', borderRadius: '50%', backgroundColor: '#fbbf24' }} />
        </div>
        <div className="mt-1 text-sm text-slate-600" style={{ marginTop: '4px', color: '#64748b', fontSize: '14px' }}>Storeman login</div>

        <form
          className="mt-6 space-y-4"
          style={{ marginTop: '24px' }}
          onSubmit={(e) => {
            e.preventDefault();
            login.mutate({ employeeNumber, password });
          }}
        >
          <div>
            <label className="text-sm font-medium text-slate-700" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>Employee Number</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epiroc-yellow"
              style={{ marginTop: '4px', width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px' }}
              value={employeeNumber}
              onChange={(e) => setEmployeeNumber(e.target.value)}
              placeholder="e.g. 12345"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700" style={{ display: 'block', color: '#334155', fontSize: '14px', fontWeight: '500' }}>Password</label>
            <input
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-epiroc-yellow"
              type="password"
              style={{ marginTop: '4px', width: '100%', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '8px 12px', fontSize: '14px' }}
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
            style={{ width: '100%', borderRadius: '8px', backgroundColor: '#fbbf24', color: '#1e293b', padding: '8px 16px', fontWeight: '600', fontSize: '14px', cursor: login.isPending ? 'not-allowed' : 'pointer', opacity: login.isPending ? '0.6' : '1' }}
          >
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-4 text-xs text-slate-500" style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8', textAlign: 'center' }}>
          Admin users only. Ask the Storeman to create your account.
        </div>
      </div>
    </div>
  );
}
