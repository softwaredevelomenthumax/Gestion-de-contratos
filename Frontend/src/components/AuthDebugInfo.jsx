import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebugInfo = () => {
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white p-3 rounded-lg text-xs max-w-sm z-50">
      <h4 className="font-bold mb-2">Auth Debug Info</h4>
      <div className="space-y-1">
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>User: {user ? `${user.email} (${user.role})` : 'null'}</div>
        <div>Token: {token ? `${token.substring(0, 20)}...` : 'null'}</div>
        <div>Stored User: {storedUser ? 'exists' : 'null'}</div>
        <div>Current Path: {window.location.pathname}</div>
      </div>
    </div>
  );
};

export default AuthDebugInfo;
