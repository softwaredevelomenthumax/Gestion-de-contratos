import React, { useEffect, useState } from 'react';
import { getContractsForTraceability } from '../api/contracts';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { useNavigate } from 'react-router-dom';
import ContractFilters from '../components/ContractFilters';
import { useContractFilters } from '../hooks/useContractFilters';

const Trazabilidad = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [_loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Hooks para filtros - habilitamos verificación de otrosí para Trazabilidad
  const {
    filter,
    setFilter,
    ticketFilter,
    setTicketFilter,
    sortType,
    setSortType,
    filteredContracts
  } = useContractFilters(contracts, true);

  useEffect(() => {
    const fetchContracts = async () => {
      setLoading(true);
      try {
        const data = await getContractsForTraceability();
        setContracts(data);
      } finally {
        setLoading(false);
      }
    };
    fetchContracts();
  }, [user]);

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <h1 className="text-4xl font-extrabold text-foreground mb-8 tracking-tight text-center">Trazabilidad de Contratos</h1>
      
      {/* Filtros */}
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

      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Contratos ({(filteredContracts || []).length})
        </h2>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(filteredContracts || []).map((contract) => (
            <Card
              key={contract.id}
              solicitante={contract.solicitante}
              contract={contract}
              onClick={() => navigate(`/trazabilidad/${contract.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Trazabilidad; 