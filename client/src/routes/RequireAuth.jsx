import { Navigate, useLocation } from 'react-router-dom';
import { useMe } from '../services/auth';

export function RequireAuth({ children }) {
  const location = useLocation();
  const { data, isLoading, isError, error } = useMe();

  // Comprehensive logging for debugging
  console.log('=== REQUIRE AUTH DEBUG ===');
  console.log('isLoading:', isLoading);
  console.log('isError:', isError);
  console.log('error:', error);
  console.log('data:', data);
  console.log('location.pathname:', location.pathname);
  
  // Log localStorage state
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  console.log('localStorage token:', token ? 'EXISTS' : 'MISSING');
  console.log('localStorage user:', storedUser ? 'EXISTS' : 'MISSING');

  // Early returns after all hooks are called
  if (isLoading) {
    console.log('REQUIRE AUTH: Showing loading state');
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50">
        <div className="text-epiroc-blue font-semibold">Loading...</div>
      </div>
    );
  }

  // Safely extract user from different possible API response formats
  const user = data?.user || data;
  console.log('REQUIRE AUTH: Extracted user:', user);
  console.log('REQUIRE AUTH: User role:', user?.role);
  
  // Check if user is authenticated - handle null/undefined cases
  const isAuthenticated = user && user.role === 'Admin';
  console.log('REQUIRE AUTH: isAuthenticated:', isAuthenticated);
  
  if (!isAuthenticated) {
    console.log('REQUIRE AUTH: User not authenticated - redirecting to login');
    console.log('REQUIRE AUTH: Authentication failure details:', { 
      data, 
      error, 
      user, 
      hasUser: !!user,
      userRole: user?.role,
      isAdmin: user?.role === 'Admin'
    });
    
    // Clear invalid tokens directly (no useEffect to avoid React error #310)
    console.log('REQUIRE AUTH: Clearing invalid tokens');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    
    // Store authentication failure details for debugging
    try {
      const authFailure = {
        timestamp: new Date().toISOString(),
        data,
        error,
        user,
        isAuthenticated,
        location: location.pathname,
        hasToken: !!token,
        hasStoredUser: !!storedUser
      };
      localStorage.setItem('authFailure', JSON.stringify(authFailure));
      console.log('REQUIRE AUTH: Auth failure details stored in localStorage under "authFailure"');
    } catch (e) {
      console.error('REQUIRE AUTH: Failed to store auth failure details:', e);
    }
    
    // Redirect to login immediately
    console.log('REQUIRE AUTH: Redirecting to /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  console.log('REQUIRE AUTH: Authentication successful - rendering children');
  console.log('=== END REQUIRE AUTH DEBUG ===');
  return children;
}
