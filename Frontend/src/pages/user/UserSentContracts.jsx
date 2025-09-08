import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { getContracts } from '../../api/contracts';
import Card from '../../components/Card';
import { useRefresh } from '../../context/RefreshContext';
import { Button } from '@/components/ui/button';
import ContractFilters from '../../components/ContractFilters';
import { useContractFilters } from '../../hooks/useContractFilters';

const UserSentContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const { refreshTrigger } = useRefresh();
  
  // Use custom hook for filtering
  const {
    filter,
    setFilter,
    ticketFilter,
    setTicketFilter,
    sortType,
    setSortType,
    filteredAndSortedContracts
  } = useContractFilters(contracts);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getContracts();
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
  }, [user, refreshTrigger]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-lg text-muted-foreground">Cargando...</span>
      </div>
    );
  }

  if (error && contracts.length === 0 && (
    error === "Invalid contract or file id" ||
    error === "Invalid contract id" ||
    error === "Internal server error"
  )) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-lg text-muted-foreground">No hay contratos disponibles.</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="bg-red-900/20 border border-red-700 text-red-300 px-4 py-3 rounded animate-fade-in" role="alert">{error}</div>
      </div>
    );
  }

  if (filteredAndSortedContracts.length === 0 && !loading && !error) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <span className="text-lg text-muted-foreground">No hay contratos disponibles.</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">Mis Contratos</h1>
        <p className="text-muted-foreground text-lg">Aquí puedes ver todos los contratos que has creado o gestionado.</p>
      </div>
      
      <ContractFilters
        filter={filter}
        setFilter={setFilter}
        ticketFilter={ticketFilter}
        setTicketFilter={setTicketFilter}
        sortType={sortType}
        setSortType={setSortType}
      />

      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredAndSortedContracts.map((contract) => (
          <div key={contract.id}>
            <Card
              descripcion={contract.descripcion}
              solicitante={contract.gerenteArea || contract.solicitante?.firstName || ''}
              contract={contract}
            />
            <div className="mt-4 flex justify-end">
              <Button
                asChild
                className="!px-4 !py-2 !rounded-lg !bg-blue-500 hover:!bg-blue-600 !text-white !shadow-md"
              >
                <Link to={`/user/contracts/${contract.id}`} state={{ fromMyContracts: true }}>
                  Ver Contrato
                </Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserSentContracts;
