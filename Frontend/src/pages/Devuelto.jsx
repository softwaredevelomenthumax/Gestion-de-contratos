import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { getReturnedContracts } from '../api/contracts';

const sortOptions = [
  { value: 'newest', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antiguo' },
  { value: 'radicado-high', label: 'Radicado más alto' },
  { value: 'radicado-low', label: 'Radicado más bajo' },
];

const Devuelto = () => {
    console.log('🔍 DEBUG: Devuelto component is mounting...');
    
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [sortType, setSortType] = useState('newest');

    useEffect(() => {
        console.log('🔍 DEBUG: useEffect in Devuelto is running...');
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 DEBUG Frontend: Llamando getReturnedContracts...');
            const returnedContracts = await getReturnedContracts();
            console.log('🔍 DEBUG Frontend: Contratos recibidos:', returnedContracts.length);
            returnedContracts.forEach(contract => {
                console.log(`  - Contract ID: ${contract.id}, Estado: ${contract.estado}, Descripción: ${contract.descripcion}`);
            });
            setContracts(returnedContracts);
        } catch (error) {
            console.error('❌ Error Frontend:', error);
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    };

    // Filtering and sorting logic
    const filteredContracts = contracts.filter(contract =>
        (contract.descripcion || '')
            .toLowerCase()
            .includes(filter.toLowerCase())
    );

    const sortedContracts = [...filteredContracts].sort((a, b) => {
        if (sortType === 'newest') {
            if (a.createdAt && b.createdAt) {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            return b.id - a.id;
        } else if (sortType === 'oldest') {
            if (a.createdAt && b.createdAt) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            return a.id - b.id;
        } else if (sortType === 'radicado-high') {
            return b.id - a.id;
        } else if (sortType === 'radicado-low') {
            return a.id - b.id;
        }
        return 0;
    });

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div
                className="sticky top-4 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-end gap-4 mb-6 mt-8"
            >
                <input
                    type="text"
                    placeholder="Filtrar por descripción"
                    value={filter}
                    onChange={e => setFilter(e.currentTarget.value)}
                    className="flex-1 min-w-0 p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                />
                <select
                    className="w-full md:w-64 p-2 border border-gray-300 rounded-md dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                    value={sortType}
                    onChange={e => setSortType(e.currentTarget.value)}
                >
                    <option value="newest">Ordenar por: Más nuevo primero</option>
                    <option value="oldest">Ordenar por: Más antiguo primero</option>
                    <option value="radicado-high">Ordenar por: Radicado más alto</option>
                    <option value="radicado-low">Ordenar por: Radicado más bajo</option>
                </select>
            </div>
            <div className="mt-2">
                {loading && <div className="text-center text-lg text-gray-500 py-10">Cargando...</div>}
                {error && <div className="text-red-500 text-center py-4">{error}</div>}
                {sortedContracts.length > 0 ? (
                    <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {sortedContracts.map(contract => (
                            <div key={contract.id}>
                                <Card contract={contract} descripcion={contract.descripcion} solicitante={contract.solicitante} />
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

export default Devuelto;

//eliminar