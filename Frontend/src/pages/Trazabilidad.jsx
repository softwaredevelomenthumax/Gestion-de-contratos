import React, { useEffect, useState, useCallback } from 'react';
import { getContractsForTraceability } from '../api/contracts';
import { useAuth } from '../hooks/useAuth';
import { Card } from '../components/Card';
import { useNavigate } from 'react-router-dom';
import ContractFilters from '../components/ContractFilters';
import { useDebounce } from '../hooks/useDebounce';

const Trazabilidad = () => {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
  const [_loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // ✅ Server-side filtering - simple state for filter inputs
  const [filter, setFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [sortType, setSortType] = useState('fecha-desc');

  // ✅ Usar debounce para optimizar las búsquedas
  const debouncedFilter = useDebounce(filter, 500);
  const debouncedTicketFilter = useDebounce(ticketFilter, 500);

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      // Build filter object for backend API
      const filters = {};
      if (debouncedFilter && debouncedFilter.trim()) filters.search = debouncedFilter.trim();
      if (debouncedTicketFilter && debouncedTicketFilter.trim()) filters.ticket = debouncedTicketFilter.trim();
      if (sortType && sortType !== 'fecha-desc') filters.sort = sortType;
      
      const data = await getContractsForTraceability(filters);
      setContracts(data);
    } finally {
      setLoading(false);
    }
  }, [debouncedFilter, debouncedTicketFilter, sortType]);

  useEffect(() => {
    if (user) {
      fetchContracts();
    }
  }, [user, fetchContracts]);

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
          Contratos ({(contracts || []).length})
        </h2>
        <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {(contracts || []).map((contract) => (
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