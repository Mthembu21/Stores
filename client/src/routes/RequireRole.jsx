import { Navigate } from 'react-router-dom';
import { useMe } from '../services/auth';

export function RequireRole({ roles, children }) {
  const { data, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-epiroc-blue font-semibold">Loading...</div>
      </div>
    );
  }

  const user = data?.user || data;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
