import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../context/NotificationContext';
import Layout from '../components/Layout';
import api, { clearCache } from '../api/axiosInstance';
import { Users, CheckCircle, XCircle, Clock, Mail, User, RefreshCw } from 'lucide-react';

const AdminUsers = () => {
  const { user } = useAuth();
  const { addNotification } = useNotification();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingUser, setProcessingUser] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPendingUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users/pending');
      if (response.data.success) {
        setPendingUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      addNotification('Error al cargar usuarios pendientes', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      clearCache();
      await fetchPendingUsers();
      addNotification('Lista actualizada correctamente', 'success');
    } catch {
      addNotification('Error al actualizar la lista', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role !== 'admin') {
      addNotification('Acceso denegado. Se requieren privilegios de administrador.', 'error');
      return;
    }
    fetchPendingUsers();
  }, [user, addNotification, fetchPendingUsers]);

  const handleApprove = async (userId) => {
    try {
      setProcessingUser(userId);
      const response = await api.post(`/admin/users/${userId}/approve`);
      if (response.data.success) {
        // Remove the user from the list immediately (optimistic update)
        setPendingUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        addNotification('Usuario aprobado exitosamente', 'success');
        // Clear cache and refresh the list to ensure consistency
        clearCache();
        await fetchPendingUsers();
      }
    } catch (error) {
      console.error('Error approving user:', error);
      addNotification('Error al aprobar usuario', 'error');
      // Clear cache and refresh the list on error to revert optimistic update
      clearCache();
      await fetchPendingUsers();
    } finally {
      setProcessingUser(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('¿Estás seguro de que quieres rechazar este usuario? Esta acción no se puede deshacer y la cuenta del usuario será eliminada.')) {
      return;
    }

    try {
      setProcessingUser(userId);
      const response = await api.post(`/admin/users/${userId}/reject`);
      if (response.data.success) {
        // Remove the user from the list immediately (optimistic update)
        setPendingUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
        addNotification('Usuario rechazado y eliminado exitosamente', 'success');
        // Clear cache and refresh the list to ensure consistency
        clearCache();
        await fetchPendingUsers();
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      addNotification('Error al rechazar usuario', 'error');
      // Clear cache and refresh the list on error to revert optimistic update
      clearCache();
      await fetchPendingUsers();
    } finally {
      setProcessingUser(null);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Acceso Denegado</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Necesitas privilegios de administrador para acceder a esta página.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-cyan-600 dark:text-cyan-400 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Aprobar o rechazar registros de usuarios pendientes
                </p>
              </div>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing || loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Actualizar lista de usuarios pendientes"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Actualizando...' : 'Actualizar'}
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando usuarios pendientes...</span>
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay usuarios pendientes</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Todos los registros de usuarios han sido procesados.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">
                Aprobaciones Pendientes ({pendingUsers.length})
              </h3>
              <div className="space-y-4">
                {pendingUsers.map((pendingUser) => (
                  <div
                    key={pendingUser.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                            <User className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                            {pendingUser.firstName} {pendingUser.lastName}
                          </h4>
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <Mail className="h-4 w-4 mr-1" />
                            {pendingUser.email}
                          </div>
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {pendingUser.role === 'regular' ? 'Usuario' : 'Abogado'}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 ml-2">
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleApprove(pendingUser.id)}
                          disabled={processingUser === pendingUser.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingUser === pendingUser.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(pendingUser.id)}
                          disabled={processingUser === pendingUser.id}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {processingUser === pendingUser.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AdminUsers;
