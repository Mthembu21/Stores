import { Navigate } from 'react-router-dom';
import { useMe } from '../services/auth';

export function RequireRole({ roles, pageKey, children }) {
  const { data, isLoading } = useMe();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-epiroc-gray font-semibold">Loading...</div>
      </div>
    );
  }

  const user = data?.user || data;

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  // A custom allowedPages list restricts this user to exactly those pages,
  // regardless of what their role would normally grant.
  if (pageKey && Array.isArray(user.allowedPages) && user.allowedPages.length > 0 && !user.allowedPages.includes(pageKey)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
