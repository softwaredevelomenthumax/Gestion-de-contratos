import React from 'react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import api, { clearCache } from '../../api/axiosInstance';
import { useRefresh } from '../../context/RefreshContext';
import Badge from './Badge';
import IconBlock from './IconBlock';
import OtrosiBadge from './OtrosiBadge';
import MetaRow from './MetaRow';
import Viewers from './Viewers';

// Helper to format contract types for display
const formatContractType = (contractType) => {
  if (!contractType) return "";
  
  const contractTypeMap = {
    'prestacion_de_servicios': 'Prestación de Servicios',
    'compra_venta': 'Compra Venta',
    'arrendamiento': 'Arrendamiento',
    'licencia': 'Licencia',
    'concesion': 'Concesión',
    'suministro': 'Suministro',
    'obra_civil': 'Obra Civil',
    'consultoria': 'Consultoría',
    'mantenimiento': 'Mantenimiento',
    'transporte': 'Transporte',
    'seguridad': 'Seguridad',
    'limpieza': 'Limpieza',
    'catering': 'Catering',
    'tecnologia': 'Tecnología',
    'marketing': 'Marketing',
    'legal': 'Legal',
    'contable': 'Contable',
    'medica': 'Médica',
    'educativa': 'Educativa',
    'otro': 'Otro'
  };
  
  if (contractTypeMap[contractType.toLowerCase()]) {
    return contractTypeMap[contractType.toLowerCase()];
  }
  
  return contractType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Helper function to safely extract solicitante name
const getSolicitanteDisplay = (solicitante) => {
  if (!solicitante) return '';
  if (typeof solicitante === 'string') return solicitante;
  if (typeof solicitante === 'object') {
    if (solicitante.firstName && solicitante.lastName) {
      return `${solicitante.firstName} ${solicitante.lastName}`;
    }
    if (solicitante.firstName) return solicitante.firstName;
    if (solicitante.lastName) return solicitante.lastName;
    if (solicitante.email) return solicitante.email;
    return '';
  }
  return String(solicitante);
};

/**
 * Unified Card component for displaying contracts
 * @param {Object} props
 * @param {Object} props.contract - Contract data object
 * @param {Object|string} props.solicitante - Solicitante information
 * @param {Function} props.onClick - Optional click handler (overrides default navigation)
 * @param {string} props.variant - Card variant: 'compact' (default) or 'lawyer'
 * @param {string} props.className - Additional CSS classes
 */
export const Card = React.memo(function Card({ 
  contract, 
  solicitante, 
  onClick, 
  variant = 'compact',
  className 
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerRefresh } = useRefresh();
  const [hasOtrosi, setHasOtrosi] = React.useState(false);

  // Check if contract has otrosi
  React.useEffect(() => {
    if (!contract?.id) return;
    
    if (contract?.hasOtrosi !== undefined) {
      setHasOtrosi(contract.hasOtrosi);
      return;
    }
    
    if (contract?.otrosi !== undefined && Array.isArray(contract.otrosi)) {
      setHasOtrosi(contract.otrosi.length > 0);
      return;
    }
  }, [contract?.id, contract?.hasOtrosi, contract?.otrosi]);

  const handleCardClick = async () => {
    if (!contract?.id) return;
    
    // Mark as viewed
    try {
      await api.patch(`/contracts/${contract.id}/viewed`);
      // Invalidar caché y notificar cambio
      clearCache();
      triggerRefresh();
    } catch { /* intentionally ignore error */ }
    
    // Navigate
    if (user?.role === 'lawyer') {
      navigate(`/lawyer/contracts/${contract.id}`);
    } else {
      navigate(`/user/contracts/${contract.id}`);
    }
  };

  const handleClick = onClick ? () => onClick(contract) : handleCardClick;

  // Compact variant (original Card design)
  if (variant === 'compact') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          "group relative flex overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer hover:border-blue-400",
          className
        )}
      >
        <Badge radicado={contract?.id} position="center" />
        
        <div className={`flex-1 px-6 pt-6 pb-4 flex flex-col ${hasOtrosi ? 'gap-2' : 'gap-4'}`}>
          <div className="flex items-center gap-4 mt-4">
            <IconBlock size="large" />
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground truncate">
                {contract?.proveedor || 'Sin proveedor'}
              </h3>
              <p className={`text-muted-foreground break-words leading-tight ${hasOtrosi ? 'text-xs' : 'text-sm'}`} title={formatContractType(contract?.tipoContrato)}>
                {formatContractType(contract?.tipoContrato)}
              </p>
            </div>
          </div>
          
          <MetaRow
            icon={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`${hasOtrosi ? 'h-3 w-3' : 'h-4 w-4'}`}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            value={getSolicitanteDisplay(solicitante)}
            className={hasOtrosi ? 'text-xs' : 'text-sm'}
          />
          
          <OtrosiBadge hasOtrosi={hasOtrosi} />
        </div>
      </div>
    );
  }

  // Lawyer variant (original LawyerCard design)
  if (variant === 'lawyer') {
    return (
      <div
        onClick={handleClick}
        className={cn(
          'group relative overflow-hidden rounded-lg shadow-md border transition-all duration-300 ease-in-out cursor-pointer bg-card border-gray-200 dark:border-gray-700 hover:shadow-lg hover:scale-105',
          className
        )}
      >
        <Badge radicado={contract?.id} position="topRight" />
        <div className="h-2 bg-gray-500"></div>

        <div className="p-5">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <OtrosiBadge hasOtrosi={hasOtrosi} size="small" />
            </div>
          </div>

          <h3 className="text-lg font-semibold text-foreground mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {contract?.proveedor || 'Sin proveedor'}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 break-words leading-tight" title={formatContractType(contract?.tipoContrato)}>
            {formatContractType(contract?.tipoContrato)}
          </p>

          <div className="space-y-2 text-sm mb-4">
            <MetaRow 
              label="Solicitante" 
              value={contract?.solicitante ? `${contract.solicitante.firstName} ${contract.solicitante.lastName}` : getSolicitanteDisplay(solicitante)} 
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

          <Viewers viewers={contract?.viewers} />
        </div>
      </div>
    );
  }

  // Fallback to compact if variant is unknown
  return null;
});

export default Card;
