import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '../services/auth';

export function RequireAuth({ children }) {
  const location = useLocation();
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-epiroc-blue font-semibold">Loading...</div>
      </div>
    );
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
        </div>
      </div>
    );
  }

  return children;
}
