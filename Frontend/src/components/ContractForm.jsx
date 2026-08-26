import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import { useLanguage } from "../context/LanguageContext";
import api from "../api/axiosInstance";
import Button from "./Button";
import DropFile from "./DropFile";
import { IconUpload, IconInfoCircle } from "@tabler/icons-react";
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
import { calculateContractDurationDays } from "../utils/dateUtils";

const tipoContratoOptions = [
  {
    value: "prestacion_de_servicios",
    labelEn: "Service provision",
    labelEs: "Prestación de servicios",
  },
  {
    value: "Compra de equipos",
    labelEn: "Equipment purchase",
    labelEs: "Compra de equipos",
  },
  {
    value: "Obra_civil",
    labelEn: "Civil works",
    labelEs: "Obra civil",
  },
  {
    value: "Contrato suministro",
    labelEn: "Supply contract",
    labelEs: "Contrato suministro",
  },
  {
    value: "Acuerdo_comercial",
    labelEn: "Commercial agreement",
    labelEs: "Acuerdo comercial",
  },
  {
    value: "Acuerdo_de_confidencialidad",
    labelEn: "Confidentiality agreement",
    labelEs: "Acuerdo de confidencialidad",
  },
  {
    value: "conseccion_de_espacios",
    labelEn: "Space concession",
    labelEs: "Concesión de espacios",
  },
  {
    value: "contrato_maquila",
    labelEn: "Manufacturing contract",
    labelEs: "Contrato de maquila",
  },
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
  const { language } = useLanguage();
  const tr = (en, es) => (language === "en" ? en : es);
  const tipoSolicitud = "contrato";
  const [tipoContrato, setTipoContrato] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreSolicitante, setNombreSolicitante] = useState("");
  const [area, setArea] = useState("");
  const [gerenteArea, setGerenteArea] = useState("");
  const [proveedor, setProveedor] = useState("");
  // Supplier tax ID (NIT) - single field
  const [nitProveedor, setNitProveedor] = useState("");
  const [esExtranjero, setEsExtranjero] = useState(false);
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
  const [showNitAlert, setShowNitAlert] = useState(false);
  const [showDocumentInfo, setShowDocumentInfo] = useState(false);
  const [showFormaPagoAlert, setShowFormaPagoAlert] = useState(false);
  const descriptionRef = useRef(null);
  const nitRef = useRef(null);
  // const documentRef = useRef(null);
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

  useEffect(() => {
    if (!fechaInicio || !fechaFinal) {
      setDuracion(0);
      return;
    }

    setDuracion(calculateContractDurationDays(fechaInicio, fechaFinal));
  }, [fechaInicio, fechaFinal]);

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

  const getValidationErrors = () => {
    const errors = [];

    if (!tipoContrato) {
      errors.push(tr("Contract Type", "Tipo de Contrato"));
    }

    if (!descripcion || descripcion.trim() === "") {
      errors.push(tr("Description", "Descripción"));
    }

    if (!nombreSolicitante || nombreSolicitante.trim() === "") {
      errors.push(tr("Requester", "Solicitante"));
    }

    if (!area || area.trim() === "") {
      errors.push(tr("Area", "Área"));
    }

    if (!gerenteArea || gerenteArea.trim() === "") {
      errors.push(tr("Area Manager", "Gerente del Área"));
    }

    if (!proveedor || proveedor.trim() === "") {
      errors.push(tr("Supplier / Client", "Proveedor / Cliente"));
    }

    // Validate NIT (if not foreign)
    if (!esExtranjero && (!nitProveedor || String(nitProveedor).trim() === "")) {
      errors.push(tr("Tax ID (NIT)", "Registro Tributario (NIT)"));
    }

    if (!formaPago || formaPago.trim() === "") {
      errors.push(tr("Payment Terms", "Forma de Pago"));
    }

    if (!valorIndeterminado && (!valorSinIVA || valorSinIVA <= 0)) {
      errors.push(tr("Total Contract Value", "Valor Total del Contrato"));
    }

    if (!moneda) {
      errors.push(tr("Currency", "Moneda"));
    }

    if (!fechaInicio) {
      errors.push(tr("Start Date", "Fecha de Inicio"));
    }

    if (!fechaFinal) {
      errors.push(tr("End Date", "Fecha Final"));
    }

    if (!areDatesValid()) {
      errors.push(
        tr(
          "Dates (the end date must be later than the start date)",
          "Fechas (la fecha final debe ser mayor que la fecha de inicio)"
        )
      );
    }

    if (duracion <= 0) {
      errors.push(
        tr(
          "Duration (must be greater than 0 days)",
          "Duración (debe ser mayor a 0 días)"
        )
      );
    }

    // File validation - only oferta is required
    if (ofertaFiles.length === 0) {
      errors.push(tr("Offer File", "Archivo de Oferta"));
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
          ? tr(
              `Please complete the following field: ${validationErrors[0]}`,
              `Falta completar el siguiente campo: ${validationErrors[0]}`
            )
          : tr(
              `Please complete the following fields:\n• ${validationErrors.join(
                "\n• "
              )}`,
              `Faltan completar los siguientes campos:\n• ${validationErrors.join(
                "\n• "
              )}`
            );

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
      // Supplier tax ID (legacy single-field)
      formData.append("nitProveedor", nitProveedor || "");
      formData.append("esExtranjero", esExtranjero ? "true" : "false");
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
      setUploadStage(
        tr(
          `Uploading ${totalFiles} file${totalFiles !== 1 ? "s" : ""}...`,
          `Subiendo ${totalFiles} archivo${totalFiles !== 1 ? "s" : ""}...`
        )
      );

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
            setUploadStage(
              tr(
                `Uploading files... ${newPercent}%`,
                `Subiendo archivos... ${newPercent}%`
              )
            );
          }
        },
      });

      // Ensure we smoothly reach 90% if we haven't already
      if (uploadProgressRef.current < 90) {
        for (let i = uploadProgressRef.current; i <= 90; i += 5) {
          setUploadProgress(i);
          setUploadStage(tr(`Uploading files... ${i}%`, `Subiendo archivos... ${i}%`));
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Upload completed, now processing on server
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(95);
      setUploadStage(
        tr(
          "Processing contract on the server...",
          "Procesando contrato en el servidor..."
        )
      );
      
      // Small delay to show processing state
      await new Promise(resolve => setTimeout(resolve, 400));
      
      // All done!
      setUploadStage(
        tr("Contract created successfully!", "¡Contrato creado exitosamente!")
      );
      setUploadProgress(100);
      
      // Small delay to show completion before hiding
      setTimeout(() => {
        setShowSuccess(true);
        setUploadProgress(0);
        setUploadStage("");
      }, 800);
      
      addNotification(
        tr("Contract submitted successfully", "Contrato enviado correctamente"),
        "success"
      );
    } catch (error) {
      console.error("❌ Contract creation failed:", error);
      console.error("❌ Error status:", error.response?.status);
      console.error("❌ Error message:", error.response?.data?.error || error.message);

      const serverMessage = error.response?.data?.error;
      setError(
        serverMessage ||
          error.message ||
          tr(
            "An error occurred while creating the contract",
            "Ocurrió un error al crear el contrato"
          )
      );
      
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
            {tr("Contract submitted successfully!", "¡Contrato enviado correctamente!")}
          </h2>
          <p className="mb-4">
            {tr(
              "Your contract has been registered and is in progress.",
              "Tu contrato ha sido registrado y está en proceso."
            )}
          </p>
          <button
            className="bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors duration-200"
            onClick={() => navigate("/my_contracts")}
          >
            {tr('Go to "My contracts"', 'Ir a "Mis contratos"')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="contract-form-header mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
          {tr("Create a new contract", "Crear un nuevo contrato")}
        </h1>
        <p className="text-muted-foreground text-lg">
          {tr(
            "Complete the following details to create a new contract.",
            "Completa los siguientes datos para crear un nuevo contrato."
          )}
        </p>
      </div>

      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-card p-8 shadow-2xl backdrop-blur-lg">
        <form
          onSubmit={handleSubmit}
          className="space-y-8"
          aria-label={tr("Contract form", "Formulario de contrato")}
        >
          {error && (
            <Alert className="animate-fade-in" variant="destructive">
              <AlertTitle className="font-semibold mb-2">
                ❌ {tr("Validation error:", "Error de validación:")}
              </AlertTitle>
              <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
            </Alert>
          )}
          {!hasAttemptedSubmit && (
            <>
            <div
              className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm text-blue-700 dark:text-blue-300"
              role="alert"
            >
              <div className="flex items-center gap-2 font-semibold mb-2">
                <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-blue-100 text-blue-700 text-xl">ℹ️</span>
                <span>{tr("Information:", "Información:")}</span>
              </div>
              <div>
                {tr(
                  "Complete all fields to create the contract. Fields with errors will be shown in red.",
                  "Completa todos los campos para crear el contrato. Los campos con errores se mostrarán en rojo."
                )}
              </div>
            </div>
            {/* removed the top 'What to put here?' helper per request */}
            </>
          )}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="relative">
              <Label htmlFor="tipoSolicitud" className="mb-1 text-foreground">
                {tr("Request Type", "Tipo de Solicitud")}
              </Label>
              <Input
                className="bg-muted text-foreground border-input"
                id="tipoSolicitud"
                type="text"
                value={tr("Contract", "Contrato")}
                readOnly
                placeholder={tr("Contract", "Contrato")}
              />
            </div>
            <div className="relative">
              <Label htmlFor="tipoContrato" className="mb-1 text-foreground">
                {tr("Contract Type", "Tipo de Contrato")}
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
                    hasFieldError(tr("Contract Type", "Tipo de Contrato"))
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                >
                  <SelectValue placeholder={tr("Contract Type", "Tipo de Contrato")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{tr("Contract Type", "Tipo de Contrato")}</SelectLabel>
                    {tipoContratoOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {language === "en" ? option.labelEn : option.labelEs}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              {hasFieldError(tr("Contract Type", "Tipo de Contrato")) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2" ref={descriptionRef}>
              <Label htmlFor="descripcion" className="text-foreground">
                {tr("Description", "Descripción")}
              </Label>
              <div
                className="relative cursor-pointer"
                onClick={() => setShowDescriptionAlert(!showDescriptionAlert)}
              >
                <Textarea
                  className={`bg-background text-foreground border-input ${
                    hasFieldError(tr("Description", "Descripción"))
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => {
                    setDescripcion(e.target.value);
                    clearErrorsOnInput();
                  }}
                  placeholder={tr("Contract description", "Descripción del contrato")}
                  rows={4}
                />
                <div className="absolute inset-0 pointer-events-none" />
              </div>
              {hasFieldError(tr("Description", "Descripción")) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                </p>
              )}
              {showDescriptionAlert && (
                <div className="mt-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => setShowDescriptionAlert(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDescriptionAlert(false); }}
                    className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm text-blue-700 dark:text-blue-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 font-semibold mb-2">
                      <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-blue-100 text-blue-700 text-xl">ℹ️</span>
                      <span className="text-sm font-semibold text-blue-700">{tr("Information:", "Información:")}</span>
                    </div>
                    <div className="font-bold text-lg mb-3">
                      {tr(
                        "Contract purpose description",
                        "Descripción del objeto del contrato"
                      )}
                    </div>
                    <div className="space-y-3 text-foreground">
                      <p>
                        {tr(
                          "In this field, clearly and in detail explain the purpose of the contract. Include:",
                          "En este campo debe indicar, de manera clara y detallada, cuál es la finalidad del contrato. Procure incluir:"
                        )}
                      </p>
                      <div className="space-y-2">
                        <p>
                          <span className="font-bold">{tr("Main purpose:", "Objeto o propósito principal:")}</span>{" "}
                          {tr(
                            "Explain which service, product, or activity will be delivered.",
                            "Explique qué servicio, bien o actividad se va a realizar o entregar."
                          )}
                        </p>
                        <p>
                          <span className="font-bold">{tr("Scope:", "Alcance:")}</span>{" "}
                          {tr(
                            "Specify what is included and excluded to avoid misunderstandings.",
                            "Especifique qué incluye y qué no incluye el contrato, para evitar dudas o interpretaciones posteriores."
                          )}
                        </p>
                        <p>
                          <span className="font-bold">{tr("Deliverables and deadlines:", "Entregables y plazos:")}</span>{" "}
                          {tr(
                            "Describe expected results with delivery dates and key milestones.",
                            "Describa los productos, servicios o resultados esperados, señalando fechas de entrega o hitos relevantes."
                          )}
                        </p>
                        <p>
                          <span className="font-bold">{tr("Other relevant details:", "Otros aspectos relevantes:")}</span>{" "}
                          {tr(
                            "Add any extra information to clarify execution conditions, limits, and requirements.",
                            "Toda información adicional que ayude a precisar cómo debe ejecutarse la obligación (condiciones, limitaciones, requisitos, etc.)."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="nombreSolicitante" className="text-foreground">
                {tr("Requester", "Solicitante")}
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError(tr("Requester", "Solicitante"))
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
                placeholder={tr("Requester name", "Nombre del solicitante")}
              />
              {hasFieldError(tr("Requester", "Solicitante")) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <div className="rounded-md border border-border/60 bg-background/70 px-3 py-3">
                <Label className="text-foreground cursor-pointer">
                  {tr(
                    "Is the supplier or client foreign?",
                    "¿El proveedor o cliente es extranjero?"
                  )}
                </Label>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      id="esExtranjeroSi"
                      type="radio"
                      name="esExtranjero"
                      checked={esExtranjero}
                      onChange={() => {
                        setEsExtranjero(true);
                        clearErrorsOnInput();
                      }}
                      className="h-4 w-4 border-border text-primary focus:ring-primary"
                    />
                    <span>{tr("Yes", "Sí")}</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      id="esExtranjeroNo"
                      type="radio"
                      name="esExtranjero"
                      checked={!esExtranjero}
                      onChange={() => {
                        setEsExtranjero(false);
                        clearErrorsOnInput();
                      }}
                      className="h-4 w-4 border-border text-primary focus:ring-primary"
                    />
                    <span>{tr("No", "No")}</span>
                  </label>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {tr(
                    "This selection is saved and shown in contract details.",
                    "Esta selección se guarda y se muestra en los detalles del contrato."
                  )}
                </p>
              </div>
            </div>
          </div>
          {/* Section 2: Details */}
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="area" className="text-foreground">
                {tr("Area", "Área")}
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError(tr("Area", "Área"))
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
                placeholder={tr("Requester area", "Área del solicitante")}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasFieldError(tr("Area", "Área")) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="gerenteArea" className="text-foreground">
                {tr("Area Manager", "Gerente del Área")}
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError(tr("Area Manager", "Gerente del Área"))
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
                placeholder={tr("Manager name", "Nombre del gerente")}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasFieldError(tr("Area Manager", "Gerente del Área")) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor" className="text-foreground">
                {tr("Supplier / Client", "Proveedor / Cliente")}
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError(tr("Supplier / Client", "Proveedor / Cliente"))
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
                placeholder={tr("Supplier or client name", "Nombre del proveedor o cliente")}
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {hasFieldError(tr("Supplier / Client", "Proveedor / Cliente")) && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                </p>
              )}
            </div>
            <div className="grid gap-4 md:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="nitProveedor" className="text-foreground">
                  {tr("Identity Document", "Documento de identidad")}
                </Label>
                <div className="relative">
                  <Input
                    className={`bg-background text-foreground border-input ${
                      hasFieldError(tr("Tax ID (NIT)", "Registro Tributario (NIT)")) ? "border-red-500 focus:ring-red-500" : ""
                    }`}
                    id="nitProveedor"
                    type="text"
                    value={nitProveedor}
                    onChange={(e) => {
                      setNitProveedor(e.target.value);
                      clearErrorsOnInput();
                    }}
                    onClick={() => setShowDocumentInfo((s) => !s)}
                    placeholder={tr("Enter supplier identity document", "Ingrese documento proveedor/cliente")}
                    maxLength={60}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                  <div className="absolute inset-0 pointer-events-none" />
                </div>
                {showDocumentInfo && (
                  <div className="mt-4">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowDocumentInfo(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowDocumentInfo(false); }}
                        className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm text-blue-700 dark:text-blue-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-semibold mb-2">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-blue-100 text-blue-700 text-xl">ℹ️</span>
                        <span className="text-sm font-semibold text-blue-700">{tr("Information:", "Información:")}</span>
                      </div>
                      <div className="text-sm text-foreground">
                        {tr(
                          "You may register any official identity document or valid fiscal registration for the client or supplier.",
                          "Puede registrar cualquier documento de identificación oficial o registro fiscal válido para el cliente o proveedor."
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              {tr("Financial Information", "Información Financiera")}
            </h3>
            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tipoValor" className="text-foreground">
                  {tr("Value type", "Tipo de valor")}
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
                    <SelectValue placeholder={tr("Select", "Seleccione")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tr("Value type", "Tipo de valor")}</SelectLabel>
                      <SelectItem value="determinado">{tr("Determined", "Determinado")}</SelectItem>
                      <SelectItem value="indeterminado">{tr("Undetermined", "Indeterminado")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {valorIndeterminado
                    ? tr(
                        "The contract will be registered with an undetermined value.",
                        "El contrato se registrará con valor indeterminado."
                      )
                    : tr(
                        "Select whether the value is determined or undetermined.",
                        "Seleccione si el valor es determinado o indeterminado."
                      )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valorSinIVA" className="text-foreground">
                  {tr("Total contract value", "Valor total del contrato")}
                </Label>
                <Input
                  className={`bg-background text-foreground border-input ${
                    hasFieldError(tr("Total Contract Value", "Valor Total del Contrato"))
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="valorSinIVA"
                  type="text"
                  value={valorIndeterminado ? tr("Undetermined", "Indeterminado") : valorSinIVA}
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
                  placeholder={tr("Enter the total contract value", "Ingrese el valor total del contrato")}
                  disabled={valorIndeterminado}
                />
                {hasFieldError(tr("Total Contract Value", "Valor Total del Contrato")) && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {tr(
                      "This field is required and must be greater than 0",
                      "Este campo es obligatorio y debe ser mayor a 0"
                    )}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-1" />
            </div>
            <div className="grid gap-6 md:grid-cols-3 md:pt-2">
              <div className="space-y-2">
                <Label htmlFor="moneda" className="text-foreground">
                  {tr("Currency", "Moneda")}
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
                      hasFieldError(tr("Currency", "Moneda"))
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                  >
                    <SelectValue placeholder={tr("Currency", "Moneda")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tr("Currency", "Moneda")}</SelectLabel>
                      {monedaOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {hasFieldError(tr("Currency", "Moneda")) && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="porcentajeIVA" className="text-foreground">
                  {tr("VAT Percentage", "Porcentaje de IVA")}
                </Label>
                <Select
                  value={porcentajeIVA.toString()}
                  onValueChange={(value) => setPorcentajeIVA(Number(value))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={tr("Select VAT percentage", "Selecciona el porcentaje de IVA")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{tr("VAT Percentage", "Porcentaje de IVA")}</SelectLabel>
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
                  {tr("VAT Value (Calculated)", "Valor del IVA (Calculado)")}
                </Label>
                <Input
                  className="bg-muted text-foreground border-input"
                  id="valorIVA"
                  type="text"
                  value={valorIVA.toLocaleString(language === "en" ? "en-US" : "es-CO", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                  readOnly
                  placeholder={tr("VAT value", "Valor del IVA")}
                />
              </div>
              <div className="space-y-2 md:col-span-2" ref={formaPagoRef}>
                <Label htmlFor="formaPago" className="text-foreground">
                  {tr("Payment Terms", "Forma de Pago")}
                </Label>
                <div
                  className="relative cursor-pointer"
                  onClick={() => setShowFormaPagoAlert(!showFormaPagoAlert)}
                >
                  <Textarea
                    className={`bg-background text-foreground border-input ${
                      hasFieldError(tr("Payment Terms", "Forma de Pago"))
                        ? "border-red-500 focus:ring-red-500"
                        : ""
                    }`}
                    id="formaPago"
                    value={formaPago}
                    onChange={(e) => {
                      setFormaPago(e.target.value);
                      clearErrorsOnInput();
                    }}
                    placeholder={tr(
                      "E.g.: 50% at start and 50% upon final delivery",
                      "Ej: 50% al inicio y 50% contra entrega final del servicio"
                    )}
                    rows={3}
                  />
                  <div className="absolute inset-0 pointer-events-none" />
                </div>
                {hasFieldError(tr("Payment Terms", "Forma de Pago")) && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                  </p>
                )}
                {showFormaPagoAlert && (
                  <div className="mt-4">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setShowFormaPagoAlert(false)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowFormaPagoAlert(false); }}
                      className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 text-sm text-blue-700 dark:text-blue-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 font-semibold mb-2">
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-md bg-blue-100 text-blue-700 text-xl">ℹ️</span>
                        <span className="text-sm font-semibold text-blue-700">{tr("Information:", "Información:")}</span>
                      </div>
                      <div className="font-bold text-lg mb-3">{tr("Payment Terms", "Forma de Pago")}</div>
                      <div className="space-y-3 text-foreground">
                        <p>
                          {tr(
                            "Describe how and when payment will be made to the contractor or supplier. Include deadlines, percentages, and agreed conditions.",
                            "Indique cómo y cuándo se realizará el pago al contratista o proveedor. Especifique los plazos, porcentajes y condiciones acordadas."
                          )}
                        </p>
                        <div className="space-y-2">
                          <p className="font-semibold">{tr("Examples:", "Ejemplos:")}</p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              {tr(
                                '"50% at the beginning and 50% upon final service delivery."',
                                '"50% al inicio y 50% contra entrega final del servicio."'
                              )}
                            </li>
                            <li>
                              {tr(
                                '"Monthly payment within the first 10 business days of each month, after invoice submission."',
                                '"Pago mensual dentro de los primeros 10 días hábiles de cada mes, previa presentación de factura."'
                              )}
                            </li>
                            <li>
                              {tr(
                                '"A single payment within 30 days after delivery and acceptance of the product."',
                                '"Un único pago dentro de los 30 días siguientes a la entrega y aceptación del producto."'
                              )}
                            </li>
                          </ul>
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                          <p className="text-sm">
                            <span className="font-bold">{tr("Recommendation:", "Recomendación:")}</span>{" "}
                            {tr(
                              'Use clear language and avoid vague terms like "as agreed" or "to be defined". If retention or special conditions apply (advance payment, milestones, conditional payments), describe them briefly.',
                              'Use términos simples y evite expresiones generales como "según acuerdo" o "por definir". Si aplica retención o condiciones especiales (por ejemplo, anticipo, hitos de entrega o pagos condicionados), descríbalos brevemente.'
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 4: Date Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              {tr("Contract term", "Vigencia del contrato")}
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-foreground">
                  {tr("Contract start date", "Fecha de Inicio del contrato")}
                </Label>
                <div
                  className={`${
                    hasFieldError(tr("Start Date", "Fecha de Inicio"))
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
                {hasFieldError(tr("Start Date", "Fecha de Inicio")) && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                  </p>
                )}
                {dateError && (
                  <p className="text-red-500 text-xs mt-1">{dateError}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fechaFinal" className="text-foreground">
                  {tr("End date", "Fecha Final")}
                </Label>
                <div
                  className={`${
                    hasFieldError(tr("End Date", "Fecha Final"))
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
                {hasFieldError(tr("End Date", "Fecha Final")) && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {tr("This field is required", "Este campo es obligatorio")}
                  </p>
                )}
                {dateError && (
                  <p className="text-red-500 text-xs mt-1">{dateError}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="duracion" className="text-foreground">
                  {tr("Duration (days)", "Duración (días)")}
                </Label>
                <Input
                  className={`bg-background text-foreground border-input ${
                    hasFieldError(tr("Duration", "Duración"))
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="duracion"
                  type="number"
                  value={duracion}
                  readOnly
                />
                {hasFieldError(tr("Duration", "Duración")) && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {tr(
                      "Duration must be greater than 0 days",
                      "La duración debe ser mayor a 0 días"
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 5: File Uploads */}
          {tipoSolicitud === "contrato" && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                {tr("Contract files", "Archivos del Contrato")}
              </h3>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Sección Contrato */}
                <div className="space-y-2">
                  <Label
                    htmlFor="contractFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> {tr("Attach", "Adjunta")}
                    {" "}{tr("the Contract", "el Contrato")} (PDF, DOC, DOCX) <Badge className={getBadgeClasses('optional')}>{tr("Optional", "Opcional")}</Badge>
                  </Label>
                  <DropFile onFileSelect={setContractFiles} multiple accept=".pdf,.doc,.docx"/>
                  {contractFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {tr(
                        `${contractFiles.length} contract file(s) selected`,
                        `${contractFiles.length} archivo(s) de contrato seleccionado(s)`
                      )}
                    </div>
                  )}
                </div>

                {/* Sección Oferta */}
                <div className="space-y-2">
                  <Label
                    htmlFor="ofertaFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> {tr("Attach", "Adjunta")}
                    {" "}{tr("the Offer", "la Oferta")} (PDF, DOC, DOCX) <Badge className={getBadgeClasses('required')}>{tr("Required", "Obligatorio")}</Badge>
                  </Label>
                  <DropFile onFileSelect={setOfertaFiles} multiple accept=".pdf,.doc,.docx"/>
                  {ofertaFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {tr(
                        `${ofertaFiles.length} offer file(s) selected`,
                        `${ofertaFiles.length} archivo(s) de oferta seleccionado(s)`
                      )}
                    </div>
                  )}
                </div>

                {/* Sección Cámara de Comercio */}
                <div className="space-y-2">
                  <Label
                    htmlFor="camaraFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> {tr("Attach", "Adjunta")}
                    {" "}{tr("Chamber of Commerce / CAF", "Cámara de Comercio / CAF")} (PDF, DOC, DOCX) <Badge className={getBadgeClasses('optional')}>{tr("Optional", "Opcional")}</Badge>
                  </Label>
                  <DropFile onFileSelect={setCamaraFiles} multiple accept=".pdf,.doc,.docx"/>
                  {camaraFiles.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {tr(
                        `${camaraFiles.length} chamber file(s) selected`,
                        `${camaraFiles.length} archivo(s) de cámara seleccionado(s)`
                      )}
                    </div>
                  )}
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="otrosFiles"
                    className="text-foreground flex items-center gap-2"
                  >
                    <IconUpload size={18} className="text-blue-500" /> {tr("Other", "Otros")}
                    {tr(
                      "documents (PDF DOC DOCX, you can attach multiple files)",
                      "documentos (PDF DOC DOCX, puedes adjuntar varios)"
                    )} <Badge className={getBadgeClasses('optional')}>{tr("Optional", "Opcional")}</Badge>
                  </Label>
                  <input
                    id="otrosFiles"
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
                    className="sr-only"
                  />
                  <label
                    htmlFor="otrosFiles"
                    className="inline-flex cursor-pointer items-center rounded-md bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    {tr("Select files", "Seleccionar archivos")}
                  </label>
                  <span className="ml-3 text-sm text-muted-foreground">
                    {otrosFiles.length > 0
                      ? tr(`${otrosFiles.length} file(s) selected`, `${otrosFiles.length} archivo(s) seleccionado(s)`)
                      : tr("No files selected", "Ningún archivo seleccionado")}
                  </span>
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
                            {tr("Remove", "Quitar")}
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
              {tr("Cancel", "Cancelar")}
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
              {loading
                ? tr("Submitting...", "Enviando...")
                : tr("Create Contract", "Crear Contrato")}
            </Button>
          </div>
        </form>
        {hasAttemptedSubmit && !isFormValid() && (
          <p className="text-red-500 text-xs mt-2 text-right">
            ⚠️ {tr(
              "Complete all required fields to continue",
              "Completa todos los campos obligatorios para continuar"
            )}
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
                ? tr('Uploading files...', 'Subiendo archivos...') 
                : uploadProgress < 100 
                  ? tr('Processing...', 'Procesando...') 
                  : tr('Completed!', '¡Completado!')}
            </p>
            <p className="text-xs font-medium text-foreground">
              {uploadProgress}%
            </p>
          </div>
          
          {/* File count info */}
          {(contractFiles.length + ofertaFiles.length + camaraFiles.length + otrosFiles.length) > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {tr(
                  `${contractFiles.length + ofertaFiles.length + camaraFiles.length + otrosFiles.length} total file(s)`,
                  `${contractFiles.length + ofertaFiles.length + camaraFiles.length + otrosFiles.length} archivo(s) total`
                )}
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
