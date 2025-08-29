import { useState, useMemo } from 'react';

export const useContractFilters = (contracts) => {
  const [filter, setFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [sortType, setSortType] = useState('newest');

  // Filtering and sorting logic
  const filteredAndSortedContracts = useMemo(() => {
    if (!contracts || !Array.isArray(contracts)) {
      return [];
    }
    let currentContracts = [...contracts];

    // Filter by description
    if (filter) {
      currentContracts = currentContracts.filter(contract =>
        (contract.descripcion || '').toLowerCase().includes(filter.toLowerCase())
      );
    }

    // Filter by ticket/radicado ID
    if (ticketFilter) {
      currentContracts = currentContracts.filter(contract =>
        contract.id.toString().includes(ticketFilter)
      );
    }

    // Apply sort/filter type
    if (sortType === 'with-otrosi') {
      // Filter contracts that have otrosí (assuming otrosi array exists and has length > 0)
      currentContracts = currentContracts.filter(contract => 
        contract.otrosi && contract.otrosi.length > 0
      );
      // Sort by newest within this filtered set
      currentContracts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.id - a.id;
      });
    } else if (sortType === 'without-otrosi') {
      // Filter contracts that don't have otrosí
      currentContracts = currentContracts.filter(contract => 
        !contract.otrosi || contract.otrosi.length === 0
      );
      // Sort by newest within this filtered set
      currentContracts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.id - a.id;
      });
    } else if (sortType === 'newest') {
      currentContracts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.id - a.id;
      });
    } else if (sortType === 'oldest') {
      currentContracts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(a.createdAt) - new Date(b.createdAt);
        }
        return a.id - b.id;
      });
    }

    return currentContracts;
  }, [contracts, filter, ticketFilter, sortType]);

  return {
    filter,
    setFilter,
    searchTerm: ticketFilter,
    setSearchTerm: setTicketFilter,
    sortType,
    setSortType,
    filteredContracts: filteredAndSortedContracts,
    filteredAndSortedContracts
  };
};
//en el formulario agregar un campo opcional el cual diga "firmar otrosi" (ya que en este caso el usuario tambien puede firmar primero) y si es firmado debe ser pasado a un estado llamado signature_otrosi_already_signedByUser y si no es firmado pasa al estado llamado awaiting_lawyer_review".
 
//en devuelto si el contrato tiene el estado llamado signature_otrosi_already_signedByUser debe estar aparecer al hacerle clic a la carta contratos devueltos y es firmado por el abogado pasa directamente a signed y el contrato otrosi pasa a aprovado pero si tiene el estado awaiting_lawyer_review sigue con ciclo de vida normal