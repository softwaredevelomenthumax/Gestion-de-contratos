import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function Card({ tipoSolicitud, descripcion, solicitante, contract }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCardClick = async () => {
    if (!contract?.id) return;
    try {
      await axios.patch(`http://localhost:3001/api/contracts/${contract.id}/viewed`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (e) {
      console.log(e)
    }
    navigate(`/${user.role}/contracts/${contract.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative flex overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg transition-all hover:shadow-2xl hover:scale-[1.02] cursor-pointer",
        "hover:border-blue-400"
      )}
    >
      {contract?.id && (
        <div className="absolute top-4 left-4 z-10 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold shadow">
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
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {tipoSolicitud}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-300 truncate">
              {descripcion}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-blue-500 dark:text-blue-300 mt-2">
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
          <span className="truncate">{solicitante}</span>
        </div>
        
        {/* Indicador de Otrosí - Ahora aparece abajo de "solicitar" */}
        {contract?.esOtrosi && (
          <div className="mt-2 flex items-center gap-2">
            <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-purple-50 border border-purple-500/20">
              Otrosí Aplicado
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Card;