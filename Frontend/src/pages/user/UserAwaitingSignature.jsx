import React, { useEffect, useState } from 'react';
import Card from '../../components/Card';
import { getAwaitingSignatureContracts } from '../../api/contracts';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Label } from '../../components/ui/label';
import LoadingAnimation from '../../components/LoadingAnimation';

const sortOptions = [
  { value: 'newest', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antiguo' },
];

const AwaitingSignature = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [ticketFilter, setTicketFilter] = useState('');
    const [sortType, setSortType] = useState('newest');

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 DEBUG - Llamando a getAwaitingSignatureContracts...');
            const contracts = await getAwaitingSignatureContracts();
            console.log('🔍 DEBUG - Contratos recibidos:', contracts);
            console.log('🔍 DEBUG - Número de contratos:', contracts.length);
            
            if (contracts.length > 0) {
                console.log('🔍 DEBUG - Primer contrato:', {
                    id: contracts[0].id,
                    estado: contracts[0].estado,
                    solicitanteId: contracts[0].solicitanteId,
                    descripcion: contracts[0].descripcion
                });
            }
            
            setContracts(contracts);
        } catch (err) {
            console.error('❌ Error fetching contracts:', err);
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    };

    // Filtering and sorting logic
    const filteredContracts = contracts.filter(contract => {
        const matchesDescription = (contract.descripcion || '')
            .toLowerCase()
            .includes(filter.toLowerCase());
        
        const matchesTicket = ticketFilter === '' || 
            contract.id.toString().includes(ticketFilter);
        
        return matchesDescription && matchesTicket;
    });

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
        }
        return 0;
    });

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
            <div className="sticky top-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 flex flex-col md:flex-row md:items-end gap-6 mb-6 mt-8 shadow-lg">
                <div className="flex-1 min-w-0">
                    <Label htmlFor="filter-input" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
                        Filtrar por descripción
                    </Label>
                    <Input
                        id="filter-input"
                        placeholder="Buscar contratos..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        autoComplete="off"
                        className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                    />
                </div>
                <div className="w-full md:w-48">
                    <Label htmlFor="ticket-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
                        Buscar por ticket
                    </Label>
                    <Input
                        id="ticket-filter"
                        placeholder="Número de ticket..."
                        value={ticketFilter}
                        onChange={e => setTicketFilter(e.target.value)}
                        autoComplete="off"
                        className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
                    />
                </div>
                <div className="w-full md:w-64">
                    <Label htmlFor="sort-select" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
                        Ordenar por
                    </Label>
                    <Select value={sortType} onValueChange={setSortType}>
                        <SelectTrigger className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {sortOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Título */}
            <div className="mb-8 flex items-center">
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
                <span className="px-4 text-gray-500 text-sm">Contratos a la espera de tu firma</span>
                <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            {loading ? (
                <LoadingAnimation text="Cargando contratos esperando firma..." />
            ) : error ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-red-500 dark:text-red-400 shadow rounded-md">
                        {error}
                    </div>
                </div>
            ) : sortedContracts.length === 0 ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        No hay contratos esperando firma disponibles.
                    </div>
                </div>
            ) : (
                <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedContracts.map((contract) => (
                        <Card
                            key={contract.id}
                            descripcion={contract.descripcion}
                            solicitante={contract.gerenteArea || contract.solicitante?.firstName || ''}
                            contract={contract}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default AwaitingSignature; 