import React from 'react';
import { useAuth } from '../context/AuthContext';

const AuthDebug = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-4 bg-yellow-100 border border-yellow-300 rounded">
      <p className="text-yellow-800">🔄 Checking authentication...</p>
    </div>;
  }

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded space-y-2">
      <h3 className="font-bold text-blue-800">🔍 Authentication Debug Info:</h3>

      <div className="space-y-1 text-sm">
        <p><strong>User logged in:</strong> {user ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Token in localStorage:</strong> {token ? '✅ Yes' : '❌ No'}</p>
        <p><strong>User data in localStorage:</strong> {storedUser ? '✅ Yes' : '❌ No'}</p>

        {user && (
          <div className="mt-2 p-2 bg-green-100 rounded">
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>User Role:</strong> {user.role}</p>
            <p><strong>User Email:</strong> {user.email}</p>
          </div>
        )}

        {token && (
          <div className="mt-2">
            <p><strong>Token preview:</strong> {token.substring(0, 50)}...</p>
            <p><strong>Token length:</strong> {token.length} characters</p>
          </div>
        )}
      </div>

      {!user && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-800 font-semibold">⚠️ Authentication Issue Detected!</p>
          <p className="text-red-700 text-sm mt-1">
            You need to login first before sending contract forms.
          </p>
        </div>
      )}

      {user && !token && (
        <div className="mt-3 p-3 bg-orange-100 border border-orange-300 rounded">
          <p className="text-orange-800 font-semibold">⚠️ Token Missing!</p>
          <p className="text-orange-700 text-sm mt-1">
            User data exists but token is missing. Try logging out and logging back in.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthDebug;
