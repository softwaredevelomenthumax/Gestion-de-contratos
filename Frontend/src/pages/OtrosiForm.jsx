import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosInstance";
import {
  IconFileText,
  IconCurrencyDollar,
  IconCalendar,
  IconUpload,
  IconArrowLeft,
  IconInfoCircle,
  IconAlertTriangle,
  IconCheck,
  IconEdit,
  IconPlus,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import LottieAnimation from "../components/LottieAnimation";
import sendAnimation from "../assets/animations/send.json";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";

const OtrosiForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addNotification } = useNotification();

  // Estados del formulario
  const [formData, setFormData] = useState({
    descripcionCambios: "",
    valorTotal: "",
    moneda: "COP",
    porcentajeIVA: 19, // 19% preseleccionado por defecto
    valorIVA: "",
    formaPago: "",
    fechaInicio: "",
    fechaFinal: "",
    cartaSolicitud: null,
    firmarOtrosi: null,
    enviarOtrosi: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contract, setContract] = useState(null);
  
  // Upload progress states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState("");
  const uploadProgressRef = React.useRef(0);
  const lastUpdateTimeRef = React.useRef(0);

  // Monedas disponibles
  const monedas = ["COP", "MXN", "USD", "EUR"];

  // Porcentajes de IVA disponibles
  const porcentajesIVA = Array.from({ length: 26 }, (_, i) => i);

  // Calcular IVA automáticamente
  useEffect(() => {
    if (formData.valorTotal && formData.porcentajeIVA !== null) {
      const valor = parseFloat(formData.valorTotal);
      const porcentaje = parseFloat(formData.porcentajeIVA);
      const iva = (valor * porcentaje) / 100;
      setFormData((prev) => ({
        ...prev,
        valorIVA: iva.toFixed(2),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        valorIVA: "",
      }));
    }
  }, [formData.valorTotal, formData.porcentajeIVA]);

  // Calcular duración del contrato automáticamente
  const calcularDuracion = () => {
    if (formData.fechaInicio && formData.fechaFinal) {
      const fechaInicio = new Date(formData.fechaInicio);
      const fechaFinal = new Date(formData.fechaFinal);

      if (fechaInicio < fechaFinal) {
        const diferenciaTiempo = fechaFinal.getTime() - fechaInicio.getTime();
        const diferenciaDias = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));

        // Calcular años, meses y días
        const años = Math.floor(diferenciaDias / 365);
        const mesesRestantes = Math.floor((diferenciaDias % 365) / 30);
        const diasRestantes = diferenciaDias % 30;

        let duracionTexto = "";
        if (años > 0) duracionTexto += `${años} año${años > 1 ? "s" : ""}`;
        if (mesesRestantes > 0) {
          if (duracionTexto) duracionTexto += ", ";
          duracionTexto += `${mesesRestantes} mes${
            mesesRestantes > 1 ? "es" : ""
          }`;
        }
        if (diasRestantes > 0) {
          if (duracionTexto) duracionTexto += " y ";
          duracionTexto += `${diasRestantes} día${
            diasRestantes > 1 ? "s" : ""
          }`;
        }

        return duracionTexto || "Menos de 1 día";
      }
    }
    return null;
  };

  // Cargar información del contrato
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await api.get(`/contracts/${id}`);
        if (response && response.data) {
          const contractData = response.data;
          setContract(contractData);
        } else {
          addNotification("Error al cargar el contrato", "error");
          navigate("/");
        }
      } catch (error) {
        console.error("Error fetching contract:", error);
        addNotification("Error al cargar el contrato", "error");
        navigate("/");
      }
    };

    fetchContract();
  }, [id, navigate, addNotification]);

  // Validar solo números en valor total
  const handleValorTotalChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+(\.\d{0,2})?$/.test(value)) {
      setFormData((prev) => ({ ...prev, valorTotal: value }));
    }
  };

  // Manejar cambio de archivo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setFormData((prev) => ({ ...prev, cartaSolicitud: file }));
        setErrors((prev) => ({ ...prev, cartaSolicitud: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          cartaSolicitud: "Solo se permiten archivos PDF",
        }));
        setFormData((prev) => ({ ...prev, cartaSolicitud: null }));
      }
    }
  };

  // Manejar cambio de archivo para firmar otrosí
  const handleFirmarOtrosiChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setFormData((prev) => ({ ...prev, firmarOtrosi: file }));
        setErrors((prev) => ({ ...prev, firmarOtrosi: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          firmarOtrosi: "Solo se permiten archivos PDF",
        }));
        setFormData((prev) => ({ ...prev, firmarOtrosi: null }));
      }
    }
  };

  // Manejar cambio de archivo para enviar otrosí sin firma
  const handleEnviarOtrosiChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type === "application/pdf") {
        setFormData((prev) => ({ ...prev, enviarOtrosi: file }));
        setErrors((prev) => ({ ...prev, enviarOtrosi: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          enviarOtrosi: "Solo se permiten archivos PDF",
        }));
        setFormData((prev) => ({ ...prev, enviarOtrosi: null }));
      }
    }
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.descripcionCambios.trim()) {
      newErrors.descripcionCambios =
        "La descripción de los cambios es obligatoria";
    }

    // Validar que al menos una fecha esté seleccionada si se ingresan fechas
    if (formData.fechaInicio && formData.fechaFinal) {
      const fechaInicio = new Date(formData.fechaInicio);
      const fechaFinal = new Date(formData.fechaFinal);
      if (fechaInicio >= fechaFinal) {
        newErrors.fechas =
          "La fecha de inicio debe ser anterior a la fecha final";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      addNotification(
        "Por favor, corrige los errores en el formulario",
        "error"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("contractId", id); // Add contractId to form data
      formDataToSend.append("descripcionCambios", formData.descripcionCambios);
      formDataToSend.append("valorTotal", formData.valorTotal || "");
      formDataToSend.append("moneda", formData.moneda);
      formDataToSend.append("porcentajeIVA", formData.porcentajeIVA);
      formDataToSend.append("valorIVA", formData.valorIVA || "");
      formDataToSend.append("formaPago", formData.formaPago);
      formDataToSend.append("fechaInicio", formData.fechaInicio || "");
      formDataToSend.append("fechaFinal", formData.fechaFinal || "");
      if (formData.cartaSolicitud) {
        formDataToSend.append("cartaSolicitud", formData.cartaSolicitud);
      }
      if (formData.firmarOtrosi) {
        formDataToSend.append("firmarOtrosi", formData.firmarOtrosi);
      }
      if (formData.enviarOtrosi) {
        formDataToSend.append("enviarOtrosi", formData.enviarOtrosi);
      }

      // Count files for progress tracking
      const fileCount = [
        formData.cartaSolicitud,
        formData.firmarOtrosi,
        formData.enviarOtrosi
      ].filter(Boolean).length;

      // Reset progress tracking
      uploadProgressRef.current = 0;
      lastUpdateTimeRef.current = Date.now();
      setUploadProgress(0);
      setUploadStage(`Subiendo ${fileCount} archivo${fileCount !== 1 ? 's' : ''}...`);

      const response = await api.post("/otrosi", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          // Cap progress at 90% during upload phase
          const targetPercent = Math.round(
            (progressEvent.loaded * 90) / progressEvent.total
          );
          
          // Throttle updates (minimum 100ms between updates)
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
      
      // Processing on server
      await new Promise(resolve => setTimeout(resolve, 200));
      setUploadProgress(95);
      setUploadStage("Procesando otrosí en el servidor...");
      
      await new Promise(resolve => setTimeout(resolve, 400));
      setUploadProgress(100);
      setUploadStage("¡Otrosí creado exitosamente!");

      if (response && response.data) {
        const result = response.data;
        addNotification(
          `Otrosí creado exitosamente: ${result.message}`,
          "success"
        );
        // Navigate based on user role
        if (user?.role === "lawyer") {
          navigate(`/lawyer/contracts/${id}`);
        } else {
          navigate(`/user/contracts/${id}`);
        }
      } else {
        addNotification("Error al enviar el otrosí", "error");
      }
    } catch (error) {
      console.error("Error submitting otrosi:", error);
      addNotification("Error al enviar el otrosí", "error");
      
      // Reset progress on error
      setUploadProgress(0);
      setUploadStage("");
      uploadProgressRef.current = 0;
      lastUpdateTimeRef.current = 0;
    } finally {
      setIsSubmitting(false);
      
      // Reset progress after success
      setTimeout(() => {
        setUploadProgress(0);
        setUploadStage("");
      }, 1000);
    }
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="contract-form-header mb-8 text-center">
        <Button
          onClick={() => {
            // Navigate based on user role
            if (user?.role === "lawyer") {
              navigate(`/lawyer/contracts/${id}`);
            } else {
              navigate(`/user/contracts/${id}`);
            }
          }}
          variant="ghost"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <IconArrowLeft size={20} />
        </Button>

        <h1 className="text-4xl font-extrabold text-foreground mb-2 tracking-tight">
          Solicitud de Otrosí
        </h1>
        <p className="text-muted-foreground text-lg mb-4">
          Modifica los términos del contrato existente.
        </p>
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <Badge variant="outline">Contrato #{contract.id}</Badge>
          <span>•</span>
          <span>{contract.proveedor}</span>
        </div>
      </div>

      <div className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-card p-8 shadow-2xl backdrop-blur-lg">
        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Descripción de cambios */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Descripción de los Cambios
            </h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="descripcionCambios" className="text-foreground">
                  Describir los cambios que requiere el contrato
                </Label>
                <Textarea
                  id="descripcionCambios"
                  value={formData.descripcionCambios}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      descripcionCambios: e.target.value,
                    }));
                    if (errors.descripcionCambios) {
                      setErrors((prev) => ({
                        ...prev,
                        descripcionCambios: "",
                      }));
                    }
                  }}
                  rows={6}
                  className={`bg-background text-foreground border-input ${
                    errors.descripcionCambios
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                  placeholder="Describe detalladamente todos los cambios que requiere el contrato..."
                />
                {errors.descripcionCambios && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {errors.descripcionCambios}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cambios en información financiera */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Información Financiera
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="valorTotal" className="text-foreground">
                  Valor Total Del Contrato
                </Label>
                <Input
                  id="valorTotal"
                  type="text"
                  value={formData.valorTotal}
                  onChange={handleValorTotalChange}
                  className="bg-background text-foreground border-input"
                  placeholder="Ingrese el valor total del contrato"
                />
                <div className="text-xs text-muted-foreground">
                  Solo números permitidos
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneda" className="text-foreground">
                  Moneda
                </Label>
                <Select
                  value={formData.moneda}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, moneda: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monedas.map((moneda) => (
                      <SelectItem key={moneda} value={moneda}>
                        {moneda}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="porcentajeIVA" className="text-foreground">
                  Porcentaje de IVA
                </Label>
                <Select
                  value={formData.porcentajeIVA.toString()}
                  onValueChange={(value) =>
                    setFormData((prev) => ({
                      ...prev,
                      porcentajeIVA: parseInt(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {porcentajesIVA.map((porcentaje) => (
                      <SelectItem
                        key={porcentaje}
                        value={porcentaje.toString()}
                      >
                        {porcentaje}%
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valorIVA" className="text-foreground">
                  Valor del IVA (Calculado)
                </Label>
                <Input
                  id="valorIVA"
                  type="text"
                  value={formData.valorIVA}
                  readOnly
                  className="bg-muted text-foreground border-input"
                  placeholder="Se calcula automáticamente"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="formaPago" className="text-foreground">
                  Forma de Pago
                </Label>
                <Input
                  id="formaPago"
                  type="text"
                  value={formData.formaPago}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      formaPago: e.target.value,
                    }))
                  }
                  className="bg-background text-foreground border-input"
                  placeholder="EJ: en un solo pago o en pagos periódicos (especificar)"
                />
              </div>
            </div>
          </div>

          {/* Cambios en vigencia del contrato */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Vigencia del Contrato
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fechaInicio" className="text-foreground">
                  Fecha de Inicio del Contrato
                </Label>
                <Input
                  id="fechaInicio"
                  type="date"
                  value={formData.fechaInicio}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaInicio: e.target.value,
                    }))
                  }
                  className="bg-background text-foreground border-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaFinal" className="text-foreground">
                  Fecha Final del Contrato
                </Label>
                <Input
                  id="fechaFinal"
                  type="date"
                  value={formData.fechaFinal}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaFinal: e.target.value,
                    }))
                  }
                  className="bg-background text-foreground border-input"
                />
              </div>
            </div>

            {/* Mostrar duración calculada */}
            {calcularDuracion() && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <h4 className="text-green-800 dark:text-green-200 font-semibold mb-2">
                  Nueva Duración del Contrato
                </h4>
                <p className="text-green-700 dark:text-green-100 text-lg font-medium">
                  {calcularDuracion()}
                </p>
                <p className="text-green-600 dark:text-green-300 text-sm mt-1">
                  Calculado automáticamente entre las fechas seleccionadas
                </p>
              </div>
            )}

            {errors.fechas && (
              <p className="text-red-500 text-xs mt-1">⚠️ {errors.fechas}</p>
            )}
          </div>

          {/* Archivos del Otrosí */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
              Archivos del Otrosí
            </h3>
            <div className="grid gap-6 md:grid-cols-1">
              <div className="space-y-2">
                <Label
                  htmlFor="cartaSolicitud"
                  className="text-foreground flex items-center gap-2"
                >
                  <IconUpload size={18} className="text-blue-500" />
                  Carta de Solicitud de Modificación (PDF)
                </Label>
                <div className="text-xs text-muted-foreground">(opcional)</div>
                <Input
                  id="cartaSolicitud"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className={`bg-background text-foreground border-input ${
                    errors.cartaSolicitud
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {formData.cartaSolicitud && (
                  <div className="text-sm text-muted-foreground">
                    Archivo seleccionado: {formData.cartaSolicitud.name} (
                    {(formData.cartaSolicitud.size / 1024 / 1024).toFixed(2)}{" "}
                    MB)
                  </div>
                )}
                {errors.cartaSolicitud && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {errors.cartaSolicitud}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="firmarOtrosi"
                  className="text-foreground flex items-center gap-2"
                >
                  <IconUpload size={18} className="text-blue-500" />
                  Enviar otrosi firmado (Adjuntar aquí solo si el documento ya tiene la firma del proveedor/cliente)
                </Label>
                <div className="text-xs text-muted-foreground">(opcional)</div>
                <Input
                  id="firmarOtrosi"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFirmarOtrosiChange}
                  className={`bg-background text-foreground border-input ${
                    errors.firmarOtrosi
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {formData.firmarOtrosi && (
                  <div className="text-sm text-muted-foreground">
                    Archivo seleccionado: {formData.firmarOtrosi.name} (
                    {(formData.firmarOtrosi.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                {errors.firmarOtrosi && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {errors.firmarOtrosi}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="enviarOtrosi"
                  className="text-foreground flex items-center gap-2"
                >
                  <IconUpload size={18} className="text-green-500" />
                  Enviar otrosí (Adjuntar aquí solo si el documento NO tiene la firma del proveedor/cliente)
                </Label>
                <div className="text-xs text-muted-foreground">(opcional)</div>
                <Input
                  id="enviarOtrosi"
                  type="file"
                  accept="application/pdf"
                  onChange={handleEnviarOtrosiChange}
                  className={`bg-background text-foreground border-input ${
                    errors.enviarOtrosi
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }`}
                />
                {formData.enviarOtrosi && (
                  <div className="text-sm text-muted-foreground">
                    Archivo seleccionado: {formData.enviarOtrosi.name} (
                    {(formData.enviarOtrosi.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                )}
                {errors.enviarOtrosi && (
                  <p className="text-red-500 text-xs mt-1">
                    ⚠️ {errors.enviarOtrosi}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              onClick={() => {
                // Navigate back based on user role
                if (user?.role === "lawyer") {
                  navigate(`/lawyer/contracts/${id}`);
                } else {
                  navigate(`/user/contracts/${id}`);
                }
              }}
              variant="outline"
              className="px-6 py-3 rounded-lg font-semibold shadow-lg transition"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 rounded-lg font-semibold shadow-lg transition disabled:opacity-50 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isSubmitting ? "Enviando..." : "Aplicar Otrosí"}
            </Button>
          </div>
        </form>
      </div>
      
      {/* Send Animation - Only appears when submitting */}
      {isSubmitting && (
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
      {isSubmitting && uploadProgress > 0 && (
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
        </div>
      )}
    </div>
  );
};

export default OtrosiForm;
