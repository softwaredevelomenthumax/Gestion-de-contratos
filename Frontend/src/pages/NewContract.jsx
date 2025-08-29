import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { LawyerCardSkeleton } from '../components/Card';
import { getAllContracts } from '../api/contracts';
import axios from 'axios';
import { useRefresh } from '../context/RefreshContext';

const NewContract = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { refreshTrigger } = useRefresh();

    useEffect(() => {
        
    }, [refreshTrigger]);

    const fetchContracts = async () => {
        setLoading(true);
        setError(null);
        try {
            const contracts = await getAllContracts();
            setContracts(contracts);
        } catch (err) {
            setError('Error al cargar los contratos. Por favor, intente de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = async (contractId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.patch(`http://localhost:3001/api/contracts/${contractId}/viewed`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchContracts(); // Refresh list
            navigate(`/lawyer/contracts/${contractId}`);
        } catch (err) {
            alert('Error al actualizar el estado o navegar');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Nuevos Contratos</h1>

            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Error</p>
                    <p>{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {loading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <LawyerCardSkeleton key={index} />
                    ))
                ) : contracts.length > 0 ? (
                    contracts.map(contract => (
                        <div key={contract.id} onClick={() => handleCardClick(contract.id)}>
                            <Card tipoSolicitud={contract.tipoSolicitud} descripcion={contract.descripcion} solicitante={contract.solicitante} contract={contract} />
                        </div>
                    ))
                ) : (
                    !error && (
                        <div className="col-span-full text-center py-12">
                            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">No hay contratos nuevos por ahora.</h2>
                            <p className="text-gray-500 dark:text-gray-400 mt-2">Parece que todo está al día. ¡Buen trabajo!</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}

export default NewContract;