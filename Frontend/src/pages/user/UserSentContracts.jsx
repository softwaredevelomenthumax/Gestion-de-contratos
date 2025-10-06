import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { getContracts } from '../../api/contracts';
import Card from '../../components/Card';
import { useRefresh } from '../../context/RefreshContext';
import ContractFilters from '../../components/ContractFilters';
import LoadingAnimation from '../../components/LoadingAnimation';
import { useDebounce } from '../../hooks/useDebounce';

const UserSentContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { refreshTrigger } = useRefresh();
  const navigate = useNavigate();
  
  // ✅ Server-side filtering - simple state for filter inputs
  const [filter, setFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [sortType, setSortType] = useState('fecha-desc');

  // ✅ Usar debounce para optimizar las búsquedas
  const debouncedFilter = useDebounce(filter, 500);
  const debouncedTicketFilter = useDebounce(ticketFilter, 500);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Build filter object for backend API
        const filters = {};
        if (debouncedFilter && debouncedFilter.trim()) filters.search = debouncedFilter.trim();
        if (debouncedTicketFilter && debouncedTicketFilter.trim()) filters.ticket = debouncedTicketFilter.trim();
        if (sortType && sortType !== 'fecha-desc') filters.sort = sortType;
        
        const data = await getContracts(filters);
        setContracts(data);
      } catch (error) {
        setError(error.response?.data?.error || 'An error occurred while fetching contracts');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchContracts();
    }
  }, [user, refreshTrigger, debouncedFilter, debouncedTicketFilter, sortType]);

  const isEmptyContractsError = error && contracts.length === 0 && (
    error === 'Invalid contract or file id' ||
    error === 'Invalid contract id' ||
    error === 'Internal server error'
  );

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
        title="Mis Contratos"
      />

      {loading ? (
        <LoadingAnimation text="Cargando contratos enviados..." />
      ) : isEmptyContractsError ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <span className="text-lg text-muted-foreground">No hay contratos disponibles.</span>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded animate-fade-in" role="alert">{error}</div>
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-10">
          <span className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
            {filter || ticketFilter ? 'No hay contratos que coincidan con los filtros aplicados.' : 'No hay contratos disponibles.'}
          </span>
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contracts.map((contract) => (
            <Card
              key={contract.id}
              solicitante={contract.solicitante}
              contract={contract}
              onClick={() => navigate(`/user/contracts/${contract.id}`, { state: { fromMyContracts: true } })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UserSentContracts;
