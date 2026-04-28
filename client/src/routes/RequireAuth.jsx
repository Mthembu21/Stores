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
  
  // Add debug logging to understand what's happening
  console.log('RequireAuth: user data:', user);
  console.log('RequireAuth: isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    // Only redirect if not already on login page to prevent infinite loops
    if (location.pathname !== '/login') {
      // Check if login was recent before clearing localStorage
      const loginTimestamp = localStorage.getItem('loginTimestamp');
      const now = Date.now();
      const timeSinceLogin = loginTimestamp ? now - parseInt(loginTimestamp) : Infinity;
      
      console.log('RequireAuth: time since login:', timeSinceLogin, 'ms');
      
      // Only clear token if login was more than 10 seconds ago (to handle race conditions)
      if (timeSinceLogin > 10000) {
        console.log('RequireAuth: clearing localStorage due to old authentication failure');
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('loginTimestamp');
      } else {
        console.log('RequireAuth: recent login detected, not clearing localStorage');
      }
      
      console.log('RequireAuth: Redirecting to login from:', location.pathname);
      // Redirect to login
      return <Navigate to="/login" replace state={{ from: location }} />;
    }
  }

  return children;
}
