import { useState, useMemo, useEffect } from 'react';
import api from '../api/axiosInstance';

export const useContractFilters = (contracts, checkOtrosi = false) => {
  const [filter, setFilter] = useState('');
  const [ticketFilter, setTicketFilter] = useState('');
  const [sortType, setSortType] = useState('newest');
  const [contractsWithOtrosi, setContractsWithOtrosi] = useState(new Set());

  // Check which contracts have otrosí - Use included data to prevent N+1 API calls
  useEffect(() => {
    if (!checkOtrosi || !contracts || contracts.length === 0) return;

    // First try to use otrosi data already included in contract response (performance optimization)
    const contractsWithIncludedOtrosi = contracts.filter(contract => 
      contract.otrosi && Array.isArray(contract.otrosi) && contract.otrosi.length > 0
    );

    // If all contracts have otrosi data included, use it directly
    const allHaveOtrosiData = contracts.every(contract => 
      contract.otrosi !== undefined && Array.isArray(contract.otrosi)
    );

    if (allHaveOtrosiData) {
      const contractsWithOtrosiSet = new Set(
        contractsWithIncludedOtrosi.map(contract => contract.id)
      );
      setContractsWithOtrosi(contractsWithOtrosiSet);
      return;
    }

    // Fallback: Make API calls only for contracts without otrosi data
    const checkOtrosiForContracts = async () => {
      const contractsNeedingCheck = contracts.filter(contract => 
        !contract.otrosi || !Array.isArray(contract.otrosi)
      );

      if (contractsNeedingCheck.length === 0) {
        const contractsWithOtrosiSet = new Set(
          contractsWithIncludedOtrosi.map(contract => contract.id)
        );
        setContractsWithOtrosi(contractsWithOtrosiSet);
        return;
      }

      const otrosiChecks = contractsNeedingCheck.map(async (contract) => {
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
      const contractsWithOtrosiFromApi = new Set(
        results
          .filter(result => result.hasOtrosi)
          .map(result => result.contractId)
      );

      // Combine results from included data and API calls
      const allContractsWithOtrosi = new Set([
        ...contractsWithIncludedOtrosi.map(contract => contract.id),
        ...contractsWithOtrosiFromApi
      ]);
      
      setContractsWithOtrosi(allContractsWithOtrosi);
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