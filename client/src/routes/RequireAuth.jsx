import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '../services/auth';

export function RequireAuth({ children }) {
  const location = useLocation();
  const { data, isLoading, isError, error } = useMe();

  // Early returns after all hooks are called
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-epiroc-blue font-semibold">Loading...</div>
      </div>
    );
  }

  // Add a small delay to prevent immediate redirect loops
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  React.useEffect(() => {
    if (isError || !data?.user) {
      console.log('Auth error:', error);
      // Clear any invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Set redirect after a short delay
      const timer = setTimeout(() => {
        setShouldRedirect(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isError, data?.user, error]);

  if (shouldRedirect) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (data.user.role !== 'Admin') {
    return (
      <div className="min-h-screen grid place-items-center px-6 bg-slate-50">
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
