import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { getContractsForTraceability, deleteContract } from '../api/contracts';
import { useRefresh } from '../context/RefreshContext';
import { useNotification } from '../context/NotificationContext';
import ContractFilters from '../components/ContractFilters';
import Button from '../components/Button';
import { useDebounce } from '../hooks/useDebounce';
import Card from '../components/Card';
import LoadingAnimation from '../components/LoadingAnimation';

const AdminContracts = () => {
  const navigate = useNavigate();
  const { refreshTrigger } = useRefresh();
  const { addNotification } = useNotification();
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [filter, setFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [sortType, setSortType] = useState('fecha-desc');

  const debouncedFilter = useDebounce(filter, 500);
  const debouncedTicketFilter = useDebounce(ticketFilter, 500);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const filters = {};
      if (debouncedFilter && debouncedFilter.trim()) filters.search = debouncedFilter.trim();
      if (debouncedTicketFilter && debouncedTicketFilter.trim()) filters.ticket = debouncedTicketFilter.trim();
      if (sortType && sortType !== 'fecha-desc') filters.sort = sortType;

      const data = await getContractsForTraceability(filters);
      setContracts(Array.isArray(data) ? data : []);
    } catch (error) {
      addNotification(error?.response?.data?.error || 'No se pudieron cargar los contratos', 'error');
    } finally {
      setLoading(false);
    }
  }, [addNotification, debouncedFilter, debouncedTicketFilter, sortType]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts, refreshTrigger]);

  const handleDelete = async (contract) => {
    const confirmed = window.confirm(
      `Se eliminará el contrato ${contract.id} - ${contract.descripcion}. Esta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    setDeletingId(contract.id);
    try {
      await deleteContract(contract.id);
      setContracts((prev) => prev.filter((item) => item.id !== contract.id));
      addNotification('Contrato eliminado correctamente', 'success');
    } catch (error) {
      addNotification(error?.response?.data?.error || 'No se pudo eliminar el contrato', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
      <ContractFilters
        filter={filter}
        setFilter={setFilter}
        ticketFilter={ticketFilter}
        setTicketFilter={setTicketFilter}
        sortType={sortType}
        setSortType={setSortType}
        showTitle={true}
        title="Administración de Contratos"
      />

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Contratos ({contracts.length})
        </h2>
      </div>

      {loading ? (
        <LoadingAnimation text="Cargando contratos..." />
      ) : contracts.length === 0 ? (
        <div className="text-center py-10">
          <span className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
            {filter || ticketFilter
              ? 'No hay contratos que coincidan con los filtros aplicados.'
              : 'No hay contratos disponibles.'}
          </span>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contracts.map((contract) => (
            <div key={contract.id} className="space-y-3">
              <Card
                solicitante={contract.solicitante}
                contract={contract}
                onClick={() => navigate(`/admin/contracts/${contract.id}`)}
                variant="compact"
              />
              <Button
                type="button"
                variant="destructive"
                className="w-full gap-2"
                onClick={() => handleDelete(contract)}
                disabled={deletingId === contract.id}
              >
                <Trash2 className="h-4 w-4" />
                {deletingId === contract.id ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminContracts;
