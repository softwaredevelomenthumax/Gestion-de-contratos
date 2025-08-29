import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";
import api from "../api/axiosInstance";
import Button from "./Button";
import DropFile from "./DropFile";
import { IconUpload } from "@tabler/icons-react";
import { createContract } from "../api/contracts";
import { DatePicker } from "./ui/date-picker";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
} from "./ui/select";

const tipoContratoOptions = [
  { value: "prestacion_de_servicios", label: "Prestación de servicios" },
  { value: "Compra de equipos", label: "Compra de equipos" },
  { value: "Obra_civil", label: "Obra civil" },
  { value: "Contrato suministro", label: "Contrato suministro" },
  {
    value: "Acuerdos_de_confidencialidad",
    label: "Acuerdos de confidencialidad",
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

const ContractForm = () => {
  const tipoSolicitud = "contrato";
  const [tipoContrato, setTipoContrato] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [nombreSolicitante, setNombreSolicitante] = useState("");
  const [area, setArea] = useState("");
  const [gerenteArea, setGerenteArea] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [nitProveedor, setNitProveedor] = useState("");
  const [formaPago, setFormaPago] = useState("");
  const [valorSinIVA, setValorSinIVA] = useState(0);
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
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();
  const { addNotification } = useNotification();
  const [otrosFiles, setOtrosFiles] = useState([]);
  const [dateError, setDateError] = useState("");
  const [showFieldErrors, setShowFieldErrors] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

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
      errors.push("Proveedor");
    }

    if (!nitProveedor || nitProveedor.trim() === "") {
      errors.push("NIT del Proveedor");
    } else if (!isValidNIT(nitProveedor)) {
      errors.push(
        "NIT del Proveedor (debe tener exactamente 9 caracteres alfanuméricos)"
      );
    }

    if (!formaPago || formaPago.trim() === "") {
      errors.push("Forma de Pago");
    }

    if (!valorSinIVA || valorSinIVA <= 0) {
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
      setShowFieldErrors(true);

      // Scroll to the top to show the error message
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowFieldErrors(false);
    setHasAttemptedSubmit(false);
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    try {
      const response = await createContract({
        tipoSolicitud,
        tipoContrato,
        descripcion,
        nombreSolicitante,
        area,
        gerenteArea,
        proveedor,
        nitProveedor,
        formaPago,
        valorSinIVA,
        porcentajeIVA,
        valorIVA,
        moneda,
        fechaInicio: fechaInicio ? fechaInicio.split("T")[0] : "",
        fechaFinal: fechaFinal ? fechaFinal.split("T")[0] : "",
        duracion,
        fechaIngreso: fechaIngreso ? fechaIngreso.split("T")[0] : "",
      });
      if (tipoSolicitud === "contrato") {
        // Subir archivos de contrato
        for (const file of contractFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "contrato");
          await api.post(`/contracts/${response.id}/files`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            },
          });
        }
        // Subir archivos de oferta
        for (const file of ofertaFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "oferta");
          await api.post(`/contracts/${response.id}/files`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }
        // Subir archivos de cámara
        for (const file of camaraFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "camara");
          await api.post(`/contracts/${response.id}/files`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }
        // Subir otros documentos
        for (const file of otrosFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("type", "otros");
          await api.post(`/contracts/${response.id}/files`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
        }
      }
      setShowSuccess(true);
      addNotification("Contrato enviado correctamente", "success");
    } catch (error) {
      setError(
        error.response?.data?.error || "Ocurrió un error al crear el contrato"
      );
    } finally {
      setLoading(false);
      setUploadProgress(0);
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
            <div
              className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-fade-in"
              role="alert"
            >
              <div className="font-semibold mb-2">❌ Error de validación:</div>
              <div className="whitespace-pre-line">{error}</div>
            </div>
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
          {loading && (
            <div className="w-full bg-muted rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="bg-primary h-3 animate-pulse"
                style={{
                  width: `${uploadProgress || 30}%`,
                  transition: "width 0.3s",
                }}
              />
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
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="descripcion" className="text-foreground">
                Descripción
              </Label>
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
              {hasFieldError("Descripción") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
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
              />
              {hasFieldError("Gerente del Área") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="proveedor" className="text-foreground">
                Proveedor
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("Proveedor")
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
                placeholder="Nombre del proveedor"
              />
              {hasFieldError("Proveedor") && (
                <p className="text-red-500 text-xs mt-1">
                  ⚠️ Este campo es obligatorio
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="nitProveedor" className="text-foreground">
                NIT del Proveedor
              </Label>
              <Input
                className={`bg-background text-foreground border-input ${
                  hasFieldError("NIT del Proveedor")
                    ? "border-red-500 focus:ring-red-500"
                    : ""
                }`}
                id="nitProveedor"
                type="text"
                value={nitProveedor}
                onChange={(e) => {
                  // Only allow alphanumeric characters and exactly 9 characters
                  const valor = e.target.value
                    .replace(/[^a-zA-Z0-9]/g, "")
                    .slice(0, 9);
                  setNitProveedor(valor);
                }}
                placeholder="NIT del proveedor (9 caracteres alfanuméricos)"
                maxLength={9}
              />
              <div className="text-xs text-muted-foreground">
                Debe tener exactamente 9 caracteres alfanuméricos (sin dígito de
                verificación)
              </div>
              {nitProveedor && nitProveedor.length !== 9 && (
                <p className="text-red-500 text-xs mt-1">
                  El NIT debe tener exactamente 9 caracteres (
                  {nitProveedor.length}/9)
                </p>
              )}
              {nitProveedor && !/^[a-zA-Z0-9]*$/.test(nitProveedor) && (
                <p className="text-red-500 text-xs mt-1">
                  Solo se permiten letras y números
                </p>
              )}
              {hasFieldError("NIT del Proveedor") && (
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
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorSinIVA" className="text-foreground">
                  Valor Total Del Contrato
                </Label>
                <Input
                  className={`bg-background text-foreground border-input ${
                    hasFieldError("Valor Total del Contrato")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="valorSinIVA"
                  type="text"
                  value={valorSinIVA}
                  onChange={(e) => {
                    // Solo permitir números y punto decimal
                    const valor = e.target.value.replace(/[^0-9.]/g, "");
                    // Evitar múltiples puntos decimales
                    const partes = valor.split(".");
                    const valorLimpio =
                      partes.length > 2
                        ? partes[0] + "." + partes.slice(1).join("")
                        : valor;
                    setValorSinIVA(Number(valorLimpio) || 0);
                    clearErrorsOnInput();
                  }}
                  placeholder="Ingrese el valor total del contrato"
                />
                {hasFieldError("Valor Total del Contrato") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio y debe ser mayor a 0
                  </p>
                )}
              </div>
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
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="formaPago" className="text-foreground">
                  Forma de Pago
                </Label>
                <Input
                  className={`bg-background text-foreground border-input ${
                    hasFieldError("Forma de Pago")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  id="formaPago"
                  type="text"
                  value={formaPago}
                  onChange={(e) => {
                    setFormaPago(e.target.value);
                    clearErrorsOnInput();
                  }}
                  placeholder="Forma de pago"
                />
                {hasFieldError("Forma de Pago") && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ Este campo es obligatorio
                  </p>
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
                    el Contrato (PDF)
                  </Label>
                  <DropFile onFileSelect={setContractFiles} multiple />
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
                    la Oferta (PDF)
                  </Label>
                  <DropFile onFileSelect={setOfertaFiles} multiple />
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
                    Cámara de Comercio / CAF (PDF)
                  </Label>
                  <DropFile onFileSelect={setCamaraFiles} multiple />
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
                    documentos (PDF, puedes adjuntar varios)
                  </Label>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files).filter(
                        (f) =>
                          f.type === "application/pdf" &&
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

          {uploadProgress > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-semibold shadow-lg transition disabled:opacity-50 ${
                hasAttemptedSubmit && !isFormValid()
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "bg-primary hover:bg-primary/90 text-primary-foreground"
              }`}
            >
              {loading ? "Creando..." : "Crear Contrato"}
            </Button>
            {hasAttemptedSubmit && !isFormValid() && (
              <p className="text-red-500 text-xs mt-2 text-right">
                ⚠️ Completa todos los campos obligatorios para continuar
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractForm;
//mover logica al backend
//borar solicitante 