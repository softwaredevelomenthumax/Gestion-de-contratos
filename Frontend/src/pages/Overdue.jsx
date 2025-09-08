import React, { useEffect, useState } from 'react';
import Card from '../components/Card';
import { getAllContracts } from '../api/contracts';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Label } from '../components/ui/label';

const sortOptions = [
  { value: 'newest', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antiguo' },
];

const Overdue = () => {
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
            const allContracts = await getAllContracts();
            const overdueContracts = allContracts.filter(contract => contract.estado === 'vencido');
            setContracts(overdueContracts);
        } catch (err) {
            setError('Error al cargar los contratos');
        } finally {
            setLoading(false);
        }
    };

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
            ) : sortedContracts.length === 0 ? (
                <div className="text-center py-10">
                    <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-gray-500 dark:text-gray-400 shadow rounded-md">
                        No hay contratos vencidos disponibles.
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

export default Overdue;

//cuando el contrato pasa a 7 dias sin respuesta del abogado el contrato debi ir a overdue y debe estar en una columnna de la tabla contratos diciendo "overdue: true". el estado se mantiene cual es y cuando el abogado responde debe pasar al siguiente estado del que le sigue al anterior y el overdue debe ser false.

//cuando el contrato esta en overdue: true debe aparecer en la tarjeta de contratos vencidos y como el overdue es true no debe aparecer en otras tarjetass solo en la de vencidos.

//aprobado
