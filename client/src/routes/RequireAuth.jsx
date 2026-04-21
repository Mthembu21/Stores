import { Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
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

  // Check if user is authenticated - handle null/undefined cases
  const isAuthenticated = data?.user && data.user.role === 'Admin';
  
  if (!isAuthenticated) {
    console.log('User not authenticated or invalid role:', { data, error });
    // Clear any invalid tokens
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('loginTimestamp');
    // Redirect to login immediately
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
