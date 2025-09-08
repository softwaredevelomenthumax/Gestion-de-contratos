import React, { useEffect, useState } from 'react';
import { Card } from '../../components/Card';
import { getAwaitingUserResponseContracts } from '../../api/contracts';
import { useRefresh } from '../../context/RefreshContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from "../../context/AuthContext";
import ContractFilters from '../../components/ContractFilters';
import { useContractFilters } from '../../hooks/useContractFilters';

const UserAwaitingResponseContracts = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { refreshTrigger } = useRefresh();
    const navigate = useNavigate();
    const { user } = useAuth();
    
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
            const contracts = await getAwaitingUserResponseContracts();
            setContracts(contracts);
        } catch {
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = async (contractId) => {
        navigate(`/user/contracts/${contractId}`);
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
                title="Contratos Esperando Respuesta"
            />

            {loading ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Cargando...
                    </div>
                </div>
            ) : error ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-red-500 dark:text-red-400 shadow rounded-md">
                        {error}
                    </div>
                </div>
            ) : filteredAndSortedContracts.length === 0 ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        No hay contratos esperando respuesta disponibles.
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

export default UserAwaitingResponseContracts;
