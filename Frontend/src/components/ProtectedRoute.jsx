import React, { memo } from "react";
import { Navigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "../hooks/useAuth";

// Memoized loading component to prevent recreation
const LoadingSpinner = memo(() => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
      <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
    </div>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

const ProtectedRoute = memo(({ children }) => {
  const authContext = useAuth();
  
  // Handle case where context is not available
  if (!authContext) {
    return <LoadingSpinner />;
  }
  
  const { user, loading } = authContext;
  
  // Show loading while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Additional check for required user properties
  if (!user.role || !user.email) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
});

ProtectedRoute.displayName = 'ProtectedRoute';

export default ProtectedRoute;