import React, { useEffect, useState, useCallback } from 'react';
import Card from '../../components/Card';
import { getLawyerAwaitingReviewContracts } from '../../api/contracts';
import { useRefresh } from '../../context/RefreshContext';
import { useNavigate } from 'react-router-dom';
import ContractFilters from '../../components/ContractFilters';
import LoadingAnimation from '../../components/LoadingAnimation';
import { useDebounce } from '../../hooks/useDebounce';

const LawyerAwaitingReviewContracts = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { refreshTrigger } = useRefresh();
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
        setError(null);
        try {
            // Build filter object for backend API
            const filters = {};
            if (debouncedFilter && debouncedFilter.trim()) filters.search = debouncedFilter.trim();
            if (debouncedTicketFilter && debouncedTicketFilter.trim()) filters.ticket = debouncedTicketFilter.trim();
            if (sortType && sortType !== 'fecha-desc') filters.sort = sortType;
            
            const contracts = await getLawyerAwaitingReviewContracts(filters);
            setContracts(contracts);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    }, [debouncedFilter, debouncedTicketFilter, sortType]);

    useEffect(() => {
        fetchContracts();
    }, [refreshTrigger, fetchContracts]);

    const handleCardClick = async (contractId) => {
        navigate(`/lawyer/contracts/${contractId}`);
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
                title="Contratos para Revisar"
            />

            {loading ? (
                <LoadingAnimation text="Cargando contratos para revisar..." />
            ) : error ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-red-500 dark:text-red-400 shadow rounded-md">
                        {error}
                    </div>
                </div>
            ) : contracts.length === 0 ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        {filter || ticketFilter ? 'No hay contratos que coincidan con los filtros aplicados.' : 'No hay contratos para revisar disponibles.'}
                    </div>
                </div>
            ) : (
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {contracts.map((contract) => (
                        <div key={contract.id} onClick={() => handleCardClick(contract.id)}>
                            <Card
                                solicitante={contract.solicitante}
                                contract={contract}
                                variant="lawyer"
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LawyerAwaitingReviewContracts;
