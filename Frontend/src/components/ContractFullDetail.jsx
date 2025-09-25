import React, { useEffect, useState } from "react";
import api from "../api/axiosInstance";
import {
  IconFileText,
  IconInfoCircle,
  IconCalendar,
  IconCurrencyDollar,
  IconBuildingBank,
  IconUser,
  IconUsers,
  IconDownload,
  IconUpload,
  IconSignature,
  IconRotate,
  IconCheck,
  IconAlertTriangle,
  IconMessageCircle,
  IconPlus,
  IconEdit,
  IconRefresh,
} from "@tabler/icons-react";
import { getContractHistory } from "../api/contracts";
import { getOtrosiByContract, getOtrosiFiles } from "../api/otrosi";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import useDownload from "../hooks/useDownload";
import DownloadingAnimation from "./DownloadingAnimation";
import LottieAnimation from "./LottieAnimation";
import signAnimation from "../assets/animations/Uploading to cloud.json";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Alert, AlertDescription } from './ui/alert';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import Button from './Button';

const estadoLabels = {
  new: "Nuevo",
  responded: "Respondido",
  "para responder": "Para responder",
  returned: "Devuelto",
  firmado: "Firmado",
  signed: "Firmado",
  vencido: "Vencido",
  seen: "Visto",
  awaiting_user_response: "Esperando respuesta del usuario",
  awaiting_lawyer_review: "Esperando revisión del abogado",
  awaiting_signature: "Esperando firma del usuario",
  otrosi_awaiting_user_response: "Esperando respuesta del usuario del otrosí",
  otrosi_awaiting_lawyer_review: "Esperando revisión del abogado del otrosí",
  otrosi_awaiting_signature: "Otrosí pendiente de firma del usuario",
  otrosi_signed: "Otrosí finalizado",
  signature_otrosi_already_signedByUser: "Otrosí firmado - Esperando firma del abogado",
};

// Función para obtener etiqueta de estado con contexto específico del otrosí
const getEstadoLabelWithContext = (estado, otrosi = []) => {
  // Caso: Usuario ya firmó el otrosí y espera firma del abogado
  if (estado === 'signature_otrosi_already_signedByUser' && otrosi.length > 0) {
    const objetivo = otrosi.find(otro => otro.estado === 'otrosi_awaiting_signature' || otro.estado === 'pendiente')
      || otrosi[0];
    if (objetivo) {
      return `Otrosí #${objetivo.numeroOtrosi} firmado - Esperando firma del abogado`;
    }
  }

  // Caso: Otrosí devuelto - esperando respuesta del usuario
  if (estado === 'otrosi_awaiting_user_response' && otrosi.length > 0) {
    const objetivo = otrosi.find(otro => otro.estado === 'otrosi_awaiting_user_response') || otrosi[0];
    if (objetivo) {
      return `Otrosí #${objetivo.numeroOtrosi} devuelto - Esperando respuesta del usuario`;
    }
  }

  // Caso: Otrosí enviado - esperando revisión del abogado
  if (estado === 'otrosi_awaiting_lawyer_review' && otrosi.length > 0) {
    const objetivo = otrosi.find(otro => otro.estado === 'otrosi_awaiting_lawyer_review') || otrosi[0];
    if (objetivo) {
      return `Otrosí #${objetivo.numeroOtrosi} enviado - Esperando revisión del abogado`;
    }
  }

  // Caso: Otrosí aprobado - pendiente de firma del usuario
  if (estado === 'otrosi_awaiting_signature' && otrosi.length > 0) {
    const objetivo = otrosi.find(otro => otro.estado === 'otrosi_awaiting_signature') || otrosi[0];
    if (objetivo) {
      return `Otrosí #${objetivo.numeroOtrosi} pendiente de firma del usuario`;
    }
  }

  return estadoLabels[estado] || estado;
};

// Función para obtener etiqueta de estado del otrosí
const getOtrosiEstadoLabel = (estado) => {
  switch (estado) {
    case 'pendiente':
      return '⏳ Pendiente del Otrosí';
    case 'otrosi_awaiting_user_response':
      return '🔄 Esperando Respuesta del Usuario del Otrosí';
    case 'otrosi_awaiting_lawyer_review':
      return '👨‍💼 Esperando Revisión del Abogado del Otrosí';
    case 'otrosi_awaiting_signature':
      return '✍️ Esperando Firma del Otrosí';
    case 'otrosi_signed':
      return '✅ Otrosí finalizado';
    case 'rechazado':
      return '❌ Otrosí rechazado';
    case 'devuelto':
      return '🔄 Otrosí devuelto';
    default:
      return estado;
  }
};

// Etiqueta humana para cualquier estado (contrato u otrosí)
const getStatusHumanLabel = (estado) => {
  if (!estado) return '';
  if (typeof estado === 'string' && estado.startsWith('otrosi_')) {
    return getOtrosiEstadoLabel(estado);
  }
  return estadoLabels[estado] || estado;
};

// Extraer número de otrosí desde un comentario como: "Otrosí #2 ..."
const extractOtrosiNumber = (text = '') => {
  const match = /otros[ií]\s*#\s*(\d+)/i.exec(text || '');
  return match ? parseInt(match[1], 10) : null;
};

// Título amigable de entrada de historial
const getHistoryTitle = (history) => {
  const numero = extractOtrosiNumber(history.comment);
  switch (history.action) {
    case 'sign':
      return history.newStatus === 'signed' ? 'Contrato firmado' : 'Firma registrada';
    case 'return':
      return 'Contrato devuelto';
    case 'respond':
      return 'Contrato gestionado';
    case 'otrosi_signed':
      return numero ? `Otrosí #${numero} firmado` : 'Otrosí firmado';
    case 'otrosi_returned':
      return numero ? `Otrosí #${numero} devuelto` : 'Otrosí devuelto';
    case 'lawyer_responded_to_otrosi':
      return numero ? `Abogado respondió al Otrosí #${numero}` : 'Abogado respondió al otrosí';
    case 'user_responded_to_otrosi':
      return numero ? `Usuario respondió al Otrosí #${numero}` : 'Usuario respondió al otrosí';
    case 'otrosi_created':
      return numero ? `Otrosí #${numero} creado` : 'Otrosí creado';
    default:
      return 'Evento del contrato';
  }
};

const getOtrosiEstadoLabelWithContext = (otro) => {
  switch (otro.estado) {
    case 'pendiente':
      return `Otrosí #${otro.numeroOtrosi} creado - Pendiente`;
    case 'otrosi_awaiting_user_response':
      return `Otrosí #${otro.numeroOtrosi} devuelto - Esperando respuesta del usuario`;
    case 'otrosi_awaiting_lawyer_review':
      return `Otrosí #${otro.numeroOtrosi} enviado - Esperando revisión del abogado`;
    case 'otrosi_awaiting_signature':
      return `Otrosí #${otro.numeroOtrosi} aprobado - Pendiente de firma del usuario`;
    case 'otrosi_signed':
      return `Otrosí #${otro.numeroOtrosi} finalizado`;
    case 'rechazado':
      return `Otrosí #${otro.numeroOtrosi} rechazado`;
    case 'devuelto':
      return `Otrosí #${otro.numeroOtrosi} devuelto`;
    default:
      return `Otrosí #${otro.numeroOtrosi} - ${otro.estado}`;
  }
};

// Colores por estado de otrosí para diferenciar visualmente

const estadoVisuals = {
  new: {
    color: "bg-gray-500",
    text: "text-gray-100",
    icon: <IconInfoCircle size={18} className="text-gray-200" />,
  },
  responded: {
    color: "bg-yellow-500",
    text: "text-yellow-100",
    icon: <IconInfoCircle size={18} className="text-yellow-200" />,
  },
  "para responder": {
    color: "bg-blue-500",
    text: "text-blue-100",
    icon: <IconInfoCircle size={18} className="text-blue-200" />,
  },
  returned: {
    color: "bg-blue-700",
    text: "text-blue-100",
    icon: <IconInfoCircle size={18} className="text-blue-200" />,
  },
  firmado: {
    color: "bg-green-600",
    text: "text-green-100",
    icon: <IconInfoCircle size={18} className="text-green-200" />,
  },
  signed: {
    color: "bg-green-600",
    text: "text-green-100",
    icon: <IconInfoCircle size={18} className="text-green-200" />,
  },
  vencido: {
    color: "bg-red-600",
    text: "text-red-100",
    icon: <IconInfoCircle size={18} className="text-red-200" />,
  },
  seen: {
    color: "bg-gray-400",
    text: "text-gray-100",
    icon: <IconInfoCircle size={18} className="text-gray-200" />,
  },
  awaiting_user_response: {
    color: "bg-orange-500",
    text: "text-orange-100",
    icon: <IconInfoCircle size={18} className="text-orange-200" />,
  },
  awaiting_lawyer_review: {
    color: "bg-purple-600",
    text: "text-purple-100",
    icon: <IconInfoCircle size={18} className="text-purple-200" />,
  },
  awaiting_signature: {
    color: "bg-teal-500",
    text: "text-teal-100",
    icon: <IconInfoCircle size={18} className="text-teal-200" />,
  },
  signature_otrosi_already_signedByUser: {
    color: "bg-indigo-600",
    text: "text-indigo-100",
    icon: <IconSignature size={18} className="text-indigo-200" />,
  },
};

const formatHistoryTimestamp = (timestamp) => {
  if (!timestamp) return "Sin fecha";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-CO", { hour12: false });
};

// Función para formatear fechas de archivos con fecha y hora
const formatFileTimestamp = (timestamp) => {
  if (!timestamp) return "Sin fecha";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return "Fecha inválida";
  return date.toLocaleString("es-CO", { 
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false 
  });
};

// Función para determinar el tipo específico de archivo usando datos del backend
const getFileTypeLabel = (file) => {
  // Si el backend ya tiene el fileType específico y no es null, usarlo directamente
  if (file.fileType && file.fileType !== 'null' && file.fileType !== null) {
    switch (file.fileType) {
      case 'Contrato':
        return 'Contrato';
      case 'Cámara':
        return 'Cámara';
      case 'Oferta':
        return 'Oferta';
      case 'Respuesta Abogado':
        return 'Respuesta Abogado';
      case 'Respuesta Usuario':
        return 'Respuesta Usuario';
      case 'Firma Abogado':
        return 'Firma Abogado';
      case 'Firma Usuario':
        return 'Firma Usuario';
      case 'Contable':
        return 'Contable';
      case 'Archivo':
        return 'Archivo';
      case 'Devuelto':
        return 'Devuelto';
      case 'Enviar Otrosí':
        return 'Otrosí Sin Firma';
      default:
        return file.fileType;
    }
  }

  // Si fileType es null, usar category que sí tiene datos
  if (file.category) {
    switch (file.category.toLowerCase()) {
      case "contrato":
        return "Contrato";
      case "camara":
        return "Cámara";
      case "oferta":
        return "Oferta";
      case "contable":
        return "Contable";
      case "respuesta abogado":
        return "Respuesta Abogado";
      case "respuesta usuario":
        return "Respuesta Usuario";
      case "firma abogado":
        return "Firma Abogado";
      case "firma usuario":
        return "Firma Usuario";
      default:
        // Si la categoría no es específica, intentar inferir del nombre del archivo
        if (file.filename) {
          const lowerFilename = file.filename.toLowerCase();
          if (lowerFilename.includes('firma')) {
            return file.responseType === "lawyer" ? "Firma Abogado" : "Firma Usuario";
          }
          if (lowerFilename.includes('respuesta')) {
            return file.responseType === "lawyer" ? "Respuesta Abogado" : "Respuesta Usuario";
          }
          if (lowerFilename.includes('contrato')) {
            return "Contrato";
          }
          if (lowerFilename.includes('camara') || lowerFilename.includes('cámara')) {
            return "Cámara";
          }
          if (lowerFilename.includes('oferta')) {
            return "Oferta";
          }
        }
        return "Archivo";
    }
  }

  // Fallback más inteligente basado en responseType y nombre del archivo
  if (file.responseType === "lawyer") {
    // Si es del abogado, verificar si es firma o respuesta
    if (file.filename && file.filename.toLowerCase().includes('firma')) {
      return "Firma Abogado";
    }
    return "Respuesta Abogado";
  } else if (file.responseType === "user") {
    // Si es del usuario, verificar si es firma o respuesta
    if (file.filename && file.filename.toLowerCase().includes('firma')) {
      return "Firma Usuario";
    }
    return "Respuesta Usuario";
  }

  // Último fallback: intentar inferir del nombre del archivo
  if (file.filename) {
    const lowerFilename = file.filename.toLowerCase();
    if (lowerFilename.includes('firma')) {
      return file.responseType === "lawyer" ? "Firma Abogado" : "Firma Usuario";
    }
    if (lowerFilename.includes('respuesta')) {
      return file.responseType === "lawyer" ? "Respuesta Abogado" : "Respuesta Usuario";
    }
    if (lowerFilename.includes('contrato')) {
      return "Contrato";
    }
    if (lowerFilename.includes('camara') || lowerFilename.includes('cámara')) {
      return "Cámara";
    }
    if (lowerFilename.includes('oferta')) {
      return "Oferta";
    }
  }

  return "Archivo";
};

const formatContractType = (contractType) => {
  if (!contractType) return "";

  const contractTypeMap = {
    'prestacion_de_servicios': 'Prestación de Servicios',
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

const ContractFullDetail = ({ contract }) => {
  const [contractFiles, setContractFiles] = useState([]);
  const [contractHistory, setContractHistory] = useState([]);
  const [otrosi, setOtrosi] = useState([]);
  const [_otrosiLoading, setOtrosiLoading] = useState(true);
  const [otrosiFiles, setOtrosiFiles] = useState({}); // Para almacenar archivos de cada otrosí
  const { user } = useAuth();

  // Hook para manejar animación de descarga
  const { isDownloading, downloadMessage, downloadWithAnimation } = useDownload();

  // Función para identificar comentarios generados automáticamente por el sistema
  const isSystemGeneratedComment = (comment) => {
    if (!comment || typeof comment !== 'string') return true;

    try {
      const systemPatterns = [
        /Otrosí\s*#\d+\s*creado:\s*otrsi\s*\d+\.?\d*/i,
        /Otrosí\s*#\d+\s*creado:\s*.*/i, // Patrón más general para creación de otrosí
        /Firma\s+enviada/i,
        /Respuesta\s+enviada/i,
        /El\s+contrato\s+fue\s+creado\s+y\s+enviado\s+para\s+revisión/i,
        /Contrato\s+creado/i,
        /Estado\s+actualizado/i
      ];

      return systemPatterns.some(pattern => pattern.test(comment.trim()));
    } catch (error) {
      // En caso de error en regex, asumir que es comentario real
      console.warn('Error evaluating comment pattern:', error);
      return false;
    }
  };

  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'Fecha no disponible';
    try {
      return new Date(dateString).toLocaleDateString('es-CO');
    } catch {
      return 'Fecha inválida';
    }
  };

  // Función para devolver otrosí
  // Función handleReturnOtrosi eliminada - ya no se usa

  // (Eliminado) Función para manejar acciones de otrosí no utilizada

  const [filesToUpload, setFilesToUpload] = useState([]);
  const [comment, setComment] = useState("");
  const [uploading, _setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [lawyerFilesToUpload, setLawyerFilesToUpload] = useState([]);
  const [lawyerComment, setLawyerComment] = useState("");
  const [lawyerUploading, setLawyerUploading] = useState(false);
  const [lawyerUploadError, setLawyerUploadError] = useState(null);
  const [signFiles, setSignFiles] = useState([]);
  const [signComment, setSignComment] = useState("");
  const [signUploading, setSignUploading] = useState(false);
  const [signError, setSignError] = useState(null);
  const [returnComment, setReturnComment] = useState("");
  const [returnFiles, setReturnFiles] = useState([]);
  const [returnUploading, setReturnUploading] = useState(false);
  const [returnError, setReturnError] = useState(null);

  // Estados para los popups
  const [showResponder, setShowResponder] = useState(false);
  const [showLawyerResponder, setShowLawyerResponder] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();



  useEffect(() => {
    // Use files that are already included in the contract data
    if (contract.files) {
      console.log('📁 Using contract files from contract data:', contract.files);
      console.log('📄 Files count:', contract.files.length);
      console.log('📋 Files details:', contract.files.map(f => ({ id: f.id, filename: f.filename, category: f.category })));
      setContractFiles(contract.files);
    } else {
      console.log('⚠️ No files property in contract data');
      setContractFiles([]);
    }
    getContractHistory(contract.id).then(setContractHistory);

    // Cargar otrosí del contrato
    const loadOtrosi = async () => {
      try {
        setOtrosiLoading(true);
        const data = await getOtrosiByContract(contract.id);
        setOtrosi(data);

        // Cargar archivos de cada otrosí
        const filesData = {};
        console.log('Otrosí encontrados:', data);
        for (const otrosiItem of data) {
          try {
            console.log(`Cargando archivos para otrosí ${otrosiItem.id}...`);
            const files = await getOtrosiFiles(otrosiItem.id);
            console.log(`Archivos encontrados para otrosí ${otrosiItem.id}:`, files);
            filesData[otrosiItem.id] = files;
          } catch (err) {
            console.error(`Error cargando archivos del otrosí ${otrosiItem.id}:`, err);
            filesData[otrosiItem.id] = [];
          }
        }
        console.log('Todos los archivos de otrosí cargados:', filesData);
        setOtrosiFiles(filesData);
      } catch (err) {
        console.error('Error cargando otrosí:', err);
        setOtrosi([]);
      } finally {
        setOtrosiLoading(false);
      }
    };

    loadOtrosi();
  }, [contract.id]);









  // Funciones de manejo de archivos
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setFilesToUpload(files);
  };

  const handleLawyerFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setLawyerFilesToUpload(files);
  };

  // Función principal para manejar acciones del contrato
  const handleContractAction = async (action, files = [], comment = "") => {
    const setLoading =
      action === "sign"
        ? setSignUploading
        : action === "return"
          ? setReturnUploading
          : user.role === "lawyer"
            ? setLawyerUploading
            : setSignUploading;
    const setError =
      action === "sign"
        ? setSignError
        : action === "return"
          ? setReturnError
          : user.role === "lawyer"
            ? setLawyerUploadError
            : setUploadError;

    setLoading(true);
    setError(null);

    try {
      // Validaciones básicas
      if ((action === "sign" || action === "respond") && files.length === 0) {
        setError("Debes subir al menos un archivo PDF.");
        setLoading(false);
        return;
      }

      // Comentario y archivos son opcionales para devolver
      if (action === "return" && !comment?.trim() && files.length === 0) {
        setError("Debes proporcionar al menos un comentario o subir archivos para devolver el contrato.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.append("comment", comment || "");
      formData.append("action", action);

      // Call proper endpoint via shared axios client
      const endpoint = action === "sign"
        ? `/contracts/${contract.id}/sign`
        : action === "return"
          ? `/contracts/${contract.id}/return`
          : `/contracts/${contract.id}/respond`;

      const { data: result } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      addNotification(result.message || "Operación exitosa", "success");
      // Cerrar el formulario correspondiente
      setShowResponder(false);
      setShowLawyerResponder(false);
      setShowSignModal(false);
      setShowReturnModal(false);
      navigate("/");
    } catch (err) {
      console.error("Error en handleContractAction:", err);
      console.error("Error response:", err.response?.data);
      console.error("Error status:", err.response?.status);
      
      if (err.message.includes("sesión") || err.message.includes("401")) {
        setError("Tu sesión ha expirado. Por favor, inicia sesión nuevamente.");
        setTimeout(() => navigate("/login"), 2000);
      } else if (err.response?.status === 400) {
        const errorMessage = err.response?.data?.error || err.response?.data?.message || "Error en la petición. Verifica que el contrato esté en un estado válido para esta acción.";
        setError(errorMessage);
      } else {
        setError(err.message || "Error desconocido");
      }
    } finally {
      setLoading(false);
    }
  };

  // Funciones específicas para cada acción
  const handleRespond = () => handleContractAction("respond", filesToUpload, comment);
  const handleLawyerRespond = () => handleContractAction("respond", lawyerFilesToUpload, lawyerComment);
  const handleSign = () => handleContractAction("sign", signFiles, signComment);
  const handleReturn = () => handleContractAction("return", returnFiles, returnComment);

  const handleDownloadFileBlob = async (fileId, filename) => {
    const downloadFunction = async () => {
      console.log('🔍 Starting file download:', { fileId, filename });

      const response = await api.get(
        `/contracts/files/${fileId}/download`,
        { responseType: 'blob' }
      );

      console.log('📥 Download response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        contentType: response.headers?.['content-type'],
        contentLength: response.headers?.['content-length']
      });

      const blob = response.data;
      console.log('✅ Blob created:', {
        size: blob.size,
        type: blob.type
      });

      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }

      if (blob.type !== 'application/pdf') {
        console.warn('⚠️ Unexpected blob type:', blob.type);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log('✅ File download completed successfully');
    };

    await downloadWithAnimation(
      downloadFunction,
      `Descargando "${filename}"...`
    );
  };

  const handleDownload = (file) => {
    handleDownloadFileBlob(file.id, file.filename);
  };

  const handleOtrosiFileDownload = async (fileId, filename) => {
    const downloadFunction = async () => {
      console.log('🔍 Starting otrosi file download:', { fileId, filename });

      // Validate parameters
      if (!fileId) {
        console.error('❌ fileId is undefined or null');
        throw new Error("ID de archivo no válido");
      }

      if (!filename) {
        console.error('❌ filename is undefined or null');
        throw new Error("Nombre de archivo no válido");
      }

      const response = await api.get(
        `/otrosi/files/${fileId}/download`,
        { responseType: 'blob' }
      );

      console.log('📥 Otrosi download response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        contentType: response.headers?.['content-type'],
        contentLength: response.headers?.['content-length']
      });

      console.log('📄 Creating blob from otrosi response...');
      const blob = response.data;
      console.log('✅ Otrosi blob created:', {
        size: blob.size,
        type: blob.type
      });

      // Check if blob is valid
      if (blob.size === 0) {
        throw new Error('Downloaded otrosi file is empty');
      }

      if (blob.type !== 'application/pdf') {
        console.warn('⚠️ Unexpected otrosi blob type:', blob.type);
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      console.log('✅ Otrosi file download completed successfully');
    };

    await downloadWithAnimation(
      downloadFunction,
      `Descargando "${filename}"...`
    );
  };



  return (
    <div>
      {/* Estado mejorado al tope */}
      <div className="mb-8 flex items-center gap-4 flex-wrap">
        {(() => {
          const baseVisual = estadoVisuals[contract.estado] || {
            color: "bg-gray-600",
            text: "text-gray-100",
            icon: <IconInfoCircle size={18} />,
          };
          const isOtrosiContext = typeof contract.estado === 'string' && contract.estado.includes('otrosi');
          const visual = isOtrosiContext
            ? {
              color: "bg-purple-600",
              text: "text-white",
              icon: <IconInfoCircle size={18} className="text-purple-100" />,
            }
            : baseVisual;
          return (
            <Badge className={`${visual.color} ${visual.text} text-base gap-2 px-4 py-2`}>
              {visual.icon}
              {getEstadoLabelWithContext(contract.estado, otrosi)}
            </Badge>
          );
        })()}

        {/* Número de Radicado */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
            Radicado:
          </span>
          <Badge variant="outline" className="text-sm font-semibold">
            #{contract.id}
          </Badge>
        </div>

        {/* Visualizado por */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-muted-foreground">
            Visualizado por:
          </span>
          {Array.isArray(contract.viewers) && contract.viewers.length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {contract.viewers.slice(0, 3).map((viewer) => (
                <Badge
                  key={viewer.id}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {viewer.firstName} {viewer.lastName}
                </Badge>
              ))}
              {contract.viewers.length > 3 && (
                <Badge variant="secondary" className="text-xs px-2 py-1">
                  +{contract.viewers.length - 3} más
                </Badge>
              )}
            </div>
          ) : (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Nadie
            </Badge>
          )}
        </div>
      </div>

      {/* Botón para crear Otrosí - Solo usuario regular y contrato firmado */}
      {user?.role === 'regular' && contract.estado === "signed" && (
        <div className="mb-8">
          <Button
            onClick={() => navigate(`/otrosi/${contract.id}`)}
            variant="info"
            className="flex items-center gap-3 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <IconPlus size={20} />
            Crear Otrosí
          </Button>
        </div>
      )}

      {/* Botón Responder para usuarios regulares en awaiting_user_response, returned o otrosi_awaiting_user_response */}
      {user?.role === "regular" &&
        (contract.estado === "awaiting_user_response" ||
          contract.estado === "returned" ||
          contract.estado === "otrosi_awaiting_user_response" ||
          contract.estado === "otrosi_awaiting_signature") && (
          <div className="mb-8">
            <Button
              onClick={() => setShowResponder(!showResponder)}
              variant="primary"
              className="flex items-center gap-3"
            >
              <IconUpload size={20} />
              Responder Contrato
            </Button>

            {/* Formulario inline de respuesta */}
            {showResponder && (
              <Card className="mt-4 border-2 border-blue-200 dark:border-blue-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconUpload size={20} className="text-blue-600" />
                    Responder Contrato
                  </CardTitle>
                  <CardDescription>
                    Sube archivos PDF y añade un comentario opcional
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <IconInfoCircle className="h-4 w-4" />
                    <AlertDescription>
                      Adjunta <span className="font-semibold">el archivo PDF (obligatorio)</span> y un comentario opcional.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <IconUpload size={16} />
                      Subir archivos PDF:
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={handleFileChange}
                      disabled={uploading}
                      className="text-sm"
                    />
                    {filesToUpload.length > 0 && (
                      <div className="space-y-1">
                        {filesToUpload.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                            <IconFileText size={14} />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Comentario (opcional):</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      rows={3}
                      placeholder="Escribe tu comentario..."
                      disabled={uploading}
                      className="resize-none text-sm"
                    />
                  </div>

                  {uploadError && (
                    <Alert variant="destructive">
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{uploadError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowResponder(false)}
                      disabled={uploading}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleRespond}
                      disabled={uploading}
                      size="sm"
                      className="gap-2"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <IconUpload size={16} />
                          <span>Enviar respuesta</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {/* Botones para abogados en estado new - Responder o Firmar directamente */}
      {user?.role === "lawyer" && contract.estado === "new" && (
        <div className="mb-8">
          <div className="flex gap-4 flex-wrap mb-4">
          <Button
            onClick={() => setShowLawyerResponder(!showLawyerResponder)}
            variant="primary"
            className="flex items-center gap-3"
          >
            <IconUpload size={20} />
            Responder
          </Button>
            <Button
              onClick={() =>
                setShowSignModal(prev => {
                  const next = !prev;
                  if (next) setShowLawyerResponder(false);
                  return next;
                })
              }
              variant="signature"
              className="flex items-center gap-3"
            >
              <IconSignature size={20} />
              Firmar Directamente
            </Button>
          </div>

          {/* Formulario inline de respuesta para abogados */}
          {showLawyerResponder && (
            <Card className="mt-4 border-2 border-blue-200 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IconUpload size={20} className="text-blue-600" />
                  Responder Contrato
                </CardTitle>
                <CardDescription>
                  Sube archivos PDF firmados y comentario opcional
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <IconInfoCircle className="h-4 w-4" />
                  <AlertDescription>
                    Adjunta <span className="font-semibold">el archivo PDF firmado (obligatorio)</span>.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label className="text-sm flex items-center gap-2">
                    <IconUpload size={16} />
                    Subir archivos PDF:
                  </Label>
                  <Input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleLawyerFileChange}
                    disabled={lawyerUploading}
                    className="text-sm"
                  />
                  {lawyerFilesToUpload.length > 0 && (
                    <div className="space-y-1">
                      {lawyerFilesToUpload.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                          <IconFileText size={14} />
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">Comentario (opcional):</Label>
                  <Textarea
                    value={lawyerComment}
                    onChange={(e) => setLawyerComment(e.target.value)}
                    rows={3}
                    placeholder="Escribe tu comentario..."
                    disabled={lawyerUploading}
                    className="resize-none text-sm"
                  />
                </div>

                {lawyerUploadError && (
                  <Alert variant="destructive">
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">{lawyerUploadError}</AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowLawyerResponder(false)}
                    disabled={lawyerUploading}
                    size="sm"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleLawyerRespond}
                    disabled={lawyerUploading}
                    size="sm"
                    className="gap-2"
                  >
                    {lawyerUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <IconUpload size={16} />
                        <span>Enviar respuesta</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Botones Firmar y Devolver para abogados en awaiting_lawyer_review, signature_otrosi_already_signedByUser o otrosi_awaiting_lawyer_review */}
      {user?.role === "lawyer" &&
        (contract.estado === "awaiting_lawyer_review" ||
          contract.estado === "signature_otrosi_already_signedByUser" ||
          contract.estado === "otrosi_awaiting_lawyer_review") && (
          <div className="mb-8">
            <div className="flex gap-4 flex-wrap mb-4">
              <Button
                onClick={() =>
                  setShowSignModal(prev => {
                    const next = !prev;
                    if (next) setShowReturnModal(false);
                    return next;
                  })
                }
                variant="signature"
                className="flex items-center gap-3"
              >
                <IconSignature size={20} />
                Firmar
              </Button>
              <Button
                onClick={() =>
                  setShowReturnModal(prev => {
                    const next = !prev;
                    if (next) setShowSignModal(false);
                    return next;
                  })
                }
                variant="warning"
                className="flex items-center gap-3"
              >
                <IconRotate size={20} />
                Devolver
              </Button>
            </div>

            {/* Formulario inline de firma - REMOVIDO - ahora está disponible para todos los estados 
            {showSignModal && (
              <Card className="mt-4 border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSignature size={20} className="text-green-600" />
                    Firmar Contrato
                  </CardTitle>
                  <CardDescription>
                    Sube archivos PDF firmados para finalizar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <IconCheck className="h-4 w-4" />
                    <AlertDescription>
                      Al firmar se completará el proceso. <span className="font-semibold">Asegúrate de firmar correctamente.</span>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <IconUpload size={16} />
                      Subir archivos PDF firmados:
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setSignFiles(Array.from(e.target.files).slice(0, 10))}
                      disabled={signUploading}
                      className="text-sm"
                    />
                    {signFiles.length > 0 && (
                      <div className="space-y-1">
                        {signFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                            <IconFileText size={14} />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Comentario (opcional):</Label>
                    <Textarea
                      value={signComment}
                      onChange={(e) => setSignComment(e.target.value)}
                      rows={3}
                      placeholder="Escribe tu comentario..."
                      disabled={signUploading}
                      className="resize-none text-sm"
                    />
                  </div>

                  {signError && (
                    <Alert variant="destructive">
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{signError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowSignModal(false)}
                      disabled={signUploading}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSign}
                      disabled={signUploading}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {signUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <IconSignature size={16} />
                          <span>Firmar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )} */}

            {/* Formulario inline de devolución */}
            {showReturnModal && (
              <Card className="mt-4 border-2 border-orange-200 dark:border-orange-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconRotate size={20} className="text-orange-600" />
                    Devolver Contrato
                  </CardTitle>
                  <CardDescription>
                    Proporciona comentarios o archivos para devolver el contrato (ambos opcionales)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Al devolver se enviará al usuario para correcciones. <span className="font-semibold">Proporciona al menos un comentario o archivo.</span>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-sm">Comentario (opcional):</Label>
                    <Textarea
                      value={returnComment}
                      onChange={(e) => setReturnComment(e.target.value)}
                      rows={4}
                      placeholder="Explica por qué devuelves el contrato (opcional)..."
                      disabled={returnUploading}
                      className="resize-none text-sm"
                    />
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <IconInfoCircle size={12} />
                      Opcional. Sé específico si proporcionas comentarios.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <IconUpload size={16} />
                      Archivos de devolución (opcional):
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setReturnFiles(Array.from(e.target.files))}
                      disabled={returnUploading}
                      className="text-sm"
                    />
                    {returnFiles.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {returnFiles.length} archivo(s) seleccionado(s)
                      </div>
                    )}
                    <p className="text-muted-foreground text-xs flex items-center gap-1">
                      <IconInfoCircle size={12} />
                      Opcional. Solo archivos PDF. Estos archivos se etiquetarán como "devuelto".
                    </p>
                  </div>

                  {returnError && (
                    <Alert variant="destructive">
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{returnError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowReturnModal(false)}
                      disabled={returnUploading}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleReturn}
                      disabled={returnUploading}
                      size="sm"
                      className="gap-2 bg-orange-600 hover:bg-orange-700"
                    >
                      {returnUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <IconRotate size={16} />
                          <span>Devolver</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {/* Modal de firma para abogados - solo para estados 'new' y 'awaiting_lawyer_review' */}
      {user?.role === "lawyer" && 
       (contract.estado === "new" || 
        contract.estado === "awaiting_lawyer_review" ||
        contract.estado === "signature_otrosi_already_signedByUser" ||
        contract.estado === "otrosi_awaiting_lawyer_review") && 
       showSignModal && (
        <div className="mb-8">
          <Card className="mt-4 border-2 border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconSignature size={20} className="text-green-600" />
                Firmar Contrato
              </CardTitle>
              <CardDescription>
                Sube archivos PDF firmados para finalizar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <IconCheck className="h-4 w-4" />
                <AlertDescription>
                  Al firmar se completará el proceso. <span className="font-semibold">Asegúrate de firmar correctamente.</span>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm flex items-center gap-2">
                  <IconUpload size={16} />
                  Subir archivos PDF firmados:
                </Label>
                <Input
                  type="file"
                  accept="application/pdf"
                  multiple
                  onChange={(e) => setSignFiles(Array.from(e.target.files).slice(0, 10))}
                  disabled={signUploading}
                  className="text-sm"
                />
                {signFiles.length > 0 && (
                  <div className="space-y-1">
                    {signFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                        <IconFileText size={14} />
                        <span className="truncate">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Comentario (opcional):</Label>
                <Textarea
                  value={signComment}
                  onChange={(e) => setSignComment(e.target.value)}
                  placeholder="Agrega un comentario sobre la firma..."
                  rows={3}
                  disabled={signUploading}
                  className="text-sm"
                />
              </div>

              {signError && (
                <Alert variant="destructive">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertDescription>{signError}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowSignModal(false)}
                  disabled={signUploading}
                  size="sm"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signUploading}
                  size="sm"
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {signUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <IconSignature size={16} />
                      <span>Firmar</span>
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        )}

      {/* Botón Firmar para usuarios regulares en awaiting_signature */}
      {user?.role === "regular" &&
        contract.estado === "awaiting_signature" && (
          <div className="mb-8">
            <Button
              onClick={() => setShowSignModal(!showSignModal)}
              variant="signature"
              className="flex items-center gap-3"
            >
              <IconSignature size={20} />
              Firmar Contrato
            </Button>

            {/* Formulario inline de firma para usuarios */}
            {showSignModal && (
              <Card className="mt-4 border-2 border-green-200 dark:border-green-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <IconSignature size={20} className="text-green-600" />
                    Firmar Contrato
                  </CardTitle>
                  <CardDescription>
                    Sube archivos PDF firmados para finalizar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <IconCheck className="h-4 w-4" />
                    <AlertDescription>
                      Al firmar se completará el proceso. <span className="font-semibold">Asegúrate de firmar correctamente.</span>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <IconUpload size={16} />
                      Subir archivos PDF firmados:
                    </Label>
                    <Input
                      type="file"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => setSignFiles(Array.from(e.target.files).slice(0, 10))}
                      disabled={signUploading}
                      className="text-sm"
                    />
                    {signFiles.length > 0 && (
                      <div className="space-y-1">
                        {signFiles.map((file, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded text-xs">
                            <IconFileText size={14} />
                            <span className="truncate">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Comentario (opcional):</Label>
                    <Textarea
                      value={signComment}
                      onChange={(e) => setSignComment(e.target.value)}
                      rows={3}
                      placeholder="Escribe tu comentario..."
                      disabled={signUploading}
                      className="resize-none text-sm"
                    />
                  </div>

                  {signError && (
                    <Alert variant="destructive">
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-sm">{signError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowSignModal(false)}
                      disabled={signUploading}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleSign}
                      disabled={signUploading}
                      size="sm"
                      className="gap-2 bg-green-600 hover:bg-green-700"
                    >
                      {signUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Enviando...</span>
                        </>
                      ) : (
                        <>
                          <IconSignature size={16} />
                          <span>Firmar</span>
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

      {/* Detalles del contrato organizados en columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-8 items-start">

        {/* COLUMNA 1: Información Básica + Información Financiera */}
        <div className="space-y-3">
          {/* INFORMACIÓN BÁSICA */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconFileText size={24} className="text-blue-400" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Descripción de la solicitud */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Descripción de la Solicitud
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base break-all">
                  {contract.descripcion}
                </p>
              </div>

              {/* Descripciones de todos los Otrosíes (si existen) */}
              {otrosi.length > 0 && (
                <div className="space-y-3">
                  {otrosi
                    .sort((a, b) => a.numeroOtrosi - b.numeroOtrosi) // Ordenar por número de otrosí
                    .map((otro) => (
                      <div key={otro.id} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-700/20 border border-purple-200 dark:border-purple-500/30">
                        <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                          Descripción del Otrosí #{otro.numeroOtrosi}
                        </span>
                        <p className="mt-1 text-gray-900 dark:text-white text-base break-all">
                          {otro.descripcionCambios}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge className={`text-xs ${otro.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                            otro.estado === 'otrosi_signed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                              otro.estado === 'rechazado' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                otro.estado === 'firmado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                                  'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                            }`}>
                            {getOtrosiEstadoLabelWithContext(otro)}
                          </Badge>
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Creado: {otro.fechaCreacion ? new Date(otro.fechaCreacion).toLocaleDateString('es-CO') : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              )}

              {/* Tipo de contrato */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Tipo de Contrato
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {formatContractType(contract.tipoContrato)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* INFORMACIÓN FINANCIERA ORIGINAL */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCurrencyDollar size={24} className="text-blue-400" />
                Información Financiera Original
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Valor total del contrato */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Valor Total del Contrato
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base font-semibold">
                  {contract.valorSinIVA}
                </p>
              </div>

              {/* Valor del IVA */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Valor del IVA
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base font-semibold">
                  {contract.valorIVA}
                </p>
              </div>

              {/* Moneda */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Moneda
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base font-semibold">
                  {contract.moneda}
                </p>
              </div>

              {/* Forma de pago */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Forma de Pago
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base break-all">
                  {contract.formaPago}
                </p>
              </div>

              {/* Información Financiera de todos los Otrosíes (si existen) */}
              {otrosi.length > 0 && (
                <div className="space-y-3">
                  {otrosi
                    .sort((a, b) => a.numeroOtrosi - b.numeroOtrosi) // Ordenar por número de otrosí
                    .filter(otro => otro.valorTotal || otro.porcentajeIVA || otro.valorIVA || otro.moneda || otro.formaPago) // Solo mostrar otrosíes con información financiera
                    .map((otro) => (
                      <div key={`financial-${otro.id}`} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-700/20 border border-purple-200 dark:border-purple-500/30">
                        {/* Header del Otrosí */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                              Información Financiera - Otrosí #{otro.numeroOtrosi}
                            </h4>
                            <Badge className={`text-xs ${otro.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              otro.estado === 'otrosi_signed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                otro.estado === 'rechazado' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  otro.estado === 'firmado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                              }`}>
                              {getOtrosiEstadoLabel(otro.estado)}
                            </Badge>
                          </div>
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Creado: {otro.fechaCreacion ? new Date(otro.fechaCreacion).toLocaleDateString('es-CO') : 'N/A'}
                          </span>
                        </div>

                        {/* Contenido financiero del otrosí */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Valor del contrato en el otrosí */}
                          {otro.valorTotal && (
                            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Nuevo Valor Total del Contrato
                              </span>
                              <p className="mt-1 text-gray-900 dark:text-white text-base font-semibold">
                                {otro.valorTotal}
                              </p>
                            </div>
                          )}

                          {/* Porcentaje IVA del otrosí */}
                          {otro.porcentajeIVA && (
                            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Nuevo Porcentaje del IVA
                              </span>
                              <p className="mt-1 text-gray-900 dark:text-white text-base font-semibold">
                                {otro.porcentajeIVA}%
                              </p>
                            </div>
                          )}

                          {/* IVA del otrosí */}
                          {otro.valorIVA && (
                            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Nuevo Valor del IVA
                              </span>
                              <p className="mt-1 text-gray-900 dark:text-white text-base font-semibold">
                                {otro.valorIVA}
                              </p>
                            </div>
                          )}

                          {/* Moneda del otrosí */}
                          {otro.moneda && (
                            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Nueva Moneda
                              </span>
                              <p className="mt-1 text-gray-900 dark:text-white text-base font-semibold">
                                {otro.moneda}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Forma de pago del otrosí (ocupa todo el ancho) */}
                        {otro.formaPago && (
                          <div className="mt-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              Nueva Forma de Pago
                            </span>
                            <p className="mt-1 text-gray-900 dark:text-white text-base break-all">
                              {otro.formaPago}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUMNA 2: Información de las Partes + Fechas y Vigencia */}
        <div className="space-y-3">
          {/* INFORMACIÓN DE LAS PARTES */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconUsers size={24} className="text-green-400" />
                Información de las Partes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Proveedor */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Proveedor
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base break-all">
                  {contract.proveedor}
                </p>
              </div>

              {/* NIT del proveedor */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  NIT del Proveedor
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {contract.nitProveedor}
                </p>
              </div>

              {/* Solicitante */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Solicitante
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {contract.solicitante?.firstName}{" "}
                  {contract.solicitante?.lastName}
                </p>
              </div>

              {/* Área */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Área
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base break-all">
                  {contract.area}
                </p>
              </div>

              {/* Gerente del área */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Gerente del Área
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base break-all">
                  {contract.gerenteArea}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* FECHAS Y VIGENCIA */}
          <Card className="border-2 border-gray-200 dark:border-gray-700 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IconCalendar size={24} className="text-orange-400" />
                Fechas y Vigencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Fecha de ingreso del contrato */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Fecha de Ingreso del Contrato
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {formatDate(contract.fechaIngreso)}
                </p>
              </div>

              {/* Fecha de inicio del contrato */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Fecha de Inicio del Contrato
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {formatDate(contract.fechaInicio)}
                </p>
              </div>

              {/* Fecha final del contrato */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Fecha Final del Contrato
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {formatDate(contract.fechaFinal)}
                </p>
              </div>

              {/* Duración del contrato */}
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-muted border border-gray-300 dark:border-gray-600">
                <span className="text-xs font-medium text-gray-600 dark:text-muted-foreground">
                  Duración del Contrato
                </span>
                <p className="mt-1 text-gray-900 dark:text-foreground text-base">
                  {contract.duracion} días
                </p>
              </div>

              {/* Fechas de todos los Otrosíes (si existen) */}
              {otrosi.length > 0 && (
                <div className="space-y-3">
                  {otrosi
                    .sort((a, b) => a.numeroOtrosi - b.numeroOtrosi) // Ordenar por número de otrosí
                    .filter(otro => otro.fechaInicio || otro.fechaFinal) // Solo mostrar otrosíes con fechas
                    .map((otro) => (
                      <div key={`dates-${otro.id}`} className="p-4 rounded-xl bg-purple-50 dark:bg-purple-700/20 border border-purple-200 dark:border-purple-500/30">
                        {/* Header del Otrosí */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                              Fechas y Vigencia - Otrosí #{otro.numeroOtrosi}
                            </h4>
                            <Badge className={`text-xs ${otro.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' :
                              otro.estado === 'otrosi_signed' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
                                otro.estado === 'rechazado' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' :
                                  otro.estado === 'firmado' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                              }`}>
                              {getOtrosiEstadoLabel(otro.estado)}
                            </Badge>
                          </div>
                          <span className="text-xs text-purple-600 dark:text-purple-400">
                            Creado: {otro.fechaCreacion ? new Date(otro.fechaCreacion).toLocaleDateString('es-CO') : 'N/A'}
                          </span>
                        </div>

                        {/* Contenido de fechas del otrosí */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Fecha de inicio del otrosí */}
                          {otro.fechaInicio && (
                            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Nueva Fecha de Inicio
                              </span>
                              <p className="mt-1 text-gray-900 dark:text-white text-base">
                                {formatDate(otro.fechaInicio)}
                              </p>
                            </div>
                          )}

                          {/* Fecha final del otrosí */}
                          {otro.fechaFinal && (
                            <div className="p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                              <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                                Nueva Fecha Final
                              </span>
                              <p className="mt-1 text-gray-900 dark:text-white text-base">
                                {formatDate(otro.fechaFinal)}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Duración modificada si se calculó (ocupa todo el ancho) */}
                        {otro.fechaInicio && otro.fechaFinal && (
                          <div className="mt-3 p-3 rounded-lg bg-white/50 dark:bg-gray-800/50 border border-purple-200/50 dark:border-purple-500/50">
                            <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                              Nueva Duración del Contrato
                            </span>
                            <p className="mt-1 text-gray-900 dark:text-white text-base">
                              {Math.ceil((new Date(otro.fechaFinal) - new Date(otro.fechaInicio)) / (1000 * 60 * 60 * 24))} días
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* Archivos del Contrato Principal */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <IconFileText className="w-5 h-5 text-blue-600" />
          Archivos del Contrato Principal
        </h3>

        {/* Información sobre tipos de archivos */}
        <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>💡 Información:</strong> Cada archivo está categorizado por tipo específico para facilitar su identificación.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Contrato</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Cámara</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Oferta</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Abogado</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">Usuario</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Firma</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300">Contable</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Devuelto</Badge>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Otrosí Sin Firma</Badge>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Los archivos de otrosí se muestran en la sección específica más abajo.
          </p>
        </div>

        {/* Lista de archivos */}
        {contractFiles
          .filter(file => {
            // Excluir archivos que son respuestas a otrosí devuelto
            const isResponseToReturnedOtrosi = otrosi.some(otro =>
              otro.estado === 'devuelto' &&
              file.responseType === 'user' &&
              file.created_at > otro.fechaDevolucion
            );
            return !isResponseToReturnedOtrosi;
          })
          .length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {contractFiles
              .filter(file => {
                // Excluir archivos que son respuestas a otrosí devuelto
                const isResponseToReturnedOtrosi = otrosi.some(otro =>
                  otro.estado === 'devuelto' &&
                  file.responseType === 'user' &&
                  file.created_at > otro.fechaDevolucion
                );
                return !isResponseToReturnedOtrosi;
              })
              .map((file) => (
                <Card key={file.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <IconFileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.filename}>
                          {file.filename}
                        </span>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    {/* Tipo de archivo principal - Badge con colores específicos por categoría */}
                    <div className="mb-3">
                      <Badge className={`text-xs px-3 py-1 border ${getFileTypeLabel(file) === 'Contrato'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-600' :
                        getFileTypeLabel(file) === 'Cámara'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-600' :
                          getFileTypeLabel(file) === 'Oferta'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-600' :
                            getFileTypeLabel(file) === 'Respuesta Abogado'
                              ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-600' :
                              getFileTypeLabel(file) === 'Respuesta Usuario'
                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-600' :
                                getFileTypeLabel(file) === 'Firma Abogado' || getFileTypeLabel(file) === 'Firma Usuario'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-600' :
                                  getFileTypeLabel(file) === 'Contable'
                                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-600' :
                                    getFileTypeLabel(file) === 'Devuelto'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-600' :
                                      getFileTypeLabel(file) === 'Otrosí Sin Firma'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600' :
                                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                        }`}>
                        {getFileTypeLabel(file)}
                      </Badge>
                    </div>

                    {/* Información del archivo */}
                    <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <IconUser className="w-4 h-4" />
                        <span>
                          {file.responseType === "lawyer" ? "Abogado" : "Usuario"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <IconCalendar className="w-4 h-4" />
                        <span>
                          {file.created_at ? formatFileTimestamp(file.created_at) : "Sin fecha"}
                        </span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Button
                      onClick={() => handleDownload(file)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="sm"
                    >
                      <IconDownload className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </CardFooter>
                </Card>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <IconFileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay archivos adjuntos al contrato principal</p>
          </div>
        )}
      </div>

      {/* Archivos y Comentarios de todos los Otrosíes - Ocupan todo el ancho */}
      {otrosi.length > 0 && (
        <div className="mt-8 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="h-px bg-gradient-to-r from-purple-200 to-transparent flex-1" />
            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              📋 Archivos Otrosí
            </Badge>
            <div className="h-px bg-gradient-to-l from-purple-200 to-transparent flex-1" />
          </div>

          {/* Mostrar cada otrosí con todos sus archivos y comentarios */}
          {otrosi
            .sort((a, b) => a.numeroOtrosi - b.numeroOtrosi)
            .map((otro) => (
              <div
                key={`otrosi-${otro.id}`}
                className="mb-6 p-4 bg-gradient-to-r from-purple-50/80 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/30 rounded-lg border-2 border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all duration-200"
              >
                {/* Header del Otrosí */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-200 dark:bg-purple-700 rounded-lg">
                      <IconFileText size={20} className="text-purple-700 dark:text-purple-300" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                        Otrosí #{otro.numeroOtrosi}
                      </h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">
                        Estado: {otro.estado === 'pendiente' ? '⏳ Pendiente' :
                          otro.estado === 'otrosi_awaiting_user_response' ? '🔄 Esperando Respuesta del Usuario del Otrosí' :
                            otro.estado === 'otrosi_awaiting_lawyer_review' ? '👨‍💼 Esperando Revisión del Abogado' :
                              otro.estado === 'otrosi_awaiting_signature' ? '✍️ Esperando Firma' :
                                otro.estado === 'otrosi_signed' ? '✅ Firmado' :
                                  otro.estado === 'otrosi_signed' ? '✅ Finalizado' :
                                    otro.estado === 'rechazado' ? '❌ Rechazado' :
                                      otro.estado === 'devuelto' ? '🔄 Devuelto' : otro.estado}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-lg border-purple-400 text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30">
                      Otrosí #{otro.numeroOtrosi}
                    </Badge>
                    <div className="flex items-center gap-2">
                      {/* Botón Devolver Otrosí removido - ya existe funcionalidad de respuesta */}
                    </div>
                  </div>
                </div>

                {/* Archivos del Otrosí desde OtrosiFile */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <IconFileText className="w-5 h-5 text-purple-600" />
                    Archivos del Otrosí #{otro.numeroOtrosi} (OtrosiFile)
                  </h3>

                  {/* Información sobre tipos de archivos */}
                  <div className="mb-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-600">
                    <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                      <strong>💡 Información:</strong> Cada archivo está categorizado por tipo específico para facilitar su identificación.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">Carta de Solicitud</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Firma Usuario</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">Firma Abogado</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Otros Archivos</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">Devuelto</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Otrosí Sin Firma</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                      Solo se muestran los archivos del otrosí.
                    </p>
                  </div>

                  {/* Lista de archivos */}
                  {otrosiFiles[otro.id] && otrosiFiles[otro.id].length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {otrosiFiles[otro.id].map((file) => (
                        <Card key={file.id} className="hover:shadow-lg transition-shadow duration-200 border-purple-200 dark:border-purple-600">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <IconFileText className="w-5 h-5 text-purple-600 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate" title={file.filename}>
                                  {file.filename}
                                </span>
                              </div>
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            {/* Tipo de archivo principal - Badge con colores específicos por categoría */}
                            <div className="mb-3">
                              <Badge className={`text-xs px-3 py-1 border ${getFileTypeLabel(file) === 'Carta de Solicitud'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-600' :
                                getFileTypeLabel(file) === 'Firma Usuario'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-600' :
                                  getFileTypeLabel(file) === 'Firma Abogado'
                                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-600' :
                                    getFileTypeLabel(file) === 'Devuelto'
                                      ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-600' :
                                      getFileTypeLabel(file) === 'Otrosí Sin Firma'
                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-600' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-600'
                                }`}>
                                {getFileTypeLabel(file)}
                              </Badge>
                            </div>

                            {/* Información del archivo */}
                            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <IconUser className="w-4 h-4" />
                                <span>
                                  {file.responseType === "lawyer" ? "Abogado" : "Usuario"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <IconCalendar className="w-4 h-4" />
                                <span>
                                  {file.uploadedAt ? formatFileTimestamp(file.uploadedAt) : "Sin fecha"}
                                </span>
                              </div>
                            </div>
                          </CardContent>

                          <CardFooter className="pt-0">
                            <Button
                              onClick={() => handleOtrosiFileDownload(file.id, file.filename)}
                              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                              size="sm"
                            >
                              <IconDownload className="w-4 h-4 mr-2" />
                              Descargar
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <IconFileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No hay archivos en OtrosiFile para este otrosí</p>
                    </div>
                  )}
                </div>



                {/* Comentarios del Otrosí */}
                <div className="space-y-3">
                  {/* Comentarios del Usuario */}
                  {otro.comentariosUsuario && (
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-600">
                      <div className="flex items-center gap-2 mb-2">
                        <IconEdit size={16} className="text-yellow-600 dark:text-yellow-400" />
                        <h5 className="font-semibold text-yellow-900 dark:text-yellow-100">💬 Comentarios del Usuario</h5>
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 text-xs">
                          Otrosí #{otro.numeroOtrosi}
                        </Badge>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{otro.comentariosUsuario}</p>
                    </div>
                  )}

                  {/* Comentarios del Abogado */}
                  {otro.comentariosAbogado && (
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-600">
                      <div className="flex items-center gap-2 mb-2">
                        <IconEdit size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <h5 className="font-semibold text-indigo-900 dark:text-indigo-100">⚖️ Comentarios del Abogado</h5>
                        <Badge className="bg-indigo-100 text-indigo-800 dark:text-indigo-900/30 dark:text-indigo-300 text-xs">
                          Otrosí #{otro.numeroOtrosi}
                        </Badge>
                      </div>
                      <p className="text-gray-800 dark:text-gray-200">{otro.comentariosAbogado}</p>
                    </div>
                  )}

                  {/* Estado de Otrosí Devuelto */}
                  {['otrosi_awaiting_user_response', 'devuelto'].includes(otro.estado) && (
                    <div className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-600">
                      <h5 className="font-semibold text-orange-900 dark:text-orange-100 mb-3 flex items-center gap-2">
                        <IconRefresh size={16} className="text-orange-600 dark:text-orange-400" />
                        Otrosí Requiere Respuesta del Usuario
                      </h5>
                      <p className="text-sm text-orange-700 dark:text-orange-300 mb-3">
                        El abogado ha devuelto este otrosí. El usuario debe responder con los cambios solicitados del otrosí.
                      </p>
                      {otro.comentariosAbogado && (
                        <div className="p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg border border-orange-300 dark:border-orange-500">
                          <h6 className="font-medium text-orange-800 dark:text-orange-200 mb-2">Comentarios de Devolución:</h6>
                          <p className="text-orange-700 dark:text-orange-300">{otro.comentariosAbogado}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Respuestas del Usuario en Otrosí Devuelto */}
                  {otro.estado === 'devuelto' && (
                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                        <IconUser size={16} className="text-blue-600 dark:text-blue-400" />
                        📋 Respuestas del Usuario al Otrosí Devuelto
                      </h5>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                        Archivos del usuario en respuesta al otrosí devuelto (desde OtrosiFile):
                      </p>

                      {/* Mostrar SOLO archivos de OtrosiFile para este otrosí */}
                      {otrosiFiles[otro.id] && otrosiFiles[otro.id].length > 0 ? (
                        otrosiFiles[otro.id].map((file) => (
                          <div key={file.id} className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <IconFileText size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-blue-900 dark:text-blue-100 truncate" title={file.filename}>{file.filename}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-xs">
                                      {file.fileType || file.category || 'Archivo'}
                                    </Badge>
                                    <span className="text-xs text-blue-700 dark:text-blue-300">
                                      {file.uploadedAt ? formatFileTimestamp(file.uploadedAt) : 'Fecha no disponible'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs">
                                      OtrosiFile ID: {file.id}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => handleOtrosiFileDownload(file.id, file.filename)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-sm"
                              >
                                <IconDownload size={16} className="mr-1" />
                                Descargar
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                            No hay archivos de respuesta en OtrosiFile aún
                          </p>
                        </div>
                      )}

                      {/* Mensaje informativo sobre OtrosiFile */}
                      <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-500">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          💡 <strong>Nota:</strong> Solo se muestran archivos de la tabla OtrosiFile específicos para este otrosí.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Fechas del Otrosí */}
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  {otro.fechaCreacion && (
                    <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 px-3 py-2 rounded-lg">
                      <IconCalendar size={14} className="text-purple-700 dark:text-purple-300" />
                      <span className="text-purple-700 dark:text-purple-300 font-medium">
                        Creado: {new Date(otro.fechaCreacion).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}
                  {otro.fechaAprobacion && (
                    <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg">
                      <IconCheck size={14} className="text-green-700 dark:text-green-300" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Finalizado: {new Date(otro.fechaAprobacion).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}
                  {otro.fechaDevolucion && (
                    <div className="flex items-center gap-1 bg-orange-100 dark:bg-orange-900/30 px-3 py-2 rounded-lg">
                      <IconRefresh size={14} className="text-orange-700 dark:text-orange-300" />
                      <span className="text-orange-700 dark:text-orange-300 font-medium">
                        Devuelto: {new Date(otro.fechaDevolucion).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Comentarios del Contrato Principal */}
      <Card className="mb-8 border-2 border-gray-200 dark:border-gray-700 h-fit">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <IconMessageCircle size={28} className="text-blue-400" />
            📋 Comentarios del Contrato
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-600">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>💡 Información:</strong> Esta sección muestra los comentarios realizados durante el flujo normal del contrato. Aparecen los comentarios de los usuarios y los de los abogados.
            </p>
          </div>
          {contractHistory.filter(history =>
            history.comment &&
            history.comment.trim() &&
            !isSystemGeneratedComment(history.comment)
          ).length === 0 ? (
            <div className="text-muted-foreground">No hay comentarios de usuarios disponibles.</div>
          ) : (
            <ul className="space-y-4">
              {contractHistory
                .filter(history =>
                  history.comment &&
                  history.comment.trim() &&
                  !isSystemGeneratedComment(history.comment)
                )
                .map((history) => (
                  <li key={history.id} className="p-4 bg-gray-50 dark:bg-muted rounded-lg border border-gray-300 dark:border-gray-600">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${history.action === 'sign' ? 'bg-green-500/20' :
                          history.action === 'return' ? 'bg-orange-500/20' :
                            history.action === 'respond' ? 'bg-blue-500/20' :
                              'bg-gray-500/20'
                          }`}>
                          {history.action === 'sign' ? (
                            <IconSignature size={16} className="text-green-400" />
                          ) : history.action === 'return' ? (
                            <IconRotate size={16} className="text-orange-400" />
                          ) : history.action === 'respond' ? (
                            <IconUpload size={16} className="text-blue-400" />
                          ) : (
                            <IconMessageCircle size={16} className="text-gray-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-foreground">
                            {getHistoryTitle(history)}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            {history.user && (
                              <span className="text-xs text-gray-600 dark:text-muted-foreground">
                                por {history.user.firstName} {history.user.lastName}
                              </span>
                            )}
                            {history.user && (
                              <Badge variant={history.user.role === 'lawyer' ? 'secondary' : 'default'} className="text-xs dark:text-black">
                                {history.user.role === 'lawyer' ? 'Abogado' : 'Usuario'}
                              </Badge>
                            )}
                          </div>
                          {/* Resumen amigable del resultado */}
                          {(history.oldStatus || history.newStatus) && (
                            <div className="mt-1 text-xs text-gray-700 dark:text-muted-foreground">
                              {history.action === 'sign' && history.newStatus === 'signed'
                                ? 'El contrato quedó firmado.'
                                : history.action === 'otrosi_signed'
                                  ? (() => {
                                    const n = extractOtrosiNumber(history.comment);
                                    return `El Otrosí${n ? ` #${n}` : ''} quedó firmado.`;
                                  })()
                                  : history.oldStatus && history.newStatus
                                    ? `Pasó de ${getStatusHumanLabel(history.oldStatus)} a ${getStatusHumanLabel(history.newStatus)}.`
                                    : history.newStatus
                                      ? `Ahora está: ${getStatusHumanLabel(history.newStatus)}.`
                                      : null}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 min-w-0">
                        <div className="text-xs text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          {formatHistoryTimestamp(history.timestamp)}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-muted-foreground whitespace-nowrap">
                          {history.timestamp && !isNaN(new Date(history.timestamp).getTime())
                            ? new Date(history.timestamp).toLocaleDateString('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })
                            : 'Fecha no disponible'
                          }
                        </div>
                      </div>
                    </div>
                    {history.comment && (
                      <div className="text-sm leading-relaxed bg-white dark:bg-background p-3 rounded-lg border border-gray-200 dark:border-border text-gray-900 dark:text-black">
                        <p className="text-gray-900 dark:text-black">{history.comment}</p>
                      </div>
                    )}
                    {history.files && history.files.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-border">
                        <p className="text-xs text-gray-600 dark:text-muted-foreground mb-2">Archivos adjuntos:</p>
                        <div className="space-y-1">
                          {history.files.map((file, index) => (
                            <div key={index} className="flex items-center gap-2 text-xs text-gray-700 dark:text-foreground min-w-0">
                              <IconFileText size={12} className="text-blue-400 flex-shrink-0" />
                              <span className="truncate" title={file.filename}>{file.filename}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {(signUploading || lawyerUploading || returnUploading) && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999]">
          <div className="w-64 h-64">
            <LottieAnimation
              animationData={signAnimation}
              width="100%"
              height="100%"
              loop={true}
              autoplay={true}
              speed={1}
            />
          </div>
        </div>
      )}

      {/* Animación de descarga */}
      <DownloadingAnimation
        isVisible={isDownloading}
        message={downloadMessage}
        size="medium"
      />
    </div>
  );
};

export default ContractFullDetail;


