import React, { useEffect, useState } from "react";
import Card, { LawyerCardSkeleton } from "../components/Card";
import { getNewContracts } from "../api/contracts";
import { useRefresh } from "../context/RefreshContext";
import { useNavigate } from "react-router-dom";
import ContractFilters from '../components/ContractFilters';
import { useContractFilters } from '../hooks/useContractFilters';

const LawyerNewContracts = () => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { refreshTrigger } = useRefresh();
  const navigate = useNavigate();
  
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
    fetchContracts();
  }, [refreshTrigger]);

  const fetchContracts = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 DEBUG - Llamando a getNewContracts...');
      const contracts = await getNewContracts(); // This fetches only 'new' contracts
      
      console.log('📥 Contratos recibidos del API:', contracts.length);
      console.log('📊 Estados de contratos recibidos:', contracts.map(c => ({ id: c.id, estado: c.estado })));
      
      // Additional filter to ensure only 'new' status contracts are shown
      const newContracts = contracts.filter(contract => contract.estado === 'new');
      
      console.log('✅ Contratos filtrados con estado "new":', newContracts.length);
      console.log('📋 Estados de contratos filtrados:', newContracts.map(c => ({ id: c.id, estado: c.estado })));
      
      setContracts(newContracts);
      
      // Debug log to verify only new contracts are shown
      console.log('🔍 Contratos nuevos cargados:', newContracts.length);
      console.log('📋 Estados de contratos:', newContracts.map(c => ({ id: c.id, estado: c.estado })));
    } catch (err) {
      console.error('❌ Error al cargar contratos:', err);
      setError(
        "Error al cargar los contratos. Por favor, intente de nuevo más tarde."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = async (contractId) => {
    // No need to update viewed status here, it's handled in ContractDetail
    navigate(`/lawyer/contracts/${contractId}`);
  };



  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
            Nuevos Contratos
          </h1>
          <p className="text-muted-foreground text-lg">
            Contratos nuevos que requieren revisión legal.
          </p>
        </div>
        <div className="text-center mb-4">
          <p className="text-muted-foreground">Cargando contratos nuevos...</p>
        </div>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <LawyerCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center py-10">
          <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-red-500 dark:text-red-400 shadow rounded-md">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
          Nuevos Contratos
          {contracts.length > 0 && (
            <span className="ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {contracts.length}
            </span>
          )}
        </h1>
        <p className="text-muted-foreground text-lg">
          Contratos nuevos que requieren revisión legal.
        </p>
      </div>

      {contracts.length > 0 && (
        <div className="mb-6 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              {contracts.length} contrato{contracts.length !== 1 ? 's' : ''} nuevo{contracts.length !== 1 ? 's' : ''} pendiente{contracts.length !== 1 ? 's' : ''} de revisión
            </span>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Solo contratos en estado "Nuevo"
            </span>
          </div>
        </div>
      )}

      <ContractFilters
        filter={filter}
        setFilter={setFilter}
        ticketFilter={ticketFilter}
        setTicketFilter={setTicketFilter}
        sortType={sortType}
        setSortType={setSortType}
      />

      {filteredAndSortedContracts.length === 0 ? (
        <div className="text-center py-10">
          {contracts.length === 0 ? (
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                No hay contratos nuevos disponibles.
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Los contratos nuevos aparecerán aquí cuando los usuarios los creen.</p>
                <p>Estos contratos requieren revisión legal antes de continuar.</p>
              </div>
            </div>
          ) : (
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
              No hay contratos que coincidan con los filtros aplicados.
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredAndSortedContracts.map((contract) => (
            <div key={contract.id} onClick={() => handleCardClick(contract.id)}>
              <Card
                tipoSolicitud={contract.tipoSolicitud}
                descripcion={contract.descripcion}
                solicitante={contract.gerenteArea || contract.solicitante?.firstName || ''}
                contract={contract}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LawyerNewContracts;
