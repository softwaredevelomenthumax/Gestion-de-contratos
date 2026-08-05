import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import api from "../api/axiosInstance";
import Button from "./Button";
import DropFile from "./DropFile";
import { IconUpload } from "@tabler/icons-react";
import { DatePicker } from "./ui/date-picker";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import LottieAnimation from "./LottieAnimation";
import sendAnimation from "../assets/animations/send.json";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "./ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge"
const tipoContratoOptions = [
  { value: "prestacion_de_servicios", label: "Prestación de servicios" },
  { value: "Compra de equipos", label: "Compra de equipos" },
  { value: "Obra_civil", label: "Obra civil" },
  { value: "Contrato suministro", label: "Contrato suministro" },
  { value: "Acuerdo_comercial", label: "Acuerdo comercial" },
  {
    value: "Acuerdo_de_confidencialidad",
    label: "Acuerdo de confidencialidad",
  },
  { value: "conseccion_de_espacios", label: "Concesión de espacios" },
  { value: "contrato_maquila", label: "Contrato de maquila" },
];

const monedaOptions = [
  { value: "COP", label: "COP" },
  { value: "MXN", label: "MXN" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
];

const ivaOptions = [
  { value: 0, label: "0%" },
  { value: 5, label: "5%" },
  { value: 10, label: "10%" },
  { value: 12, label: "12%" },
  { value: 15, label: "15%" },
  { value: 16, label: "16%" },
  { value: 18, label: "18%" },
  { value: 19, label: "19%" },
  { value: 20, label: "20%" },
  { value: 21, label: "21%" },
  { value: 22, label: "22%" },
  { value: 23, label: "23%" },
  { value: 24, label: "24%" },
  { value: 25, label: "25%" },
];

// Helper function for consistent badge styling
const getBadgeClasses = (type) => {
  switch (type) {
    case 'optional':
      return 'text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    case 'required':
      return 'text-xs bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'text-xs bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  }
};

const ContractForm = () => {
  const tipoSolicitud = "contrato";
  const [tipoContrato, setTipoContrato] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreSolicitante, setNombreSolicitante] = useState("");
  const [area, setArea] = useState("");
  const [gerenteArea, setGerenteArea] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [nitProveedor, setNitProveedor] = useState("");
  const [esNacional, setEsNacional] = useState(true);
  const [formaPago, setFormaPago] = useState("");
  const [valorSinIVA, setValorSinIVA] = useState(0);
  const [valorIndeterminado, setValorIndeterminado] = useState(false);
  const [porcentajeIVA, setPorcentajeIVA] = useState(19);
  const [valorIVA, setValorIVA] = useState(0);
  const [moneda, setMoneda] = useState("");
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFinal, setFechaFinal] = useState(null);
  const [duracion, setDuracion] = useState(0);
  const [fechaIngreso] = useState(() => new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contractFiles, setContractFiles] = useState([]);
  const [ofertaFiles, setOfertaFiles] = useState([]);
  const [camaraFiles, setCamaraFiles] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [otrosFiles, setOtrosFiles] = useState([]);
  const [dateError, setDateError] = useState("");
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [showDescriptionAlert, setShowDescriptionAlert] = useState(false);
  const [showFormaPagoAlert, setShowFormaPagoAlert] = useState(false);
  const descriptionRef = useRef(null);
  const formaPagoRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const uploadProgressRef = useRef(0);
  const lastUpdateTimeRef = useRef(0);

  const areDatesValid = () => {
    if (!fechaInicio || !fechaFinal) return true;

    const [startYear, startMonth, startDay] = fechaInicio
      .split("-")
      .map(Number);
    const [endYear, endMonth, endDay] = fechaFinal.split("-").map(Number);

    const start = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    return end > start;
  };

  // Calcular IVA automáticamente
  useEffect(() => {
    const valorBase = Number(valorSinIVA) || 0;
    const porcentaje = Number(porcentajeIVA) || 0;
    const ivaCalculado = (valorBase * porcentaje) / 100;

    setValorIVA(ivaCalculado);
  }, [valorSinIVA, porcentajeIVA]);

  // Manejar click fuera del área de descripción para cerrar la alerta
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        descriptionRef.current &&
        !descriptionRef.current.contains(event.target)
      ) {
        setShowDescriptionAlert(false);
      }
    };

    if (showDescriptionAlert) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDescriptionAlert]);

  // Manejar click fuera del área de forma de pago para cerrar la alerta
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        formaPagoRef.current &&
        !formaPagoRef.current.contains(event.target)
      ) {
        setShowFormaPagoAlert(false);
      }
    };

    if (showFormaPagoAlert) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFormaPagoAlert]);

  useEffect(() => {
    if (fechaInicio && fechaFinal) {
      const [startYear, startMonth, startDay] = fechaInicio
        .split("-")
        .map(Number);
      const [endYear, endMonth, endDay] = fechaFinal.split("-").map(Number);

      const start = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);

      const diff = end.getTime() - start.getTime();
      const days = Math.round(diff / (1000 * 60 * 60 * 24)); // Changed from Math.ceil to Math.round
      setDuracion(days >= 0 ? days : 0);

      // Update date error message
      if (end <= start) {
        setDateError("La fecha final debe ser mayor que la fecha de inicio");
      } else {
        setDateError("");
      }
    }
  }, [fechaInicio, fechaFinal]);

  // Add NIT validation function
  const isValidNIT = (nit) => {
    // Must be exactly 9 alphanumeric characters
    return /^[a-zA-Z0-9]{9}$/.test(nit);
  };

  const getValidationErrors = () => {
    const errors = [];

    if (!tipoContrato) {
      errors.push("Tipo de Contrato");
    }

    if (!descripcion || descripcion.trim() === "") {
      errors.push("Descripción");
    }

    if (!nombreSolicitante || nombreSolicitante.trim() === "") {
      errors.push("Solicitante");
    }

    if (!area || area.trim() === "") {
      errors.push("Área");
    }

    if (!gerenteArea || gerenteArea.trim() === "") {
      errors.push("Gerente del Área");
    }

    if (!proveedor || proveedor.trim() === "") {
      errors.push("Proveedor / Cliente");
    }

    if (esNacional) {
      if (!nitProveedor || nitProveedor.trim() === "") {
        errors.push("NIT / Identificación del Proveedor / Cliente");
      } else if (!isValidNIT(nitProveedor)) {
        errors.push(
          "NIT / Identificación del Proveedor / Cliente (debe tener exactamente 9 caracteres alfanuméricos)"
        );
      }
    }

    if (!formaPago || formaPago.trim() === "") {
      errors.push("Forma de Pago");
    }

    if (!valorIndeterminado && (!valorSinIVA || valorSinIVA <= 0)) {
      errors.push("Valor Total del Contrato");
    }

    if (!moneda) {
      errors.push("Moneda");
    }

    if (!fechaInicio) {
      errors.push("Fecha de Inicio");
    }

    if (!fechaFinal) {
      errors.push("Fecha Final");
    }

    if (!areDatesValid()) {
      errors.push(
        "Fechas (la fecha final debe ser mayor que la fecha de inicio)"
      );
    }

    if (duracion <= 0) {
      errors.push("Duración (debe ser mayor a 0 días)");
    }

    // File validation - only oferta is required
    if (ofertaFiles.length === 0) {
      errors.push("Archivo de Oferta");
    }

    return errors;
  };

  const isFormValid = () => {
    return getValidationErrors().length === 0;
  };

  const hasFieldError = (fieldName) => {
    if (!hasAttemptedSubmit) return false;
    const errors = getValidationErrors();
    return errors.some((error) => error.includes(fieldName));
  };

  // Función para limpiar errores cuando el usuario comience a completar campos
  const clearErrorsOnInput = () => {
    if (hasAttemptedSubmit && isFormValid()) {
      setError(null);
      setHasAttemptedSubmit(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setHasAttemptedSubmit(true);
    const validationErrors = getValidationErrors();

    if (validationErrors.length > 0) {
      const errorMessage =
        validationErrors.length === 1
          ? `Falta completar el siguiente campo: ${validationErrors[0]}`
          : `Faltan completar los siguientes campos:\n• ${validationErrors.join(
              "\n• "
            )}`;

      setError(errorMessage);

      // Scroll to the top to show the error message
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setHasAttemptedSubmit(false);
    setLoading(true);
    setError(null);
    try {
      console.log("🚀 Starting contract creation...");
      console.log("📋 Form data:", {
        tipoSolicitud,
        tipoContrato,
        descripcion,
        nombreSolicitante,
        area,
        gerenteArea,
        proveedor,
      });

      const token = localStorage.getItem("token");
      console.log("🔑 Token exists:", !!token);
      console.log(
        "🔑 Token preview:",
        token ? token.substring(0, 50) + "..." : "No token"
      );

      // Create FormData to send contract data and files together
      const formData = new FormData();

      // Add contract data
      formData.append("tipoSolicitud", tipoSolicitud);
      formData.append("tipoContrato", tipoContrato);
      formData.append("descripcion", descripcion);
      formData.append("nombreSolicitante", nombreSolicitante);
      formData.append("area", area);
      formData.append("gerenteArea", gerenteArea || "");
      formData.append("proveedor", proveedor);
      formData.append("nitProveedor", nitProveedor || "");
      formData.append("esNacional", esNacional ? "true" : "false");
      formData.append("formaPago", formaPago);
      formData.append("valorSinIVA", valorIndeterminado ? 0 : valorSinIVA);
      formData.append("porcentajeIVA", porcentajeIVA);
      formData.append("valorIVA", valorIVA);
      formData.append("moneda", moneda);
      formData.append(
        "fechaInicio",
        fechaInicio ? fechaInicio.split("T")[0] : ""
      );
      formData.append("fechaFinal", fechaFinal ? fechaFinal.split("T")[0] : "");
      formData.append("duracion", duracion);
      formData.append(
        "fechaIngreso",
        fechaIngreso ? fechaIngreso.split("T")[0] : ""
      );

      // Add files with specific field names so backend can distinguish categories
      contractFiles.forEach((file) => {
        formData.append("contrato", file);
      });

      ofertaFiles.forEach((file) => {
        formData.append("oferta", file);
      });

      camaraFiles.forEach((file) => {
        formData.append("camara", file);
      });

      otrosFiles.forEach((file) => {
        formData.append("otros", file);
      });

      console.log("📤 Sending contract with files to backend...");
      console.log("📋 Contract files:", contractFiles.length);
      console.log("📋 Oferta files:", ofertaFiles.length);
      console.log("📋 Camara files:", camaraFiles.length);
      console.log("📋 Otros files:", otrosFiles.length);

      // Calculate total files for progress tracking
      const totalFiles = contractFiles.length + ofertaFiles.length + camaraFiles.length + otrosFiles.length;
      setUploadStage(`Subiendo ${totalFiles} archivo${totalFiles !== 1 ? 's' : ''}...`);

      // Reset progress tracking refs
      uploadProgressRef.current = 0;
      lastUpdateTimeRef.current = Date.now();

      console.log("📦 Payload preview:", {
        contrato: contractFiles.map((f) => f.name),
        oferta: ofertaFiles.map((f) => f.name),
        camara: camaraFiles.map((f) => f.name),
        otros: otrosFiles.map((f) => f.name),
      });

      // Send contract creation request with files
      await api.post("/contracts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          // Cap progress at 90% during upload phase
          // The remaining 10% is for server processing
          const targetPercent = Math.round(
            (progressEvent.loaded * 90) / progressEvent.total
          );
          
          // Throttle updates to create smooth animation (minimum 100ms between updates)
          const now = Date.now();
          const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
          
          if (timeSinceLastUpdate >= 100 || targetPercent === 90) {
            // Smooth increment: don't jump more than 15% at once
            const currentPercent = uploadProgressRef.current;
            const increment = Math.min(targetPercent - currentPercent, 15);
            const newPercent = Math.min(currentPercent + increment, targetPercent);
            
            uploadProgressRef.current = newPercent;
            lastUpdateTimeRef.current = now;
            
            setUploadProgress(newPercent);
            setUploadStage(`Subiendo archivos... ${newPercent}%`);
          }
        },
      });

      // Ensure we smoothly reach 90% if we haven't already
      if (uploadProgressRef.current < 90) {
        for (let i = uploadProgressRef.current; i <= 90; i += 5) {
          setUploadProgress(i);
          setUploadStage(`Subiendo archivos... ${i}%`);
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Upload completed, now processing on server
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(95);
      setUploadStage("Procesando contrato en el servidor...");
      
      // Small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // All done!
      setUploadStage("¡Contrato creado exitosamente!");
      setUploadProgress(100);
      
      // Small delay to show completion before hiding
      setTimeout(() => {
        setShowSuccess(true);
        setUploadProgress(0);
        setUploadStage("");
      }, 800);
      
      addNotification("Contrato enviado correctamente", "success");
    } catch (error) {
      console.error("❌ Contract creation failed:", error);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error message:", error.response?.data?.error || error.message);

      const serverMessage = error.response?.data?.error;
      setError(serverMessage || error.message || "Ocurrió un error al crear el contrato");
      
      // Reset progress on error
      setUploadProgress(0);
      setUploadStage("");
      uploadProgressRef.current = 0;
      lastUpdateTimeRef.current = 0;
    } finally {
      setLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 px-6 py-4 rounded-lg shadow-lg mb-6"
          role="status"
        >
          <h2 className="text-2xl font-bold mb-2">
            ¡Contrato enviado correctamente!
          </h2>
          <p className="mb-4">
            Tu contrato ha sido registrado y está en proceso.
          </p>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors duration-200"
            onClick={() => navigate("/my_contracts")}
          >
            Ir a "Mis contratos"
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="contract-form-header mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
          Crear un nuevo contrato
        </h1>
        <p className="text-muted-foreground text-lg">
          Completa los siguientes datos para crear un nuevo contrato.
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-card p-8 shadow-2xl backdrop-blur-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
          aria-label="Formulario de contrato"
        >
          {error && (
            <Alert className="animate-fade-in" variant="destructive">
              <AlertTitle className="font-semibold mb-2">❌ Error de validación:</AlertTitle>
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}
          {!hasAttemptedSubmit && (
            <div
              className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm text-blue-700 dark:text-blue-300"
              role="alert"
            >
              <div className="font-semibold mb-2">ℹ️ Información:</div>
              <div>
                Completa todos los campos para crear el contrato. Los campos con
                errores se mostrarán en rojo.
              </div>
            </div>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative">
              <Label htmlFor="tipoSolicitud" className="mb-1 text-foreground">
                Tipo de Solicitud
              </Label>
              <Input
                className="bg-muted text-foreground border-input"
                id="tipoSolicitud"
                type="text"
                value="Contrato"
                readOnly
                placeholder="Contrato"
              />
            </div>
            <div className="relative">
              <Label htmlFor="tipoContrato" className="mb-1 text-foreground">
                Tipo de Contrato
              </Label>
              <Select
                value={tipoContrato}
                onValueChange={(value) => {
                  setTipoContrato(value);
                  clearErrorsOnInput();
                }}
              >
                <SelectTrigger
                  className={`w-full ${
                    hasFieldError("Tipo de Contrato")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                >
                  <SelectValue placeholder="Tipo de Contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Tipo de Contrato</SelectLabel>
                    {tipoContratoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {hasFieldError("Tipo de Contrato") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2" ref={descriptionRef}>
              <Label htmlFor="descripcion" className="text-foreground">
                Descripción
              </Label>
              <div
                className="relative cursor-pointer"
                onClick={() => setShowDescriptionAlert(!showDescriptionAlert)}
              >
                <Textarea
                  className={`bg-background text-foreground border-input ${
                    hasFieldError("Descripción")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    clearErrorsOnInput();
                  }}
                  placeholder="Descripción del contrato"
                  rows={4}
                />
                <div className="absolute inset-0 pointer-events-none" />
              </div>
              {hasFieldError("Descripción") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
              {showDescriptionAlert && (
                <Alert className="mt-4">
                  <AlertTitle className="font-bold text-lg mb-3">
                    Descripción del objeto del contrato
                  </AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>
                      En este campo debe indicar, de manera clara y detallada,
                      cuál es la finalidad del contrato. Procure incluir:
                    </p>
                    <div className="space-y-2">
                      <p>
                        <span className="font-bold">
                          Objeto o propósito principal:
                        </span>{" "}
                        explique qué servicio, bien o actividad se va a realizar
                        o entregar.
                      </p>
                      <p>
                        <span className="font-bold">Alcance:</span> especifique
                        qué incluye y qué no incluye el contrato, para evitar
                        dudas o interpretaciones posteriores.
                      </p>
                      <p>
                        <span className="font-bold">Entregables y plazos:</span>{" "}
                        describa los productos, servicios o resultados
                        esperados, señalando fechas de entrega o hitos
                        relevantes.
                      </p>
                      <p>
                        <span className="font-bold">
                          Otros aspectos relevantes:
                        </span>{" "}
                        toda información adicional que ayude a precisar cómo
                        debe ejecutarse la obligación (condiciones,
                        limitaciones, requisitos, etc.).
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombreSolicitante" className="text-foreground">
                Solicitante
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("Solicitante")
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                id="nombreSolicitante"
                type="text"
                value={nombreSolicitante}
                onChange={(e) => {
                  setNombreSolicitante(e.target.value);
                  clearErrorsOnInput();
                }}
                placeholder="Nombre del solicitante"
              />
              {hasFieldError("Solicitante") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="rounded-md border border-border/60 bg-background/70 px-3 py-3">
                <Label className="text-foreground cursor-pointer">
                  ¿Es proveedor / cliente extranjero?
                </Label>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      id="esExtranjeroSi"
                      type="radio"
                      name="esExtranjero"
                      checked={!esNacional}
                      onChange={() => {
                        setEsNacional(false);
                        setNitProveedor("");
                        clearErrorsOnInput();
                      }}
                      className="h-4 w-4 border-border text-primary focus:ring-primary"
                    />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      id="esExtranjeroNo"
                      type="radio"
                      name="esExtranjero"
                      checked={esNacional}
                      onChange={() => {
                        setEsNacional(true);
                        clearErrorsOnInput();
                      }}
                      className="h-4 w-4 border-border text-primary focus:ring-primary"
                    />
                    <span>No</span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {esNacional
                    ? "Si no es extranjero, el NIT será obligatorio."
                    : "Si es extranjero, el NIT quedará deshabilitado."}
                </p>
              </div>
            </div>
          </div>
          {/* Section 2: Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area" className="text-foreground">
                Área
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("Área")
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                id="area"
                type="text"
                value={area}
                onChange={(e) => {
                  setArea(e.target.value);
                  clearErrorsOnInput();
                }}
                placeholder="Área del solicitante"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasFieldError("Área") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gerenteArea" className="text-foreground">
                Gerente del Área
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("Gerente del Área")
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                id="gerenteArea"
                type="text"
                value={gerenteArea}
                onChange={(e) => {
                  setGerenteArea(e.target.value);
                  clearErrorsOnInput();
                }}
                placeholder="Nombre del gerente"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasFieldError("Gerente del Área") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor" className="text-foreground">
                Proveedor / Cliente
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("Proveedor / Cliente")
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                id="proveedor"
                type="text"
                value={proveedor}
                onChange={(e) => {
                  setProveedor(e.target.value);
                  clearErrorsOnInput();
                }}
                placeholder="Nombre del proveedor o cliente"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasFieldError("Proveedor / Cliente") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nitProveedor" className="text-foreground">
                NIT / Identificación del Proveedor / Cliente
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("NIT / Identificación del Proveedor / Cliente")
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                id="nitProveedor"
                type="text"
                value={nitProveedor}
                onChange={(e) => {
                  const valor = e.target.value
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .slice(0, 9);
                  setNitProveedor(valor);
                }}
                placeholder="NIT o identificación (9 caracteres alfanuméricos)"
                maxLength={9}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                disabled={!esNacional}
              />
              <div className="text-xs text-muted-foreground">
                Debe tener exactamente 9 caracteres alfanuméricos (sin dígito de
                verificación)
              </div>
              {nitProveedor && nitProveedor.length !== 9 && (
                <p className="text-red-500 text-xs mt-1">
                  El NIT debe tener exactamente 9 caracteres ({nitProveedor.length}/9)
                </p>
              )}
              {nitProveedor && !/^[a-zA-Z0-9]*$/.test(nitProveedor) && (
                <p className="text-red-500 text-xs mt-1">
                  Solo se permiten letras y números
                </p>
              )}
              {hasFieldError("NIT / Identificación del Proveedor / Cliente") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Información Financiera
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tipoValor" className="text-foreground">
                  Tipo de valor
                </Label>
                <Select
                  value={valorIndeterminado ? "indeterminado" : "determinado"}
                  onValueChange={(value) => {
                    const isIndeterminate = value === "indeterminado";
                    setValorIndeterminado(isIndeterminate);
                    if (isIndeterminate) {
                      setValorSinIVA(0);
                    }
                    clearErrorsOnInput();
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Tipo de valor</SelectLabel>
                      <SelectItem value="determinado">Determinado</SelectItem>
                      <SelectItem value="indeterminado">Indeterminado</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {valorIndeterminado
                    ? "El contrato se registrará con valor indeterminado."
                    : "Seleccione si el valor es determinado o indeterminado."}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorSinIVA" className="text-foreground">
                  Valor total del contrato
                </Label>
                <Input
                  className={`bg-background text-foreground border-input ${
                    hasFieldError("Valor Total del Contrato")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="valorSinIVA"
                  type="text"
                  value={valorIndeterminado ? "Indeterminado" : valorSinIVA}
                  onChange={(e) => {
                    if (valorIndeterminado) return;
                    const valor = e.target.value.replace(/[^0-9.]/g, "");
                    const partes = valor.split(".");
                    const valorLimpio =
                      partes.length > 2
                        ? partes[0] + "." + partes.slice(1).join("")
                        : valor;
                    setValorSinIVA(Number(valorLimpio) || 0);
                    clearErrorsOnInput();
                  }}
                  placeholder="Ingrese el valor total del contrato"
                  disabled={valorIndeterminado}
                />
                {hasFieldError("Valor Total del Contrato") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio y debe ser mayor a 0
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-1" />
            </div>
            <div className="grid gap-6 md:grid-cols-3 md:pt-2">
              <div className="space-y-2">
                <Label htmlFor="moneda" className="text-foreground">
                  Moneda
                </Label>
                <Select
                  value={moneda}
                  onValueChange={(value) => {
                    setMoneda(value);
                    clearErrorsOnInput();
                  }}
                >
                  <SelectTrigger
                    className={`w-full ${
                      hasFieldError("Moneda")
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder="Moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Moneda</SelectLabel>
                      {monedaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {hasFieldError("Moneda") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="porcentajeIVA" className="text-foreground">
                  Porcentaje de IVA
                </Label>
                <Select
                  value={porcentajeIVA.toString()}
                  onValueChange={(value) => setPorcentajeIVA(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona el porcentaje de IVA" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Porcentaje de IVA</SelectLabel>
                      {ivaOptions.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value.toString()}
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorIVA" className="text-foreground">
                  Valor del IVA (Calculado)
                </Label>
                <Input
                  className="bg-muted text-foreground border-input"
                  id="valorIVA"
                  type="text"
                  value={valorIVA.toLocaleString("es-CO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  readOnly
                  placeholder="Valor del IVA"
                />
              </div>
              <div className="space-y-2 md:col-span-2" ref={formaPagoRef}>
                <Label htmlFor="formaPago" className="text-foreground">
                  Forma de Pago
                </Label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => setShowFormaPagoAlert(!showFormaPagoAlert)}
                >
                  <Textarea
                    className={`bg-background text-foreground border-input ${
                      hasFieldError("Forma de Pago")
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    id="formaPago"
                    value={formaPago}
                    onChange={(e) => {
                      setFormaPago(e.target.value);
                      clearErrorsOnInput();
                    }}
                    placeholder="Ej: 50% al inicio y 50% contra entrega final del servicio"
                    rows={3}
                  />
                  <div className="absolute inset-0 pointer-events-none" />
                </div>
                {hasFieldError("Forma de Pago") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio
                  </p>
                )}
                {showFormaPagoAlert && (
                  <Alert className="mt-4">
                    <AlertTitle className="font-bold text-lg mb-3">
                      Forma de Pago
                    </AlertTitle>
                    <AlertDescription className="space-y-3">
                      <p>
                        Indique cómo y cuándo se realizará el pago al contratista o proveedor. 
                        Especifique los plazos, porcentajes y condiciones acordadas.
                      </p>
                      <div className="space-y-2">
                        <p className="font-semibold">Ejemplos:</p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                          <li>
                            "50% al inicio y 50% contra entrega final del servicio."
                          </li>
                          <li>
                            "Pago mensual dentro de los primeros 10 días hábiles de cada mes, 
                            previa presentación de factura."
                          </li>
                          <li>
                            "Un único pago dentro de los 30 días siguientes a la entrega y 
                            aceptación del producto."
                          </li>
                        </ul>
                      </div>
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm">
                          <span className="font-bold">Recomendación:</span> Use términos simples 
                          y evite expresiones generales como "según acuerdo" o "por definir". 
                          Si aplica retención o condiciones especiales (por ejemplo, anticipo, 
                          hitos de entrega o pagos condicionados), descríbalos brevemente.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Date Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Vigencia del contrato
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-foreground">
                  Fecha de Inicio del contrato
                </Label>
                <div
                  className={`${
                    hasFieldError("Fecha de Inicio")
                      ? "ring-2 ring-red-500 rounded-md"
                      : ""
                  }`}
                >
                  <DatePicker
                    date={
                      fechaInicio
                        ? (() => {
                            const [year, month, day] = fechaInicio
                              .split("-")
                              .map(Number);
                            return new Date(year, month - 1, day);
                          })()
                        : null
                    }
                    setDate={(date) => {
                      if (date) {
                        // Format date as YYYY-MM-DD in local timezone
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        setFechaInicio(`${year}-${month}-${day}`);
                      } else {
                        setFechaInicio("");
                      }
                      clearErrorsOnInput();
                    }}
                    maxDate={
                      fechaFinal
                        ? (() => {
                            const [year, month, day] = fechaFinal
                              .split("-")
                              .map(Number);
                            return new Date(year, month - 1, day - 1);
                          })()
                        : undefined
                    }
                  />
                </div>
                {hasFieldError("Fecha de Inicio") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio
                  </p>
                )}
                {dateError && (
                  <p className="text-red-500 text-xs mt-1">{dateError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinal" className="text-foreground">
                  Fecha Final
                </Label>
                <div
                  className={`${
                    hasFieldError("Fecha Final")
                      ? "ring-2 ring-red-500 rounded-md"
                      : ""
                  }`}
                >
                  <DatePicker
                    date={
                      fechaFinal
                        ? (() => {
                            const [year, month, day] = fechaFinal
                              .split("-")
                              .map(Number);
                            return new Date(year, month - 1, day);
                          })()
                        : null
                    }
                    setDate={(date) => {
                      if (date) {
                        // Format date as YYYY-MM-DD in local timezone
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          "0"
                        );
                        const day = String(date.getDate()).padStart(2, "0");
                        setFechaFinal(`${year}-${month}-${day}`);
                      } else {
                        setFechaFinal("");
                      }
                      clearErrorsOnInput();
                    }}
                    minDate={
                      fechaInicio
                        ? (() => {
                            const [year, month, day] = fechaInicio
                              .split("-")
                              .map(Number);
                            return new Date(year, month - 1, day + 1);
                          })()
                        : undefined
                    }
                  />
                </div>
                {hasFieldError("Fecha Final") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio
                  </p>
                )}
                {dateError && (
                  <p className="text-red-500 text-xs mt-1">{dateError}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="duracion" className="text-foreground">
                  Duración (días)
                </Label>
                <Input
                  className={`bg-background text-foreground border-input ${
                    hasFieldError("Duración")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="duracion"
                  type="number"
                  value={duracion}
                  readOnly
                />
                {hasFieldError("Duración") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ La duración debe ser mayor a 0 días
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: File Uploads */}
          {tipoSolicitud === "contrato" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Archivos del Contrato
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sección Contrato */}
                <div className="space-y-2">
                  <Label
                    htmlFor="contractFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> Adjunta
                    el Contrato (PDF, DOC, DOCX) <Badge className={getBadgeClasses('optional')}>Opcional</Badge>
                  </Label>
                  <DropFile onFileSelect={setContractFiles} multiple accept=".pdf,.doc,.docx"/>
                  {contractFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {contractFiles.length} archivo(s) de contrato
                      seleccionado(s)
                    </div>
                  )}
                </div>

                {/* Sección Oferta */}
                <div className="space-y-2">
                  <Label
                    htmlFor="ofertaFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> Adjunta
                    la Oferta (PDF, DOC, DOCX) <Badge className={getBadgeClasses('required')}>Obligatorio</Badge>
                  </Label>
                  <DropFile onFileSelect={setOfertaFiles} multiple accept=".pdf,.doc,.docx"/>
                  {ofertaFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {ofertaFiles.length} archivo(s) de oferta seleccionado(s)
                    </div>
                  )}
                </div>

                {/* Sección Cámara de Comercio */}
                <div className="space-y-2">
                  <Label
                    htmlFor="camaraFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> Adjunta
                    Cámara de Comercio / CAF (PDF, DOC, DOCX) <Badge className={getBadgeClasses('optional')}>Opcional</Badge>
                  </Label>
                  <DropFile onFileSelect={setCamaraFiles} multiple accept=".pdf,.doc,.docx"/>
                  {camaraFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {camaraFiles.length} archivo(s) de cámara seleccionado(s)
                    </div>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="otrosFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> Otros
                    documentos (PDF DOC DOCX, puedes adjuntar varios) <Badge className={getBadgeClasses('optional')}>Opcional</Badge>
                  </Label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files).filter(
                        (f) =>
                          [
                            "application/pdf",
                            "application/msword",
                            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                          ].includes(f.type) &&
                          f.size <= 30 * 1024 * 1024
                      );
                      setOtrosFiles(files);
                    }}
                    className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 mb-2"
                  />
                  {/* Mostrar archivos seleccionados */}
                  {otrosFiles.length > 0 && (
                    <ul className="text-xs text-muted-foreground mt-2">
                      {otrosFiles.map((file, idx) => (
                        <li key={idx} className="flex items-center gap-2 mb-1">
                          <span>{file.name}</span>
                          <button
                            type="button"
                            className="text-red-500 hover:underline text-xs"
                            onClick={() =>
                              setOtrosFiles(
                                otrosFiles.filter((_, i) => i !== idx)
                              )
                            }
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => navigate("/my_contracts")}
              variant="outline"
              className="px-6 py-3 rounded-lg font-semibold shadow-lg transition"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold shadow-lg transition disabled:opacity-50 ${
                hasAttemptedSubmit && !isFormValid()
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {loading ? "Enviando..." : "Crear Contrato"}
            </Button>
          </div>
        </form>
        {hasAttemptedSubmit && !isFormValid() && (
          <p className="text-red-500 text-xs mt-2 text-right">
            ⚠️ Completa todos los campos obligatorios para continuar
          </p>
        )}
      </div>

      {/* Send Animation - Only appears when submitting */}
      {loading && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999]">
          <div className="w-64 h-64">
            <LottieAnimation
              animationData={sendAnimation}
              width="100%"
              height="100%"
              loop={true}
              autoplay={true}
              speed={1}
            />
          </div>
        </div>
      )}

      {/* Upload Progress Indicator */}
      {loading && uploadProgress > 0 && (
        <div className="fixed bottom-6 right-6 bg-card p-5 rounded-xl shadow-2xl border border-border z-[9998] min-w-[320px] animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">
              {uploadStage}
            </p>
            {uploadProgress === 100 && (
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
          
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          
          {/* Progress percentage */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {uploadProgress < 90 
                ? 'Subiendo archivos...' 
                : uploadProgress < 100 
                  ? 'Procesando...' 
                  : '¡Completado!'}
            </p>
            <p className="text-xs font-medium text-foreground">
              {uploadProgress}%
            </p>
          </div>
          
          {/* File count info */}
          {(contractFiles.length + ofertaFiles.length + camaraFiles.length + otrosFiles.length) > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {contractFiles.length + ofertaFiles.length + camaraFiles.length + otrosFiles.length} archivo(s) total
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContractForm;
//mover logica al backend
//borar solicitante
