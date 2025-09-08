import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Home from "./pages/Home";
import SendContract from "./pages/SendContract";
import UserContractDetail from "./pages/user/UserContractDetail";
import LawyerContractDetail from "./pages/lawyer/LawyerContractDetail";
import Tosign from "./pages/Tosign";
import Signed from "./pages/Signed";
import AwaitingSignature from "./pages/AwaitingSignature";
import LawyerAwaitingSignature from "./pages/lawyer/LawyerAwaitingSignature";
import Overdue from "./pages/Overdue";
import Devuelto from "./pages/Devuelto";
import Vencido from "./pages/Vencido";
import LawyerNewContracts from "./pages/lawyer/LawyerNewContracts";
import LawyerManagedContracts from "./pages/lawyer/LawyerManagedContracts";
import LawyerAwaitingReviewContracts from "./pages/lawyer/LawyerAwaitingReviewContracts";
import UserSentContracts from "./pages/user/UserSentContracts";
import UserAwaitingResponseContracts from "./pages/user/UserAwaitingResponseContracts";
import UserFinalizado from "./pages/user/UserFinalizado";
import LawyerFinalizado from "./pages/lawyer/LawyerFinalizado";
import Register from "./pages/Register";
import OtrosiForm from "./pages/OtrosiForm";
import Trazabilidad from './pages/Trazabilidad';
import ContractTracePage from './pages/ContractTracePage';
import { RefreshProvider } from "./context/RefreshContext";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationContainer from "./components/Notification";
import { ThemeProvider } from "./components/ui/theme-provider";

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RefreshProvider>
          <NotificationProvider>
            <Router>
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
                <Route path="/To_sign" element={<ProtectedRoute><Tosign /></ProtectedRoute>} />
                <Route path="/Signed" element={<ProtectedRoute><Signed /></ProtectedRoute>} />
                <Route path="/AwaitingSignature" element={<ProtectedRoute><AwaitingSignature /></ProtectedRoute>} />
                <Route path="/LawyerAwaitingSignature" element={<ProtectedRoute><LawyerAwaitingSignature /></ProtectedRoute>} />
                <Route path="/overdue" element={<ProtectedRoute><Overdue /></ProtectedRoute>} />
                <Route path="/lawyer_managed_contracts" element={<ProtectedRoute><LawyerManagedContracts /></ProtectedRoute>} />
                <Route path="/user_awaiting_response_contracts" element={<ProtectedRoute><UserAwaitingResponseContracts /></ProtectedRoute>} />
                <Route path="/lawyer_awaiting_review_contracts" element={<ProtectedRoute><LawyerAwaitingReviewContracts /></ProtectedRoute>} />
                <Route path="/Devuelto" element={<ProtectedRoute><Devuelto /></ProtectedRoute>} />
                <Route path="/Vencido" element={<ProtectedRoute><Vencido /></ProtectedRoute>} />
                <Route path="/otrosi/:id" element={<ProtectedRoute><OtrosiForm /></ProtectedRoute>} />
                <Route path="/trazabilidad" element={<ProtectedRoute><Trazabilidad /></ProtectedRoute>} />
                <Route path="/trazabilidad/:id" element={<ProtectedRoute><ContractTracePage /></ProtectedRoute>} />
                <Route path="/lawyer_ended" element={<ProtectedRoute><LawyerFinalizado /></ProtectedRoute>} />
                <Route path="/user_ended" element={<ProtectedRoute><UserFinalizado /></ProtectedRoute>} />
              </Routes>
            </Router>
            <NotificationContainer />
          </NotificationProvider>
        </RefreshProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
