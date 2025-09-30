import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { RefreshProvider } from "./context/RefreshContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/Notification";
import { ThemeProvider } from "./components/ui/theme-provider";
import ErrorBoundary from "./components/ErrorBoundary";

// Import only problematic pages immediately (no lazy loading for these)
import SendContract from "./pages/SendContract";
import Trazabilidad from './pages/Trazabilidad';

// Lazy load all other pages for better performance
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Home = lazy(() => import("./pages/Home"));
const UserContractDetail = lazy(() => import("./pages/user/UserContractDetail"));
const LawyerContractDetail = lazy(() => import("./pages/lawyer/LawyerContractDetail"));
const AwaitingSignature = lazy(() => import("./pages/user/UserAwaitingSignature"));
const LawyerAwaitingSignature = lazy(() => import("./pages/lawyer/LawyerAwaitingSignature"));
const LawyerNewContracts = lazy(() => import("./pages/lawyer/LawyerNewContracts"));
const LawyerManagedContracts = lazy(() => import("./pages/lawyer/LawyerManagedContracts"));
const LawyerAwaitingReviewContracts = lazy(() => import("./pages/lawyer/LawyerAwaitingReviewContracts"));
const UserSentContracts = lazy(() => import("./pages/user/UserSentContracts"));
const UserAwaitingResponseContracts = lazy(() => import("./pages/user/UserAwaitingResponseContracts"));
const UserFinalizado = lazy(() => import("./pages/user/UserFinalizado"));
const LawyerFinalizado = lazy(() => import("./pages/lawyer/LawyerFinalizado"));
const OtrosiForm = lazy(() => import("./pages/OtrosiForm"));
const ContractTracePage = lazy(() => import('./pages/ContractTracePage'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const CreateAdmin = lazy(() => import('./pages/CreateAdmin'));

// Loading component - más rápido y menos intrusivo
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 dark:border-gray-700"></div>
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent absolute top-0 left-0"></div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-foreground">Cargando página...</p>
        <p className="text-sm text-muted-foreground">Solo un momento</p>
      </div>
    </div>
  </div>
);

const App = () => {
  // Preload only the most critical pages after initial load
  useEffect(() => {
    const preloadPages = () => {
      // Preload only Home page after 2 seconds (very conservative)
      setTimeout(() => {
        import("./pages/Home");
      }, 2000);
    };
    
    preloadPages();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RefreshProvider>
            <NotificationProvider>
              <Router>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
                    <Route path="/send_contracts" element={<ProtectedRoute><SendContract /></ProtectedRoute>} />
                    <Route path="/my_contracts" element={<ProtectedRoute><UserSentContracts /></ProtectedRoute>} />
                    <Route path="/user/contracts/:id" element={<ProtectedRoute><UserContractDetail/></ProtectedRoute>} />
                    <Route path="/regular/contracts/:id" element={<ProtectedRoute><UserContractDetail/></ProtectedRoute>} />
                    <Route path="/lawyer/contracts/:id" element={<ProtectedRoute><LawyerContractDetail/></ProtectedRoute>} />
                    <Route path="/lawyer_new_contracts" element={<ProtectedRoute><LawyerNewContracts /></ProtectedRoute>} />
                    <Route path="/AwaitingSignature" element={<ProtectedRoute><AwaitingSignature /></ProtectedRoute>} />
                    <Route path="/LawyerAwaitingSignature" element={<ProtectedRoute><LawyerAwaitingSignature /></ProtectedRoute>} />
                    <Route path="/lawyer_managed_contracts" element={<ProtectedRoute><LawyerManagedContracts /></ProtectedRoute>} />
                    <Route path="/user_awaiting_response_contracts" element={<ProtectedRoute><UserAwaitingResponseContracts /></ProtectedRoute>} />
                    <Route path="/lawyer_awaiting_review_contracts" element={<ProtectedRoute><LawyerAwaitingReviewContracts /></ProtectedRoute>} />
                    <Route path="/otrosi/:id" element={<ProtectedRoute><OtrosiForm /></ProtectedRoute>} />
                    <Route path="/trazabilidad" element={<ProtectedRoute><Trazabilidad /></ProtectedRoute>} />
                    <Route path="/trazabilidad/:id" element={<ProtectedRoute><ContractTracePage /></ProtectedRoute>} />
                    <Route path="/lawyer_ended" element={<ProtectedRoute><LawyerFinalizado /></ProtectedRoute>} />
                    <Route path="/user_ended" element={<ProtectedRoute><UserFinalizado /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                    <Route path="/admin/create" element={<ProtectedRoute><CreateAdmin /></ProtectedRoute>} />
                  </Routes>
                </Suspense>
              </Router>
              <NotificationContainer />
            </NotificationProvider>
          </RefreshProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
