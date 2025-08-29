import { Navigate } from "react-router-dom";
import Layout from "./Layout";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  try {
    const authContext = useAuth();
    
    // Handle case where context is not available
    if (!authContext) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Inicializando...</p>
          </div>
        </div>
      );
    }
    
    const { user, loading } = authContext;
    
    // Show loading while checking authentication
    if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Verificando autenticación...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    console.log('ProtectedRoute - Redirecting to login (no user)');
    return <Navigate to="/login" replace />;
  }
  
  // Additional check for required user properties
  if (!user.role || !user.email) {
    return <Navigate to="/login" replace />;
  }
  
  return <Layout>{children}</Layout>;
  } catch {
    // If there's an error with the auth context, redirect to login
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;