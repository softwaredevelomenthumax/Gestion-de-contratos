import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { RefreshProvider } from "./context/RefreshContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/Notification";
import { ThemeProvider } from "./components/ui/theme-provider";
import ErrorBoundary from "./components/ErrorBoundary";
import LoadingAnimation from "./components/LoadingAnimation";
import NavigationIndicator from "./components/NavigationIndicator";

// 🚀 TODO con lazy loading - Bundle inicial MÁS PEQUEÑO posible
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const SendContract = lazy(() => import("./pages/SendContract"));
const Trazabilidad = lazy(() => import('./pages/Trazabilidad'));
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
const AdminContracts = lazy(() => import('./pages/AdminContracts'));
const AdminContractDetail = lazy(() => import('./pages/AdminContractDetail'));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingAnimation text="Cargando..." />
  </div>
);

/**
 * PREFETCH AGRESIVO: Precarga INMEDIATAMENTE las páginas críticas
 * Se ejecuta en paralelo con la carga inicial
 */
const useAggressivePrefetch = () => {
  useEffect(() => {
    const isLoggedIn = !window.location.pathname.match(/\/(login|register)/);
    if (!isLoggedIn) return;

    // Prefetch INMEDIATO en paralelo (no espera a que termine la carga inicial)
    // El navegador descargará estos chunks en paralelo con el bundle principal
    import("./pages/SendContract").catch(() => {});
    import('./pages/Trazabilidad').catch(() => {});
    import("./pages/user/UserSentContracts").catch(() => {});
  }, []);
};

const App = () => {
  useAggressivePrefetch();

  return (
    <ErrorBoundary>
      <ThemeProvider>
              <Router>  
                <NavigationIndicator />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
              {/* Public routes - Register doesn't need any provider */}
                    <Route path="/register" element={<Register />} />
              
              {/* Login needs only AuthProvider */}
              <Route path="/login" element={
                <AuthProvider>
                  <Login />
                </AuthProvider>
              } />
              
              {/* Protected routes - Full context stack */}
              <Route path="/*" element={
                <AuthProvider>
                  <RefreshProvider>
                    <NotificationProvider>
                      <Routes>
                    <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />  
                    <Route path="/send_contracts" element={<ProtectedRoute><SendContract /></ProtectedRoute>} />
                    <Route path="/trazabilidad" element={<ProtectedRoute><Trazabilidad /></ProtectedRoute>} />
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
                    <Route path="/trazabilidad/:id" element={<ProtectedRoute><ContractTracePage /></ProtectedRoute>} />
                    <Route path="/lawyer_ended" element={<ProtectedRoute><LawyerFinalizado /></ProtectedRoute>} />
                    <Route path="/user_ended" element={<ProtectedRoute><UserFinalizado /></ProtectedRoute>} />
                    <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
                    <Route path="/admin/create" element={<ProtectedRoute><CreateAdmin /></ProtectedRoute>} />
                    <Route path="/admin/contracts" element={<ProtectedRoute><AdminContracts /></ProtectedRoute>} />
                    <Route path="/admin/contracts/:id" element={<ProtectedRoute><AdminContractDetail /></ProtectedRoute>} />
                  </Routes>
                <NotificationContainer />
            </NotificationProvider>
          </RefreshProvider>
        </AuthProvider>
              } />
            </Routes>
          </Suspense>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
