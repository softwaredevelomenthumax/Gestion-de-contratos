import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, FileText } from 'lucide-react';
import { getContractsForTraceability, deleteContract } from '../api/contracts';
import { useRefresh } from '../context/RefreshContext';
import { useNotification } from '../context/NotificationContext';
import ContractFilters from '../components/ContractFilters';
import Button from '../components/Button';
import { useDebounce } from '../hooks/useDebounce';

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
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight text-center">
        Administración de Contratos
      </h1>

      <div className="mb-8">
        <ContractFilters
          filter={filter}
          setFilter={setFilter}
          ticketFilter={ticketFilter}
          setTicketFilter={setTicketFilter}
          sortType={sortType}
          setSortType={setSortType}
        />
      </div>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">
          Contratos ({contracts.length})
        </h2>
        {loading && <span className="text-sm text-muted-foreground">Cargando...</span>}
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {contracts.map((contract) => (
          <div key={contract.id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <FileText className="h-4 w-4" />
                  <span>Radicado #{contract.id}</span>
                </div>
                <h3 className="text-lg font-semibold text-foreground truncate">{contract.descripcion}</h3>
                <p className="mt-2 text-sm text-muted-foreground">Proveedor / Cliente: {contract.proveedor}</p>
                <p className="text-sm text-muted-foreground">
                  Solicitante: {contract.solicitante?.firstName} {contract.solicitante?.lastName}
                </p>
                <p className="text-sm text-muted-foreground">Estado: {contract.estado}</p>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate(`/trazabilidad/${contract.id}`)}
                >
                  <Eye className="h-4 w-4" />
                  Ver
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="gap-2"
                  onClick={() => handleDelete(contract)}
                  disabled={deletingId === contract.id}
                >
                  <Trash2 className="h-4 w-4" />
                  {deletingId === contract.id ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {!loading && contracts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-muted-foreground">
          No hay contratos para mostrar.
        </div>
      )}
    </div>
  );
};

export default AdminContracts;
