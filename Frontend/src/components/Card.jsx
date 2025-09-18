import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import api from '../api/axiosInstance';
import { useNavigate } from 'react-router-dom';
import * as React from "react"

const estadoStyles = {
  nuevo: {
    label: 'Nuevo',
    badge: 'gray',
    color: 'bg-gray-500',
  },
  visto: {
    label: 'Visto',
    badge: 'blue',
    color: 'bg-blue-500',
  },
  respondido: {
    label: 'Respondido',
    badge: 'yellow',
    color: 'bg-yellow-500',
  },
  'awaiting_user_response': {
    label: 'Esperando respuesta de usuario',
    badge: 'orange',
    color: 'bg-orange-500',
  },
  'awaiting_lawyer_review': {
    label: 'Esperando revisión de abogado',
    badge: 'purple',
    color: 'bg-purple-500',
  },
  'awaiting_signature': {
    label: 'Esperando firma del usuario',
    badge: 'teal',
    color: 'bg-teal-500',
  },
  'signature_otrosi_already_signedByUser': {
    label: 'Otrosí firmado - Esperando firma del abogado',
    badge: 'indigo',
    color: 'bg-indigo-600',
  },
  
  devuelto: {
    label: 'Devuelto',
    badge: 'blue',
    color: 'bg-blue-500',
  },
  firmado: {
    label: 'Firmado',
    badge: 'green',
    color: 'bg-green-600', // Use the same green as the section
  },
  signed: {
    label: 'Firmado',
    badge: 'green',
    color: 'bg-green-600', // Use the same green as the section
  },
  vencido: {
    label: 'Vencido',
    badge: 'red',
    color: 'bg-red-500',
  },
  default: {
    label: 'Otro',
    badge: 'gray',
    color: 'bg-gray-500',
  },
};

function getEstadoStyle(estado) {
  if (!estado) return estadoStyles.default;
  const key = estado.toLowerCase();
  return estadoStyles[key] || estadoStyles.default;
}

// Helper to format contract types for display
const formatContractType = (contractType) => {
  if (!contractType) return "";
  
  // Map of contract types to their proper Spanish display names
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
  
  // If it's in our map, return the formatted version
  if (contractTypeMap[contractType.toLowerCase()]) {
    return contractTypeMap[contractType.toLowerCase()];
  }
  
  // Otherwise, format it by replacing underscores with spaces and capitalizing
  return contractType
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export function Card({ descripcion, solicitante, contract, onClick }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hasOtrosi, setHasOtrosi] = React.useState(false);
  // const isViewed = contract && contract.viewedBy && user && contract.viewedBy.includes(user.id);

  // Check if contract has otrosi
  React.useEffect(() => {
    if (!contract?.id) return;
    // Only attempt if we have a user and they likely have access (lawyer or owner)
    const isOwner = user && (contract?.solicitante?.id === user.id || contract?.solicitanteId === user.id);
    const hasAccess = user && (user.role === 'lawyer' || isOwner);
    if (!hasAccess) return;
    
    const checkOtrosi = async () => {
      try {
        const response = await api.get(`/otrosi/contract/${contract.id}`);
        setHasOtrosi(response.data && response.data.length > 0);
      } catch (error) {
        if (error.response?.status !== 403) {
          console.log(error);
        }
        // Silently fail - just don't show otrosi indicator
        setHasOtrosi(false);
      }
    };
    
    checkOtrosi();
  }, [contract?.id, contract?.solicitante?.id, contract?.solicitanteId, user, user?.id, user?.role]);

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

  const handleCardClick = async () => {
    if (!contract?.id) return;
    try {
      await api.patch(`/contracts/${contract.id}/viewed`);
    } catch { /* intentionally ignore error */ }
    if (user?.role === 'lawyer') {
      navigate(`/lawyer/contracts/${contract.id}`);
    } else {
      navigate(`/user/contracts/${contract.id}`);
    }
  };

  return (
    <div
      onClick={onClick ? () => onClick(contract) : handleCardClick}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer",
        "hover:border-blue-400"
      )}
    >
      {contract?.id && (
        <div className="absolute top-2 right-4 z-10 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold shadow">
          Ticket: {contract.id}
        </div>
      )}
      
      <div className="flex-1 p-6 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7"
            >
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-foreground truncate">
              {contract?.proveedor || 'Sin proveedor'}
            </h3>
            <p className="text-sm text-muted-foreground truncate">
              {descripcion}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm mt-2 text-blue-600 dark:text-blue-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="truncate">{getSolicitanteDisplay(solicitante)}</span>
        </div>
        
        {/* Indicador de Otrosí - Aparece cuando el contrato tiene otrosí */}
        {hasOtrosi && (
          <div className="mt-2 flex items-center gap-2">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-purple-50 border border-purple-500/20">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-3 w-3 mr-1"
              >
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
                <path d="M12 18v-6" />
                <path d="M9 15l3 3 3-3" />
              </svg>
              Tiene Otrosí
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function LawyerCardSkeleton() {
    return (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 animate-pulse w-full">
            <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-24 mb-4"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[360px] mb-2.5"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full mb-2.5"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[330px] mb-2.5"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[300px] mb-2.5"></div>
            <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded-full max-w-[360px]"></div>
            <div className="flex items-center justify-between mt-4">
                <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-32"></div>
                <div className="h-8 bg-gray-300 dark:bg-gray-700 w-8 rounded-full"></div>
            </div>
        </div>
    );
}

export function LawyerCard({ contract }) {
  const navigate = useNavigate();
  const estadoStyle = getEstadoStyle(contract.estado);
  const [hasOtrosi, setHasOtrosi] = React.useState(false);

  // Check if contract has otrosi
  React.useEffect(() => {
    if (!contract?.id) return;
    
    const checkOtrosi = async () => {
      try {
        const response = await api.get(`/otrosi/contract/${contract.id}`);
        setHasOtrosi(response.data && response.data.length > 0);
      } catch (error) {console.log(error)
        // Silently fail - just don't show otrosi indicator
        setHasOtrosi(false);
      }
    };
    
    checkOtrosi();
  }, [contract?.id]);

  const handleCardClick = async () => {
    if (!contract?.id) return;
    try {
      await api.patch(`/contracts/${contract.id}/viewed`);
    } catch (error) {
      console.error('Failed to mark contract as viewed', error);
    }
    navigate(`/lawyer/contracts/${contract.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative overflow-hidden rounded-lg shadow-md border transition-all duration-300 ease-in-out cursor-pointer',
        'bg-card',
        'border-gray-200 dark:border-gray-700',
        'hover:shadow-lg hover:scale-105'
      )}
    >
      <div className={`h-2 ${estadoStyle.color}`}></div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${estadoStyle.color} text-white`}>
              {estadoStyle.label}
            </span>
            {/* Indicador de Otrosí */}
            {hasOtrosi && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-purple-50 border border-purple-500/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3 w-3 mr-1"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                  <path d="M12 18v-6" />
                  <path d="M9 15l3 3 3-3" />
                </svg>
                Tiene Otrosí
              </span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Radicado: {contract.id}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-1 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          {contract.proveedor || 'Sin proveedor'}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 h-10">
                          {formatContractType(contract.tipoContrato)}
        </p>

        <div className="space-y-2 text-sm mb-4">
          <div className="flex items-center">
            <span className="w-24 flex-shrink-0 text-muted-foreground">Área:</span>
            <span className="font-medium text-foreground truncate">{contract.area}</span>
          </div>
          <div className="flex items-center">
            <span className="w-24 flex-shrink-0 text-muted-foreground">Solicitante:</span>
            <span className="font-medium text-foreground truncate">{contract.solicitante?.firstName} {contract.solicitante?.lastName}</span>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

        <div>
          <span className="text-xs text-muted-foreground mb-2 block">Visualizado por:</span>
          {Array.isArray(contract.viewers) && contract.viewers.length > 0 ? (
            <div className="flex -space-x-2">
              {contract.viewers.slice(0, 5).map((viewer) => (
                <div 
                  key={viewer.id} 
                  className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-800"
                  title={`${viewer.firstName} ${viewer.lastName}`}
                >
                  {viewer.firstName?.[0] || ''}{viewer.lastName?.[0] || ''}
                </div>
              ))}
              {contract.viewers.length > 5 && (
                <div 
                  className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-200 text-xs font-medium border-2 border-white dark:border-gray-800"
                  title={`${contract.viewers.length - 5} más`}
                >
                  +{contract.viewers.length - 5}
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Nadie ha visto este contrato aún.</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default Card;