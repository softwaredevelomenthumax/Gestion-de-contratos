import React, { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { getAwaitingUserResponseContracts } from '../../api/contracts';
import { useRefresh } from '../../context/RefreshContext'; 
import { useNavigate } from 'react-router-dom';
import ContractFilters from '../../components/ContractFilters';
import { useContractFilters } from '../../hooks/useContractFilters';
import LoadingAnimation from '../../components/LoadingAnimation';

const LawyerManagedContracts = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
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
            // Usar la ruta unificada: devuelve awaiting_user_response y otrosi_awaiting_user_response
            const contracts = await getAwaitingUserResponseContracts();
            setContracts(contracts);
        } catch (err) {
            console.error('Error fetching contracts:', err);
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    };

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
            ) : filteredAndSortedContracts.length === 0 ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        No hay contratos gestionados disponibles.
                    </div>
                </div>
            ) : (
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {filteredAndSortedContracts.map((contract) => (
                        <div key={contract.id} onClick={() => handleCardClick(contract.id)}>
                            <Card
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

export default LawyerManagedContracts;
