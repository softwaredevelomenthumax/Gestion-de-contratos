import React from "react";
import { IconInfoCircle } from "@tabler/icons-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const estadoLabels = {
  new: "Nuevo",
  responded: "Respondido",
  "para responder": "Para responder",
  firmado: "Firmado",
  signed: "Firmado",
  vencido: "Vencido",
  seen: "Visto",
  awaiting_user_response: "Esperando respuesta del usuario",
  awaiting_lawyer_review: "En revisión por el abogado",
  awaiting_signature: "Esperando firma",
  signature_otrosi_already_signedByUser: "Otrosí firmado por usuario - Esperando aprobación del abogado",
  otrosi_awaiting_user_response: "Otrosí devuelto - Esperando correcciones del usuario",
  otrosi_awaiting_lawyer_review: "Otrosí en revisión por el abogado",
  otrosi_awaiting_signature: "Otrosí aprobado - Esperando firma final",
  otrosi_signed: "Otrosí completado y firmado",
  rechazado: "Rechazado",
  devuelto: "Devuelto",
};

const formatHistoryTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleString("es-CO", { hour12: false });
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("es-CO");
};

// Helper to format contract types for display
const formatContractType = (contractType) => {
  if (!contractType) return "";

  const contractTypeMap = {
    prestacion_de_servicios: "Prestación de Servicios",
    compra_venta: "Compra Venta",
    arrendamiento: "Arrendamiento",
    licencia: "Licencia",
    concesion: "Concesión",
    suministro: "Suministro",
    obra_civil: "Obra Civil",
    consultoria: "Consultoría",
    mantenimiento: "Mantenimiento",
    transporte: "Transporte",
    seguridad: "Seguridad",
    limpieza: "Limpieza",
    catering: "Catering",
    tecnologia: "Tecnología",
    marketing: "Marketing",
    legal: "Legal",
    contable: "Contable",
    medica: "Médica",
    educativa: "Educativa",
    otro: "Otro",
  };

  // If it's in our map, return the formatted version
  if (contractTypeMap[contractType.toLowerCase()]) {
    return contractTypeMap[contractType.toLowerCase()];
  }

  // Otherwise, format it by replacing underscores with spaces and capitalizing
  return contractType
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

const ContractTraceDetail = ({
  contract,
  history,
  historyOrder,
  setHistoryOrder,
}) => {
  const orderedHistory = [...history].sort((a, b) =>
    historyOrder === "newest"
      ? new Date(b.timestamp) - new Date(a.timestamp)
      : new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div className="bg-card dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4 text-foreground">
          Contrato #{contract.id}
        </h2>
        <div className="mb-4 text-lg text-foreground">
          {contract.descripcion}
        </div>
        <div className="flex flex-wrap gap-4 text-sm mb-4 text-muted-foreground">
          <span>
            <b>Tipo:</b> {formatContractType(contract.tipoContrato)}
          </span>
          <span>
            <b>Estado:</b> {estadoLabels[contract.estado] || contract.estado}
          </span>
          <span>
            <b>Ingreso:</b> {formatDate(contract.fechaIngreso)}
          </span>
          <span>
            <b>Inicio:</b> {formatDate(contract.fechaInicio)}
          </span>
          <span>
            <b>Fin:</b> {formatDate(contract.fechaFinal)}
          </span>
          <span>
            <b>Solicitante:</b> {contract.solicitante?.firstName}{" "}
            {contract.solicitante?.lastName}
          </span>
          <span>
            <b>Área:</b> {contract.area}
          </span>
          <span>
            <b>Gerente Área:</b> {contract.gerenteArea}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between mb-8">
        <h4 className="text-2xl font-bold text-foreground">Trazabilidad</h4>
        <Select value={historyOrder} onValueChange={setHistoryOrder}>
          <SelectTrigger className="w-56 border-gray-200 dark:border-gray-700 bg-background text-foreground">
            <SelectValue placeholder="Ordenar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Más reciente</SelectItem>
            <SelectItem value="oldest">Más antiguo</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-6">
        {orderedHistory.length === 0 && (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg border border-gray-200 dark:border-gray-700">
            No hay trazabilidad para este contrato.
          </div>
        )}
        {orderedHistory.map((entry, idx) => (
          <div
            key={idx}
            className="p-6 rounded-xl bg-background dark:bg-gray-900 flex flex-col md:flex-row md:items-center gap-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-foreground bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
                  {entry.role === "lawyer" ? "Abogado" : "Usuario"}
                </span>
                <span className="text-sm text-muted-foreground">
                  {formatHistoryTimestamp(entry.timestamp)}
                </span>
              </div>
              {entry.comment && (
                <div className="mb-4 p-4 bg-muted/30 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-semibold text-foreground mb-2 block">
                    Comentario:
                  </span>
                  <p className="text-base text-foreground leading-relaxed">
                    {entry.comment}
                  </p>
                </div>
              )}
              {entry.oldStatus && (
                <div className="mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    Estado al enviar la respuesta:
                  </span>
                  <span className="ml-2 text-sm font-medium text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/30 px-2 py-1 rounded">
                    {estadoLabels[entry.oldStatus] || entry.oldStatus}
                  </span>
                </div>
              )}
              {entry.newStatus && (
                <div className="mb-2">
                  <span className="text-sm font-semibold text-foreground">
                    Estado después de la respuesta:
                  </span>
                  <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded">
                    {estadoLabels[entry.newStatus] || entry.newStatus}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContractTraceDetail;
