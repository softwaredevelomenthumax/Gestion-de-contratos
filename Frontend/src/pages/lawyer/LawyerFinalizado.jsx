import React, { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { useNavigate } from 'react-router-dom';
import { getLawyerFinalizedContracts } from '../../api/contracts';
import ContractFilters from '../../components/ContractFilters';
import { useContractFilters } from '../../hooks/useContractFilters';
import LoadingAnimation from '../../components/LoadingAnimation';

const LawyerFinalizado = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
    }, []);

    const fetchContracts = async () => {
        setLoading(true);
        setError(null);
        try {
            const finalizedContracts = await getLawyerFinalizedContracts();
            setContracts(finalizedContracts);
        } catch {
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    };

    // filteredAndSortedContracts is now handled by the custom hook

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
                {filteredAndSortedContracts.length > 0 ? (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {filteredAndSortedContracts.map(contract => (
                            <div key={contract.id}>
                                <Card descripcion={contract.descripcion} solicitante={contract.solicitante} contract={contract} onClick={() => navigate(`/lawyer/contracts/${contract.id}`)} />
                            </div>
                        ))}
                    </div>
                ) : (
                    !loading && !error && <div className="text-center text-gray-500 py-10">No hay contratos disponibles.</div>
                )}
            </div>
        </div>
    );
}

export default LawyerFinalizado;
