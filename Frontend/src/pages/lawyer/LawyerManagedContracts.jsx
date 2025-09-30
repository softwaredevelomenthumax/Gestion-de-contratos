import React, { useEffect, useState, useCallback } from 'react';
import Card from '../../components/Card';
import { getAwaitingUserResponseContracts } from '../../api/contracts';
import { useRefresh } from '../../context/RefreshContext'; 
import { useNavigate } from 'react-router-dom';
import ContractFilters from '../../components/ContractFilters';
// ✅ REMOVED: useContractFilters - backend now handles filtering
import LoadingAnimation from '../../components/LoadingAnimation';

const LawyerManagedContracts = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { refreshTrigger } = useRefresh();
    const navigate = useNavigate();
    
    // ✅ Server-side filtering - simple state for filter inputs
    const [filter, setFilter] = useState('');
    const [ticketFilter, setTicketFilter] = useState('');
    const [sortType, setSortType] = useState('fecha-desc');

    const fetchContracts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Build filter object for backend API
            const filters = {};
            if (filter && filter.trim()) filters.search = filter.trim();
            if (ticketFilter && ticketFilter.trim()) filters.ticket = ticketFilter.trim();
            if (sortType && sortType !== 'fecha-desc') filters.sort = sortType;
            
            // Usar la ruta unificada: devuelve awaiting_user_response y otrosi_awaiting_user_response
            const contracts = await getAwaitingUserResponseContracts(filters);
            setContracts(contracts);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    }, [filter, ticketFilter, sortType]);

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
                title="Contratos Gestionados"
            />

            {loading ? (
                <LoadingAnimation text="Cargando contratos gestionados..." />
            ) : error ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-red-500 dark:text-red-400 shadow rounded-md">
                        {error}
                    </div>
                </div>
            ) : contracts.length === 0 ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        {filter || ticketFilter ? 'No hay contratos que coincidan con los filtros aplicados.' : 'No hay contratos gestionados disponibles.'}
                    </div>
                </div>
            ) : (
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {contracts.map((contract) => (
                        <div key={contract.id} onClick={() => handleCardClick(contract.id)}>
                            <Card
                                solicitante={contract.solicitante}
                                contract={contract}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LawyerManagedContracts;
