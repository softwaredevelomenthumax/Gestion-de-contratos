import React from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

const filterOptions = [
  { value: 'newest', label: 'Más reciente' },
  { value: 'oldest', label: 'Más antiguo' },
  { value: 'with-otrosi', label: 'Solo con otrosí' },
  { value: 'without-otrosi', label: 'Sin otrosí' },
];
const ContractFilters = ({ 
  filter, 
  setFilter, 
  ticketFilter, 
  setTicketFilter, 
  searchTerm,
  setSearchTerm,
  sortType, 
  setSortType,
  showTitle = false,
  title = "Contratos"
}) => {
  // Prefer explicit ticketFilter props; fall back to searchTerm aliases
  const effectiveTicketFilter = typeof ticketFilter !== 'undefined' ? ticketFilter : (searchTerm || '');
  const handleSetTicketFilter = typeof setTicketFilter === 'function' ? setTicketFilter : (setSearchTerm || (() => {}));

  return (
    <>
      {/* Filtros */}
      <div className="sticky top-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1">
            <Label htmlFor="filter-input" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
              Filtrar por descripción
            </Label>
            <Input
              id="filter-input"
              placeholder="Buscar contratos..."
              value={filter}
              onChange={e => setFilter && setFilter(e.target.value)}
              autoComplete="off"
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
            />
          </div>
          <div className="lg:col-span-1">
            <Label htmlFor="ticket-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
              Buscar por radicado
            </Label>
            <Input
              id="ticket-filter"
              placeholder="Número de radicado..."
              value={effectiveTicketFilter}
              onChange={e => handleSetTicketFilter(e.target.value)}
              autoComplete="off"
              className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20"
            />
          </div>
          <div className="lg:col-span-1">
            <Label htmlFor="sort-select" className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2 block">
              Filtros
            </Label>
            <Select value={sortType} onValueChange={setSortType}>
              <SelectTrigger id="sort-select" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20">
                <SelectValue placeholder="Selecciona filtro" />
              </SelectTrigger>
              <SelectContent>
                {filterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {showTitle && (
        <div className="mb-8 flex items-center">
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          <span className="px-4 text-gray-500 text-sm">{title}</span>
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
        </div>
      )}
    </>
  );
};

export default ContractFilters;
