import { useState, useMemo, useEffect } from 'react';
import api from '../api/axiosInstance';

export const useContractFilters = (contracts, checkOtrosi = false) => {
  const [filter, setFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [sortType, setSortType] = useState('newest');
  const [contractsWithOtrosi, setContractsWithOtrosi] = useState(new Set());

  // Check which contracts have otrosí (only if checkOtrosi is true)
  useEffect(() => {
    if (!checkOtrosi || !contracts || contracts.length === 0) return;

    const checkOtrosiForContracts = async () => {
      const otrosiChecks = contracts.map(async (contract) => {
        try {
          const response = await api.get(`/otrosi/contract/${contract.id}`);
          return {
            contractId: contract.id,
            hasOtrosi: response.data && response.data.length > 0
          };
        } catch {
          return {
            contractId: contract.id,
            hasOtrosi: false
          };
        }
      });

      const results = await Promise.all(otrosiChecks);
      const contractsWithOtrosiSet = new Set(
        results
          .filter(result => result.hasOtrosi)
          .map(result => result.contractId)
      );
      
      setContractsWithOtrosi(contractsWithOtrosiSet);
    };

    checkOtrosiForContracts();
  }, [contracts, checkOtrosi]);

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
      if (checkOtrosi) {
        // Use API-based check for otrosí
        currentContracts = currentContracts.filter(contract => 
          contractsWithOtrosi.has(contract.id)
        );
      } else {
        // Use contract property for otrosí (for pages that already have this data)
        currentContracts = currentContracts.filter(contract => 
          contract.otrosi && contract.otrosi.length > 0
        );
      }
      // Sort by newest within this filtered set
      currentContracts.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return b.id - a.id;
      });
    } else if (sortType === 'without-otrosi') {
      if (checkOtrosi) {
        // Use API-based check for otrosí
        currentContracts = currentContracts.filter(contract => 
          !contractsWithOtrosi.has(contract.id)
        );
      } else {
        // Use contract property for otrosí (for pages that already have this data)
        currentContracts = currentContracts.filter(contract => 
          !contract.otrosi || contract.otrosi.length === 0
        );
      }
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
  }, [contracts, filter, ticketFilter, sortType, contractsWithOtrosi, checkOtrosi]);

  return {
    filter,
    setFilter,
    ticketFilter,
    setTicketFilter,
    searchTerm: ticketFilter,
    setSearchTerm: setTicketFilter,
    sortType,
    setSortType,
    filteredContracts: filteredAndSortedContracts,
    filteredAndSortedContracts
  };
};