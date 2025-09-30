import React from 'react';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { X, Filter } from 'lucide-react';
import { Badge } from './ui/badge';

const filterOptions = [
  { value: 'fecha-desc', label: 'Más reciente' },
  { value: 'fecha-asc', label: 'Más antiguo' },
  { value: 'proveedor-asc', label: 'Proveedor (A-Z)' },
  { value: 'proveedor-desc', label: 'Proveedor (Z-A)' },
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
  const effectiveTicketFilter = typeof ticketFilter !== 'undefined' ? ticketFilter : (searchTerm || '');
  const handleSetTicketFilter = typeof setTicketFilter === 'function' ? setTicketFilter : (setSearchTerm || (() => {}));

  // Calculate active filters count
  const activeFiltersCount = [
    filter && filter.trim(),
    effectiveTicketFilter && effectiveTicketFilter.trim(),
    sortType && sortType !== 'fecha-desc'
  ].filter(Boolean).length;

  // Clear all filters handler
  const handleClearFilters = () => {
    if (setFilter) setFilter('');
    handleSetTicketFilter('');
    if (setSortType) setSortType('fecha-desc');
  };

  return (
    <>
      {/* Filtros */}
      <div className="sticky top-4 z-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-lg">
        {/* Header with clear button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Filtros</h3>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} activo{activeFiltersCount !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 lg:px-3 text-xs hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <X className="h-4 w-4 mr-1" />
              Limpiar filtros
            </Button>
          )}
        </div>
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
            <Select value={sortType || 'fecha-desc'} onValueChange={setSortType}>
              <SelectTrigger id="sort-select" className="w-full border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:focus:ring-blue-400/20">
                <SelectValue placeholder="Ordenar por..." />
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
