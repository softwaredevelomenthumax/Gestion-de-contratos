import React, { useEffect, useState, useCallback } from 'react';
import Card from '../../components/Card';
import { useNavigate } from 'react-router-dom';
import { getLawyerFinalizedContracts } from '../../api/contracts';
import ContractFilters from '../../components/ContractFilters';
// ✅ REMOVED: useContractFilters - backend now handles filtering
import LoadingAnimation from '../../components/LoadingAnimation';

const LawyerFinalizado = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
            
            const finalizedContracts = await getLawyerFinalizedContracts(filters);
            setContracts(finalizedContracts);
        } catch {
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    }, [filter, ticketFilter, sortType]);

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-8">
            <ContractFilters
                filter={filter}
                setFilter={setFilter}
                ticketFilter={ticketFilter}
                setTicketFilter={setTicketFilter}
                sortType={sortType}
                setSortType={setSortType}
                showTitle={true}
                title="Contratos Finalizados"
            />
            <div className="mt-2">
                {loading && <LoadingAnimation text="Cargando contratos finalizados..." />}
                {error && <div className="text-red-500 text-center py-4">{error}</div>}
                {contracts.length > 0 ? (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {contracts.map(contract => (
                            <div key={contract.id}>
                                <Card solicitante={contract.solicitante} contract={contract} onClick={() => navigate(`/lawyer/contracts/${contract.id}`)} />
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && <div className="text-center text-gray-500 py-10">{filter || ticketFilter ? 'No hay contratos que coincidan con los filtros aplicados.' : 'No hay contratos disponibles.'}</div>
                )}
            </div>
        </div>
    );
}

export default LawyerFinalizado;
