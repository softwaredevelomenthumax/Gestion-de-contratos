import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contract, setContract] = useState(null);

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

  // Cargar información del contrato
  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/api/contracts/${id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.ok) {
          const contractData = await response.json();
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

      const response = await fetch(
        `http://localhost:3001/api/otrosi`,
        {
          method: "POST",
        headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
          body: formDataToSend,
        }
      );

      if (response.ok) {
        const result = await response.json();
        addNotification(`Otrosí creado exitosamente: ${result.message}`, "success");
        // Navigate based on user role
        if (user?.role === "lawyer") {
          navigate(`/lawyer/contracts/${id}`);
        } else {
          navigate(`/user/contracts/${id}`);
        }
      } else {
        const errorData = await response.json();
        addNotification(
          errorData.error || "Error al enviar el otrosí",
          "error"
        );
      }
    } catch (error) {
      console.error("Error submitting otrosi:", error);
      addNotification("Error al enviar el otrosí", "error");
    } finally {
      setIsSubmitting(false);
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
    <div className="min-h-screen bg-inherit py-12">
      <div className="max-w-5xl mx-auto px-6">
        {/* Creative Header with Black Theme */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/20 via-gray-700/20 to-gray-800/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-gradient-to-r from-gray-900/90 to-black/90 backdrop-blur-xl rounded-3xl p-8 border border-gray-800/50">
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
              className="absolute top-6 right-6 text-gray-300 hover:text-white hover:bg-gray-800/50 rounded-full p-2"
            >
              <IconArrowLeft size={20} />
            </Button>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-700 to-black rounded-2xl mb-6 shadow-2xl border border-gray-700">
                <IconEdit size={32} className="text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-200 via-white to-gray-300 bg-clip-text text-transparent mb-3">
                Solicitud de Otrosí
              </h1>
              <div className="flex items-center justify-center gap-4 text-gray-300">
                <Badge
                  variant="outline"
                  className="bg-gray-800/50 border-gray-600 text-gray-300"
                >
                  Contrato #{contract.id}
                </Badge>
                <span className="text-gray-500">•</span>
                <span className="text-gray-300">{contract.proveedor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Nota general sobre OtrosiFile */}
          <div className="p-4 bg-purple-900/20 border border-purple-700/30 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <IconInfoCircle size={20} className="text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-200">💾 Información sobre Almacenamiento de Archivos</h3>
            </div>
            <p className="text-purple-300 text-sm">
              <strong>Importante:</strong> Todos los archivos subidos en este formulario (carta de solicitud y firma del otrosí) 
              se guardarán en la tabla <strong>OtrosiFile</strong> específica para este otrosí, no en la tabla general de archivos del contrato. 
              Esto permite mantener una separación clara entre los archivos del contrato principal y los archivos relacionados con modificaciones (otrosí).
            </p>
          </div>
          {/* Descripción de cambios - Creative Card */}
          <div className="group">
            <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-gray-600/20 hover:border-gray-600/50">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-gray-800/5"></div>
                <CardTitle className="flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-r from-gray-700 to-black rounded-xl shadow-lg border border-gray-700">
                    <IconFileText size={24} className="text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                    Descripción de los Cambios
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 text-xs"
                  >
                    Obligatorio
                  </Badge>
          </CardTitle>
        </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div>
                  <Label
                    htmlFor="descripcionCambios"
                    className="text-gray-100 font-semibold flex items-center gap-2"
                  >
                    <IconEdit size={16} className="text-gray-400" />
                    Describir los cambios que requiere el contrato
                    <span className="text-red-400 ml-1">*</span>
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
                    className={`mt-3 bg-gray-800/30 text-white border-2 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200 ${
                      errors.descripcionCambios
                        ? "border-red-500/50"
                        : "border-gray-700/50"
                    }`}
                    placeholder="Describe detalladamente todos los cambios que requiere el contrato..."
                  />
                  {errors.descripcionCambios && (
                    <Alert
                      variant="destructive"
                      className="mt-3 border-red-500/30 bg-red-500/10"
                    >
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {errors.descripcionCambios}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>

          {/* Cambios en información financiera - Creative Grid */}
          <div className="group">
            <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-gray-600/20 hover:border-gray-600/50">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-gray-800/5"></div>
                <CardTitle className="flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-r from-gray-700 to-black rounded-xl shadow-lg border border-gray-700">
                    <IconCurrencyDollar size={24} className="text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                    Cambios en la Información Financiera
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 text-xs"
                  >
                    Opcional
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <Label
                      htmlFor="valorTotal"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconPlus size={16} className="text-gray-400" />
                      Valor total del contrato
                    </Label>
                  <Input
                    id="valorTotal"
                      type="text"
                    value={formData.valorTotal}
                      onChange={handleValorTotalChange}
                      className="mt-2 bg-gray-800/30 text-white border-2 border-gray-700/50 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                    placeholder="0.00"
                  />
                    <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                      <IconInfoCircle size={12} />
                      Solo números permitidos
                    </p>
                </div>

                <div className="space-y-2">
                    <Label
                      htmlFor="moneda"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconPlus size={16} className="text-gray-400" />
                      Moneda
                    </Label>
                    <Select
                    value={formData.moneda}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, moneda: value }))
                      }
                    >
                      <SelectTrigger className="mt-2 bg-gray-800/30 text-white border-2 border-gray-700/50 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {monedas.map((moneda) => (
                          <SelectItem
                            key={moneda}
                            value={moneda}
                            className="text-white hover:bg-gray-600"
                          >
                            {moneda}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label
                      htmlFor="porcentajeIVA"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconPlus size={16} className="text-gray-400" />
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
                      <SelectTrigger className="mt-2 bg-gray-800/30 text-white border-2 border-gray-700/50 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        {porcentajesIVA.map((porcentaje) => (
                          <SelectItem
                            key={porcentaje}
                            value={porcentaje.toString()}
                            className="text-white hover:bg-gray-600"
                          >
                            {porcentaje}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label
                      htmlFor="valorIVA"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconInfoCircle size={16} className="text-gray-400" />
                      Valor del IVA (calculado)
                    </Label>
                  <Input
                    id="valorIVA"
                      type="text"
                    value={formData.valorIVA}
                      readOnly
                      className="mt-2 bg-gray-700/30 text-gray-300 border-2 border-gray-700/50 cursor-not-allowed"
                      placeholder="Se calcula automáticamente"
                  />
              </div>

                  <div className="md:col-span-2 space-y-2">
                    <Label
                      htmlFor="formaPago"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconPlus size={16} className="text-gray-400" />
                      Forma de pago
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
                      className="mt-2 bg-gray-800/30 text-white border-2 border-gray-700/50 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                      placeholder="EJ: en un solo pago o en pagos periodicos (especificar)"
                />
              </div>
                </div>
              </CardContent>
            </Card>
            </div>

          {/* Cambios en vigencia - Creative Date Section */}
          <div className="group">
            <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-gray-600/20 hover:border-gray-600/50">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-gray-800/5"></div>
                <CardTitle className="flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-r from-gray-700 to-black rounded-xl shadow-lg border border-gray-700">
                    <IconCalendar size={24} className="text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                    Cambios en la Vigencia del Contrato
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 text-xs"
                  >
                    Opcional
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <Label
                      htmlFor="fechaInicio"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconCalendar size={16} className="text-gray-400" />
                      Fecha de inicio del contrato
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
                      className="mt-2 bg-gray-800/30 text-white border-2 border-gray-700/50 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  />
                </div>

                <div className="space-y-2">
                    <Label
                      htmlFor="fechaFinal"
                      className="text-gray-100 font-semibold flex items-center gap-2"
                    >
                      <IconCalendar size={16} className="text-gray-400" />
                      Fecha final del contrato
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
                      className="mt-2 bg-gray-800/30 text-white border-2 border-gray-700/50 focus:ring-2 focus:ring-gray-500/50 focus:border-gray-500/50 transition-all duration-200"
                  />
                </div>
              </div>

                <Alert className="border-gray-600/30 bg-gray-800/20 backdrop-blur-sm">
                  <IconInfoCircle className="h-4 w-4 text-gray-400" />
                  <AlertDescription className="text-gray-200">
                    <span className="text-gray-300 font-semibold">
                      Importante:
                    </span>{" "}
                    Introduzca solo la fecha que necesita modificar. Si solo
                    necesita modificar una de ellas, no es necesario ingresar
                    ambas. Si necesita modificar ambas, introduzca las dos
                    fechas (inicio y final).
                  </AlertDescription>
                </Alert>

                {errors.fechas && (
                  <Alert
                    variant="destructive"
                    className="mt-4 border-red-500/30 bg-red-500/10"
                  >
                    <IconAlertTriangle className="h-4 w-4" />
                    <AlertDescription>{errors.fechas}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
            </div>

          <div className="group">
            <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-gray-600/20 hover:border-gray-600/50">
              <CardHeader className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-gray-800/5"></div>
                <CardTitle className="flex items-center gap-3 text-white relative z-10">
                  <div className="p-2 bg-gradient-to-r from-gray-700 to-black rounded-xl shadow-lg border border-gray-700">
                    <IconUpload size={24} className="text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                    Carta de Solicitud de Modificación
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-gray-800/50 border-gray-600 text-gray-300 text-xs"
                  >
                    Opcional
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <div>
                  <Label
                    htmlFor="cartaSolicitud"
                    className="text-gray-100 font-semibold flex items-center gap-2"
                  >
                    <IconFileText size={16} className="text-gray-400" />
                    Carta de solicitud de modificación
                  </Label>
                  
                  {/* Nota informativa sobre OtrosiFile */}
                  <div className="mt-2 p-3 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                    <p className="text-blue-300 text-xs flex items-center gap-2">
                      <IconInfoCircle size={14} />
                      <strong>💾 Almacenamiento:</strong> Este archivo se guardará en la tabla OtrosiFile específica para este otrosí.
                    </p>
                  </div>
                  
                  <Input
                id="cartaSolicitud"
                type="file"
                    accept="application/pdf"
                onChange={handleFileChange}
                    className={`mt-3 text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-gray-700 file:to-black file:text-white hover:file:from-gray-600 hover:file:to-gray-800 transition-all duration-200 ${
                      errors.cartaSolicitud ? "border-red-500/50" : ""
                    }`}
                  />
                  {formData.cartaSolicitud && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-800/20 to-gray-700/20 border border-gray-700/30 rounded-xl backdrop-blur-sm">
                      <p className="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                        <IconCheck size={16} className="text-green-400" />
                        Archivo seleccionado para OtrosiFile
                      </p>
                      <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                        <IconFileText size={16} className="text-gray-400" />
                        <span className="text-gray-200 text-sm font-medium">
                          {formData.cartaSolicitud.name}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-800/50 text-gray-300 border-gray-600"
                        >
                          (
                          {(formData.cartaSolicitud.size / 1024 / 1024).toFixed(
                            2
                          )}{" "}
                          MB)
                        </Badge>
                      </div>
                      
                      {/* Información adicional sobre el almacenamiento */}
                      <div className="mt-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded-lg">
                        <p className="text-blue-300 text-xs">
                          ✅ Este archivo se guardará en OtrosiFile con categoría "Carta de Solicitud"
                        </p>
                      </div>
                    </div>
                  )}
                  {errors.cartaSolicitud && (
                    <Alert
                      variant="destructive"
                      className="mt-3 border-red-500/30 bg-red-500/10"
                    >
                      <IconAlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {errors.cartaSolicitud}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
                     </div>

           {/* Campo para firmar otrosí */}
           <div className="group">
             <Card className="border-gray-800/50 bg-gradient-to-br from-gray-900/90 to-black/90 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-gray-600/20 hover:border-gray-600/50">
               <CardHeader className="relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-gray-700/5 to-gray-800/5"></div>
                 <CardTitle className="flex items-center gap-3 text-white relative z-10">
                   <div className="p-2 bg-gradient-to-r from-gray-700 to-black rounded-xl shadow-lg border border-gray-700">
                     <IconCheck size={24} className="text-white" />
                   </div>
                   <span className="bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                     Firmar Otrosí
                   </span>
                   <Badge
                     variant="outline"
                     className="bg-gray-800/50 border-gray-600 text-gray-300 text-xs"
                   >
                     Opcional
                   </Badge>
                 </CardTitle>
               </CardHeader>
               <CardContent className="relative z-10">
                 <div>
                   <Label
                     htmlFor="firmarOtrosi"
                     className="text-gray-100 font-semibold flex items-center gap-2"
                   >
                     <IconCheck size={16} className="text-gray-400" />
                     Archivo firmado del otrosí
                   </Label>
                   <p className="text-gray-400 text-xs mt-2 flex items-center gap-1">
                     <IconInfoCircle size={12} />
                     Si sube un archivo firmado, el contrato pasará directamente al estado de revisión del abogado
                   </p>
                   
                   {/* Nota informativa sobre OtrosiFile */}
                   <div className="mt-2 p-3 bg-green-900/20 border border-green-700/30 rounded-lg">
                     <p className="text-green-300 text-xs flex items-center gap-2">
                       <IconInfoCircle size={14} />
                       <strong>💾 Almacenamiento:</strong> Este archivo se guardará en la tabla OtrosiFile con categoría "Firma Usuario".
                     </p>
                   </div>
                   <Input
                     id="firmarOtrosi"
                     type="file"
                     accept="application/pdf"
                     onChange={handleFirmarOtrosiChange}
                     className={`mt-3 text-gray-300 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-gray-700 file:to-black file:text-white hover:file:from-gray-600 hover:file:to-gray-800 transition-all duration-200 ${
                       errors.firmarOtrosi ? "border-red-500/50" : ""
                     }`}
                   />
                   {formData.firmarOtrosi && (
                     <div className="mt-4 p-4 bg-gradient-to-r from-gray-800/20 to-gray-700/20 border border-gray-700/30 rounded-xl backdrop-blur-sm">
                       <p className="text-gray-300 text-sm font-semibold mb-3 flex items-center gap-2">
                         <IconCheck size={16} className="text-green-400" />
                         Archivo de firma seleccionado para OtrosiFile
                       </p>
                       <div className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700/30">
                         <IconFileText size={16} className="text-gray-400" />
                         <span className="text-gray-200 text-sm font-medium">
                           {formData.firmarOtrosi.name}
                         </span>
                         <Badge
                           variant="secondary"
                           className="text-xs bg-gray-800/50 text-gray-300 border-gray-600"
                         >
                           (
                           {(formData.firmarOtrosi.size / 1024 / 1024).toFixed(
                             2
                           )}{" "}
                           MB)
                         </Badge>
                       </div>
                       
                       {/* Información adicional sobre el almacenamiento */}
                       <div className="mt-3 p-2 bg-green-900/20 border border-green-700/30 rounded-lg">
                         <p className="text-green-300 text-xs">
                           ✅ Este archivo se guardará en OtrosiFile con categoría "Firma Usuario"
                         </p>
                       </div>
                     </div>
                   )}
                   {errors.firmarOtrosi && (
                     <Alert
                       variant="destructive"
                       className="mt-3 border-red-500/30 bg-red-500/10"
                     >
                       <IconAlertTriangle className="h-4 w-4" />
                       <AlertDescription>
                         {errors.firmarOtrosi}
                       </AlertDescription>
                     </Alert>
                   )}
                 </div>
               </CardContent>
             </Card>
            </div>



           <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button
                type="button"
               onClick={() => {
                 // Navigate based on user role
                 if (user?.role === "lawyer") {
                   navigate(`/lawyer/contracts/${id}`);
                 } else {
                   navigate(`/user/contracts/${id}`);
                 }
               }}
                variant="outline"
               className="flex-1 group relative overflow-hidden bg-gray-800/30 border-gray-700/50 hover:bg-gray-700/30 hover:border-gray-600/50 transition-all duration-300"
              >
              <span className="relative z-10 flex items-center gap-2">
                <IconArrowLeft size={20} />
                Cancelar
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700/20 to-gray-800/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>

              <Button
                type="submit"
              className="flex-1 group relative overflow-hidden bg-gradient-to-r from-gray-700 to-black hover:from-gray-600 hover:to-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-600"
                disabled={isSubmitting}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 to-gray-700/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <IconUpload size={20} />
                    <span>Aplicar Otrosí</span>
                  </>
                )}
              </span>
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default OtrosiForm;

//otrosi abajo
//nombre del proveedor
//numero de radicado filtrar
//enumerar el otrosi del ese contrato y se acomulan, no se remplazan por el nuevo
//morado todo sobre el otrosi
//firmado por ambas partes

//en el formulario agregar un campo opcional el cual diga "firmar otrosi" y si es firmado debe ser pasado a un estado llamado signature_otrosi_already_signedByUser y si no es firmado pasa al estado llamado awaiting_lawyer_review".

//en devuelto si el contrato tiene el estado llamado signature_otrosi_already_signedByUser y es firmado por el abogado pasa directamente a signed pero si tiene el estado awaiting_lawyer_review sigue con ciclo de vida
