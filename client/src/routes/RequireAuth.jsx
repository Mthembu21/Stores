import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '../services/auth';

export function RequireAuth({ children }) {
  const location = useLocation();
  const { data, isLoading } = useMe();

  // Early returns after all hooks are called
  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-epiroc-blue font-semibold">Loading...</div>
      </div>
    );
  }

  // Safely extract user from different possible API response formats
  const user = data?.user || data;
  
  // Check if user is authenticated - handle null/undefined cases
  const isAuthenticated = user && user.role === 'Admin';
  
  if (!isAuthenticated) {
    // Clear invalid tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    
    // Redirect to login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
