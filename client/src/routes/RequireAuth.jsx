import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '../services/auth';
import { logout } from '../services/auth';

export function RequireAuth({ children }) {
  const location = useLocation();
  const { data, isLoading, isError, error } = useMe();

  // Early returns after all hooks are called
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-epiroc-blue font-semibold">Loading...</div>
      </div>
    );
  }

  // Handle 401 errors specifically
  if (error?.response?.status === 401) {
    // The HTTP interceptor will handle the redirect, but we provide a fallback
    return <Navigate to="/login" replace state={{ from: location, reason: 'token_expired' }} />;
  }

  if (isError || !data?.user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (data.user.role !== 'Admin') {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <div className="w-full max-w-md rounded-xl bg-white shadow-soft p-6">
          <div className="text-xl font-semibold text-epiroc-blue">Access denied</div>
          <div className="mt-2 text-sm text-slate-600">
            Only Storeman (Admin role) can access the dashboard.
          </div>
          <button
            onClick={logout}
            className="mt-4 w-full rounded-xl bg-epiroc-yellow px-4 py-2 font-semibold text-epiroc-black hover:brightness-95"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return children;
}
