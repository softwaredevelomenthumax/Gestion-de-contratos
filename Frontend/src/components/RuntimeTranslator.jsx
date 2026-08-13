import { useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { translateTexts } from '../api/translations';

const stripAccents = (value) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const normalize = (value) => stripAccents(value || '').toLowerCase().trim();

const accentVariants = { a: 'aá', e: 'eé', i: 'ií', o: 'oó', u: 'uúü', n: 'nñ' };

// Builds a regex from an accent-free phrase that also matches its accented Spanish variants (e.g. "sesion" -> "sesión").
const buildAccentInsensitiveRegex = (phrase) => {
  const pattern = phrase
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      if (accentVariants[lower]) return `[${accentVariants[lower]}]`;
      return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('');
  return new RegExp(`\\b${pattern}\\b`, 'gi');
};

const preserveCase = (source, target) => {
  if (!source || !target) return target;
  if (source === source.toUpperCase()) return target.toUpperCase();
  if (source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
};

// Use Unicode escapes instead of source-encoded characters. This avoids
// mojibake and makes phrase matching work with real accented UI text.
const buildUnicodeAccentInsensitiveRegex = (phrase) => {
  const variants = {
    a: 'a\u00e1', e: 'e\u00e9', i: 'i\u00ed',
    o: 'o\u00f3', u: 'u\u00fa\u00fc', n: 'n\u00f1'
  };
  const pattern = phrase.split('').map((char) => {
    const lower = char.toLowerCase();
    return variants[lower]
      ? `[${variants[lower]}]`
      : char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('');
  return new RegExp(`\\b${pattern}\\b`, 'gi');
};

const phraseEsToEn = [
  ['gestion de contratos', 'Contract Management'],
  ['iniciar sesion', 'Sign In'],
  ['registro', 'Register'],
  ['registrar', 'Register'],
  ['registrando', 'Signing up'],
  ['correo electronico', 'Email'],
  ['confirma tu email', 'Confirm Email'],
  ['confirma tu contrasena', 'Confirm Password'],
  ['codigo de pais', 'Country Code'],
  ['cerrar sesion', 'Sign Out'],
  ['gestion de cuentas', 'Account Management'],
  ['crear administrador', 'Create Admin'],
  ['consultar informacion', 'Check Information'],
  ['enviar contrato', 'Send Contract'],
  ['estados', 'Statuses'],
  ['aprobaciones pendientes', 'Pending Approvals'],
  ['acceso denegado', 'Access Denied'],
  ['no hay usuarios pendientes', 'No pending users'],
  ['ya tienes cuenta', 'Already have an account'],
  ['no tienes cuenta', "Don't have an account"],
  ['inicia sesion', 'Sign in'],
  ['registrate', 'Sign up'],
  ['crea tu cuenta para continuar', 'Create your account to continue'],
  ['accede a tu cuenta para continuar', 'Access your account to continue'],
  ['esperando respuesta del usuario', 'awaiting user response'],
  ['esperando revision del abogado', 'awaiting lawyer review'],
  ['esperando firma del usuario', 'awaiting user signature'],
  ['completamente firmado', 'fully signed'],
  ['cargando', 'Loading'],
  ['actualizando', 'Refreshing'],
  ['actualizar', 'Refresh'],

  // ContractForm.jsx - contract type options
  ['prestacion de servicios', 'Services provision'],
  ['compra de equipos', 'Equipment purchase'],
  ['obra civil', 'Civil works'],
  ['contrato suministro', 'Supply contract'],
  ['acuerdo comercial', 'Commercial agreement'],
  ['acuerdo de confidencialidad', 'Confidentiality agreement'],
  ['concesion de espacios', 'Space concession'],
  ['contrato de maquila', 'Manufacturing contract'],

  // ContractForm.jsx - labels and messages
  ['tipo de solicitud', 'Request Type'],
  ['tipo de contrato', 'Contract Type'],
  ['gerente del area', 'Area Manager'],
  ['proveedor / cliente', 'Supplier / Client'],
  ['nit / identificacion del proveedor / cliente', 'Tax ID / Supplier or Client Identification'],
  ['forma de pago', 'Payment Method'],
  ['valor total del contrato', 'Total Contract Value'],
  ['fecha de inicio', 'Start Date'],
  ['fecha final', 'End Date'],
  ['archivo de oferta', 'Offer File'],
  ['duracion (debe ser mayor a 0 dias)', 'Duration (must be greater than 0 days)'],
  ['descripcion del contrato', 'Contract description'],
  ['nombre del solicitante', 'Requester name'],
  ['area del solicitante', 'Requester area'],
  ['nombre del gerente', 'Manager name'],
  ['nombre del proveedor o cliente', 'Supplier or client name'],
  ['nit o identificacion (9 caracteres alfanumericos)', 'Tax ID or identification (9 alphanumeric characters)'],
  ['crear un nuevo contrato', 'Create a new contract'],
  ['completa los siguientes datos para crear un nuevo contrato.', 'Complete the following details to create a new contract.'],
  ['completa todos los campos para crear el contrato. los campos con errores se mostraran en rojo.', 'Complete all fields to create the contract. Fields with errors will be shown in red.'],
  ['este campo es obligatorio', 'This field is required'],
  ['la fecha final debe ser mayor que la fecha de inicio', 'The end date must be later than the start date'],
  ['falta completar el siguiente campo:', 'The following field is missing:'],
  ['faltan completar los siguientes campos:', 'The following fields are missing:'],
  ['contrato enviado correctamente', 'Contract submitted successfully'],
  ['tu contrato ha sido registrado y esta en proceso.', 'Your contract has been registered and is in progress.'],
  ['descripcion del objeto del contrato', 'Description of the contract purpose'],
  ['en este campo debe indicar, de manera clara y detallada, cual es la finalidad del contrato. procure incluir:', 'In this field you must clearly and thoroughly state the purpose of the contract. Try to include:'],
  ['objeto o proposito principal:', 'Main purpose or objective:'],
  ['explique que servicio, bien o actividad se va a realizar o entregar.', 'explain what service, good or activity will be performed or delivered.'],
  ['alcance:', 'Scope:'],
  ['especifique que incluye y que no incluye el contrato, para evitar dudas o interpretaciones posteriores.', 'specify what the contract includes and excludes, to avoid doubts or later interpretations.'],
  ['entregables y plazos:', 'Deliverables and deadlines:'],
  ['describa los productos, servicios o resultados esperados, senalando fechas de entrega o hitos relevantes.', 'describe the expected products, services or results, noting delivery dates or relevant milestones.'],
  ['otros aspectos relevantes:', 'Other relevant aspects:'],
  ['toda informacion adicional que ayude a precisar como debe ejecutarse la obligacion (condiciones, limitaciones, requisitos, etc.).', 'any additional information that helps clarify how the obligation should be carried out (conditions, limitations, requirements, etc.).'],
  ['tipo de valor', 'Value type'],
  ['indeterminado', 'Undetermined'],
  ['el contrato se registrara con valor indeterminado.', 'The contract will be registered with an undetermined value.'],
  ['seleccione si el valor es determinado o indeterminado.', 'Select whether the value is determined or undetermined.'],
  ['valor total del contrato', 'Total contract value'],
  ['ingrese el valor total del contrato', 'Enter the total contract value'],
  ['recomendacion: use terminos simples', 'Recommendation: Use simple terms'],
  ['si no es extranjero, el nit sera obligatorio.', 'If not foreign, the Tax ID will be required.'],
  ['si es extranjero, el nit quedara deshabilitado.', 'If foreign, the Tax ID will be disabled.'],
  ['el proveedor o cliente tiene nit', 'Does the supplier or client have Tax ID'],
  ['si, el nit sera obligatorio.', 'Yes, Tax ID will be required.'],
  ['no, el campo nit quedara deshabilitado.', 'No, the Tax ID field will be disabled.'],
  ['nit (9 caracteres alfanumericos)', 'Tax ID (9 alphanumeric characters)'],
  ['nit (debe tener exactamente 9 caracteres alfanumericos)', 'Tax ID (must have exactly 9 alphanumeric characters)'],
  ['subiendo 1 archivo...', 'Uploading 1 file...'],
  ['procesando contrato en el servidor...', 'Processing contract on the server...'],
  ['contrato creado exitosamente', 'Contract created successfully'],
  ['ocurrio un error al crear el contrato', 'An error occurred while creating the contract'],
  ['es proveedor / cliente extranjero', 'Is the supplier / client foreign'],

  // ContractFullDetail.jsx - status labels
  ['respondido', 'Responded'],
  ['para responder', 'To respond'],
  ['vencido', 'Expired'],
  ['visto', 'Seen'],
  ['esperando respuesta del usuario del otrosi', 'Awaiting user response for the amendment'],
  ['esperando revision del abogado del otrosi', 'Awaiting lawyer review for the amendment'],
  ['otrosi pendiente de firma del usuario', 'Amendment pending user signature'],
  ['otrosi finalizado', 'Amendment completed'],
  ['otrosi firmado - esperando firma del abogado', 'Amendment signed - Awaiting lawyer signature'],

  // ContractFullDetail.jsx - file types and history
  ['respuesta abogado', 'Lawyer Response'],
  ['respuesta usuario', 'User Response'],
  ['firma abogado', 'Lawyer Signature'],
  ['firma usuario', 'User Signature'],
  ['otrosi sin firma', 'Amendment Without Signature'],
  ['firma registrada', 'Signature recorded'],
  ['contrato devuelto', 'Contract returned'],
  ['contrato gestionado', 'Contract managed'],
  ['sin fecha', 'No date'],
  ['fecha invalida', 'Invalid date'],
  ['crear otrosi', 'Create Amendment'],
  ['subir poliza', 'Upload Policy'],
  ['enviar respuesta', 'Send response'],
  ['devolver contrato', 'Return Contract'],
  ['proporciona comentarios o archivos para devolver el contrato (ambos opcionales)', 'Provide comments or files to return the contract (both optional)'],
  ['al devolver se enviara al usuario para correcciones. proporciona al menos un comentario o archivo.', 'Returning it will send it to the user for corrections. Provide at least one comment or file.'],
  ['subir archivos pdf firmados', 'Upload signed PDF files'],
  ['subir archivos pdf', 'Upload PDF files'],
  ['adjunta el archivo pdf firmado (obligatorio).', 'Attach the signed PDF file (required).'],
  ['al firmar se completara el proceso. asegurate de firmar correctamente.', 'Signing will complete the process. Make sure to sign correctly.'],
  ['escribe tu comentario sobre la poliza...', 'Write your comment about the policy...'],
  ['explica por que devuelves el contrato (opcional)...', 'Explain why you are returning the contract (optional)...'],
  ['archivos pdf (maximo 10):', 'PDF files (maximum 10):'],
  ['listo para subir', 'Ready to upload'],

  // ContractFilters.jsx
  ['mas reciente', 'Most recent'],
  ['mas antiguo', 'Oldest'],
  ['proveedor (a-z)', 'Supplier (A-Z)'],
  ['proveedor (z-a)', 'Supplier (Z-A)'],
  ['solo con otrosi', 'Only with amendment'],
  ['sin otrosi', 'Without amendment'],
  ['filtrar por descripcion', 'Filter by description'],
  ['buscar por radicado', 'Search by ticket number'],
  ['numero de radicado...', 'Ticket number...'],
  ['filtros', 'Filters'],
  ['buscar contratos...', 'Search contracts...'],
  ['limpiar filtros', 'Clear filters'],

  // DropFile.jsx
  ['solo se aceptan archivos pdf, doc o docx menores a 30mb.', 'Only PDF, DOC or DOCX files under 30MB are accepted.'],
  ['subir contrato', 'Upload contract'],
  ['arrastra y suelta uno o varios archivos aqui, o haz clic para seleccionar', 'Drag and drop one or more files here, or click to select'],
  ['solo archivos .pdf .doc .docx menores a 30mb', 'Only .pdf .doc .docx files under 30MB'],
  ['quitar', 'Remove'],

  // OtrosiForm.jsx
  ['solicitud de otrosi', 'Amendment Request'],
  ['modifica los terminos del contrato existente.', 'Modify the terms of the existing contract.'],
  ['descripcion de los cambios', 'Description of Changes'],
  ['describir los cambios que requiere el contrato', 'Describe the changes required for the contract'],
  ['describe detalladamente todos los cambios que requiere el contrato...', 'Describe in detail all the changes required for the contract...'],
  ['informacion financiera', 'Financial Information'],
  ['valor total del contrato', 'Total Contract Value'],
  ['solo numeros permitidos', 'Only numbers allowed'],
  ['porcentaje de iva', 'VAT Percentage'],
  ['valor del iva (calculado)', 'VAT Value (Calculated)'],
  ['se calcula automaticamente', 'Calculated automatically'],
  ['ej: en un solo pago o en pagos periodicos (especificar)', 'E.g.: in a single payment or in periodic payments (specify)'],
  ['la descripcion de los cambios es obligatoria', 'The description of changes is required'],
  ['la fecha de inicio debe ser anterior a la fecha final', 'The start date must be before the end date'],
  ['por favor, corrige los errores en el formulario', 'Please fix the errors in the form'],
  ['procesando otrosi en el servidor...', 'Processing amendment on the server...'],
  ['otrosi creado exitosamente', 'Amendment created successfully'],
  ['error al enviar el otrosi', 'Error submitting the amendment'],
  ['enviando...', 'Sending...'],
  ['aplicar otrosi', 'Apply Amendment'],
  ['adjuntar aqui solo si el documento ya tiene la firma del proveedor/cliente', 'Attach here only if the document already has the supplier/client signature'],
  ['enviar otrosi firmado', 'Send signed amendment'],
  ['enviar otrosi (adjuntar aqui solo si el documento no tiene la firma del proveedor/cliente)', 'Send amendment (Attach here only if the document does NOT have the supplier/client signature)'],
  ['enviar otrosi', 'Send amendment'],
  ['carta de solicitud', 'Request Letter'],
  ['solo se permiten archivos pdf, doc o docx menores a 30mb', 'Only PDF, DOC or DOCX files under 30MB are allowed'],
  ['error al cargar el contrato', 'Error loading the contract'],

  // Register.jsx
  ['tu nombre', 'Your first name'],
  ['tu apellido', 'Your last name'],
  ['tu email', 'Your email'],
  ['el nombre es obligatorio y solo puede contener letras, espacios, guiones y apostrofes.', 'The first name is required and can only contain letters, spaces, hyphens and apostrophes.'],
  ['el apellido es obligatorio y solo puede contener letras, espacios, guiones y apostrofes.', 'The last name is required and can only contain letters, spaces, hyphens and apostrophes.'],
  ['email invalido.', 'Invalid email.'],
  ['los correos electronicos no coinciden.', 'The emails do not match.'],
  ['los correos coinciden', 'The emails match'],
  ['la contrasena debe tener al menos 6 caracteres.', 'The password must be at least 6 characters.'],
  ['las contrasenas no coinciden.', 'The passwords do not match.'],
  ['las contrasenas coinciden', 'The passwords match'],
  ['ingresa tu contrasena nuevamente', 'Enter your password again'],
  ['confirma la contrasena', 'Confirm the password'],
  ['usuario regular', 'Regular user'],
  ['registro exitoso. redirigiendo al login...', 'Registration successful. Redirecting to login...'],

  // Loginform.jsx
  ['error de inicio de sesion desconocido.', 'Unknown login error.'],
  ['error de red o servidor.', 'Network or server error.'],

  // Home.jsx
  ['contratos enviados', 'Sent contracts'],
  ['visualiza y gestiona tus contratos enviados', 'View and manage your sent contracts'],
  ['contratos nuevos', 'New contracts'],
  ['revisa y asigna los nuevos contratos recibidos', 'Review and assign the new contracts received'],
  ['contratos revisados', 'Reviewed contracts'],
  ['contratos que han sido revisados por el area legal y estan pendientes de respuesta por el usuario', 'Contracts that have been reviewed by the legal area and are pending a response from the user'],
  ['contratos devueltos', 'Returned contracts'],
  ['contratos que requieren una respuesta o accion de tu parte', 'Contracts that require a response or action from you'],
  ['contratos para responder', 'Contracts to respond to'],
  ['contratos a la espera de firma del usuario', 'Contracts awaiting user signature'],
  ['contratos que ha firmado el representante legal humax y esperan la firma del usuario', "Contracts signed by the Humax legal representative that are awaiting the user's signature"],
  ['contratos a la espera de tu firma', 'Contracts awaiting your signature'],
  ['contratos que han sido firmados por el representante legal humax y esperan la firma del usuario', "Contracts that have been signed by the Humax legal representative and are awaiting the user's signature"],
  ['contratos finalizados', 'Completed contracts'],
  ['contratos que han completado el ciclo de firma', 'Contracts that have completed the signature cycle'],
  ['gestiona tus contratos de forma rapida y sencilla.', 'Manage your contracts quickly and easily.'],
  ['ir ahora', 'Go now'],

  // AdminContracts.jsx
  ['administracion de contratos', 'Contract Administration'],
  ['cargando contratos...', 'Loading contracts...'],
  ['no hay contratos que coincidan con los filtros aplicados.', 'No contracts match the applied filters.'],
  ['no hay contratos disponibles.', 'No contracts available.'],
  ['eliminando...', 'Deleting...'],
  ['esta accion no se puede deshacer.', 'This action cannot be undone.'],
  ['contrato eliminado correctamente', 'Contract deleted successfully'],
  ['no se pudo eliminar el contrato', 'The contract could not be deleted'],
  ['no se pudieron cargar los contratos', 'The contracts could not be loaded'],

  // AdminUsers.jsx
  ['necesitas privilegios de administrador para acceder a esta pagina.', 'You need administrator privileges to access this page.'],
  ['aprobar o rechazar registros de usuarios pendientes', 'Approve or reject pending user registrations'],
  ['cargando usuarios pendientes...', 'Loading pending users...'],
  ['todos los registros de usuarios han sido procesados.', 'All user registrations have been processed.'],
  ['usuario aprobado exitosamente', 'User approved successfully'],
  ['usuario rechazado y eliminado exitosamente', 'User rejected and deleted successfully'],
  ['acceso denegado. se requieren privilegios de administrador.', 'Access denied. Administrator privileges are required.'],
  ['error al cargar usuarios pendientes', 'Error loading pending users'],
  ['lista actualizada correctamente', 'List updated successfully'],
  ['error al actualizar la lista', 'Error updating the list'],
  ['estas seguro de que quieres rechazar este usuario? esta accion no se puede deshacer y la cuenta del usuario sera eliminada.', "Are you sure you want to reject this user? This action cannot be undone and the user's account will be deleted."],
  ['error al aprobar usuario', 'Error approving user'],
  ['error al rechazar usuario', 'Error rejecting user'],

  // CreateAdmin.jsx
  ['crear una nueva cuenta de administrador con privilegios completos', 'Create a new administrator account with full privileges'],
  ['ingresa el nombre', 'Enter the first name'],
  ['ingresa el apellido', 'Enter the last name'],
  ['ingresa la direccion de correo', 'Enter the email address'],
  ['ingresa la contrasena', 'Enter the password'],
  ['creando administrador...', 'Creating Administrator...'],
  ['el nombre es requerido', 'First name is required'],
  ['el apellido es requerido', 'Last name is required'],
  ['el email es requerido', 'Email is required'],
  ['el email es invalido', 'Email is invalid'],
  ['el codigo de pais es requerido', 'Country code is required'],
  ['la contrasena es requerida', 'Password is required'],
  ['por favor confirma tu contrasena', 'Please confirm your password'],
  ['las contrasenas no coinciden', 'Passwords do not match'],
  ['usuario administrador creado exitosamente', 'Administrator user created successfully'],
  ['error al crear usuario administrador', 'Error creating administrator user'],

  // ContractTraceDetail.jsx - status labels and contract types
  ['en revision por el abogado', 'Under lawyer review'],
  ['otrosi firmado por usuario - esperando aprobacion del abogado', 'Amendment signed by user - Awaiting lawyer approval'],
  ['otrosi devuelto - esperando correcciones del usuario', 'Amendment returned - Awaiting user corrections'],
  ['otrosi en revision por el abogado', 'Amendment under lawyer review'],
  ['otrosi aprobado - esperando firma final', 'Amendment approved - Awaiting final signature'],
  ['otrosi completado y firmado', 'Amendment completed and signed'],
  ['prestacion de servicios', 'Service Provision'],
  ['compra venta', 'Purchase Sale'],
  ['arrendamiento', 'Lease'],
  ['licencia', 'License'],
  ['concesion', 'Concession'],
  ['suministro', 'Supply'],
  ['consultoria', 'Consulting'],
  ['mantenimiento', 'Maintenance'],
  ['transporte', 'Transportation'],
  ['seguridad', 'Security'],
  ['limpieza', 'Cleaning'],
  ['tecnologia', 'Technology'],
  ['medica', 'Medical'],
  ['educativa', 'Educational'],

  // Misc pages
  ['cargando trazabilidad del contrato...', 'Loading contract traceability...'],
  ['contrato no encontrado.', 'Contract not found.'],
  ['verificando autenticacion...', 'Verifying authentication...'],
  ['sin proveedor', 'No supplier'],
  ['nadie ha visto este contrato aun.', 'No one has viewed this contract yet.']
];

const phraseEnToEs = phraseEsToEn.map(([es, en]) => [en.toLowerCase(), es]);

const wordEsToEn = {
  de: 'of',
  del: 'of the',
  la: 'the',
  el: 'the',
  los: 'the',
  las: 'the',
  y: 'and',
  o: 'or',
  para: 'for',
  por: 'for',
  con: 'with',
  sin: 'without',
  tu: 'your',
  tus: 'your',
  su: 'your',
  sus: 'your',
  al: 'to the',
  un: 'a',
  una: 'a',
  unos: 'some',
  unas: 'some',
  este: 'this',
  esta: 'this',
  estos: 'these',
  estas: 'these',
  ese: 'that',
  esa: 'that',
  esos: 'those',
  esas: 'those',
  ya: 'already',
  no: 'not',
  hay: 'there is',
  mas: 'more',
  menos: 'less',
  muy: 'very',
  solo: 'only',
  nuevamente: 'again',
  contrato: 'contract',
  contratos: 'contracts',
  otrosi: 'amendment',
  usuario: 'user',
  usuarios: 'users',
  regular: 'regular',
  abogado: 'lawyer',
  abogados: 'lawyers',
  administrador: 'admin',
  administradores: 'admins',
  aprobacion: 'approval',
  aprobaciones: 'approvals',
  aprobar: 'approve',
  aprobado: 'approved',
  aprobada: 'approved',
  aprobados: 'approved',
  aprobadas: 'approved',
  rechazado: 'rejected',
  rechazada: 'rejected',
  rechazados: 'rejected',
  rechazadas: 'rejected',
  rechazar: 'reject',
  pendiente: 'pending',
  pendientes: 'pending',
  firmado: 'signed',
  firmada: 'signed',
  firma: 'signature',
  firmas: 'signatures',
  devuelto: 'returned',
  devuelta: 'returned',
  devueltos: 'returned',
  devueltas: 'returned',
  nuevo: 'new',
  nueva: 'new',
  nuevos: 'new',
  nuevas: 'new',
  finalizado: 'completed',
  finalizada: 'completed',
  finalizados: 'completed',
  finalizadas: 'completed',
  exitosamente: 'successfully',
  exito: 'success',
  error: 'error',
  errores: 'errors',
  idioma: 'language',
  cuenta: 'account',
  cuentas: 'accounts',
  correo: 'email',
  contrasena: 'password',
  nombre: 'name',
  apellido: 'last name',
  rol: 'role',
  pais: 'country',
  codigo: 'code',
  crear: 'create',
  gestion: 'management',
  enviar: 'send',
  consultar: 'check',
  detalles: 'details',
  trazabilidad: 'traceability',
  sesion: 'session',
  iniciar: 'start',
  ingresar: 'sign in',
  salir: 'sign out',
  cargar: 'load',
  cargando: 'loading',
  actualizar: 'refresh',
  actualizando: 'refreshing',
  guardar: 'save',
  guardado: 'saved',
  guardando: 'saving',
  eliminar: 'delete',
  eliminado: 'deleted',
  eliminando: 'deleting',
  editar: 'edit',
  editado: 'edited',
  agregar: 'add',
  agregado: 'added',
  quitar: 'remove',
  buscar: 'search',
  buscando: 'searching',
  filtrar: 'filter',
  filtros: 'filters',
  filtro: 'filter',
  ordenar: 'sort',
  descargar: 'download',
  descargando: 'downloading',
  descargado: 'downloaded',
  subir: 'upload',
  subiendo: 'uploading',
  adjuntar: 'attach',
  adjunto: 'attachment',
  adjuntos: 'attachments',
  ver: 'view',
  abrir: 'open',
  cerrar: 'close',
  mostrar: 'show',
  ocultar: 'hide',
  bienvenido: 'welcome',
  bienvenida: 'welcome',
  confirmar: 'confirm',
  confirmado: 'confirmed',
  aceptar: 'accept',
  cancelar: 'cancel',
  continuar: 'continue',
  siguiente: 'next',
  anterior: 'previous',
  todos: 'all',
  todas: 'all',
  ninguno: 'none',
  ninguna: 'none',
  valido: 'valid',
  invalido: 'invalid',
  obligatorio: 'required',
  obligatoria: 'required',
  opcional: 'optional',
  campo: 'field',
  campos: 'fields',
  formulario: 'form',
  fecha: 'date',
  fechas: 'dates',
  valor: 'value',
  valores: 'values',
  moneda: 'currency',
  area: 'area',
  proveedor: 'supplier',
  cliente: 'client',
  descripcion: 'description',
  titulo: 'title',
  comentario: 'comment',
  comentarios: 'comments',
  archivo: 'file',
  archivos: 'files',
  historial: 'history',
  perfil: 'profile',
  notificacion: 'notification',
  notificaciones: 'notifications',
  configuracion: 'settings',
  ayuda: 'help',
  soporte: 'support',
  contacto: 'contact',
  dias: 'days',
  dia: 'day',
  meses: 'months',
  mes: 'month',
  anios: 'years',
  anio: 'year',
  informacion: 'information',
  descripcionotrosi: 'amendment description',
  duracion: 'duration',
  identificacion: 'identification',
  respuesta: 'response',
  respuestas: 'responses',
  poliza: 'policy',
  revision: 'review',
  visto: 'seen',
  vencido: 'expired',
  gerente: 'manager',
  ticket: 'ticket',
  buscador: 'search',
  descripcioncambios: 'description of changes',
  otros: 'other',
  camara: 'chamber',
  oferta: 'offer',
  si: 'yes',
  clave: 'key',
  extranjero: 'foreign',
  extranjera: 'foreign',
  otro: 'other',
  otra: 'other',
  determinado: 'determined',
  determinada: 'determined',
  legal: 'legal',
  marketing: 'marketing',
  catering: 'catering',
  educativa: 'educational',
  medica: 'medical'
};

// Coverage for labels used in the contract detail, traceability and admin
// screens. Keeping these in the local fallback means the UI stays English even
// when the external translation provider is unavailable.
Object.assign(wordEsToEn, {
  gestion: 'management', administracion: 'administration', esperando: 'awaiting',
  espera: 'waiting', revisar: 'review', revisado: 'reviewed', revisados: 'reviewed',
  disponible: 'available', disponibles: 'available', coincidan: 'match', aplicados: 'applied',
  lista: 'list', correctamente: 'correctly', necesitas: 'you need', necesita: 'needs',
  privilegios: 'privileges', pagina: 'page', paginas: 'pages', solicitud: 'request',
  solicitudes: 'requests', financiera: 'financial', financiero: 'financial', basica: 'basic',
  basico: 'basic', partes: 'parties', vigencia: 'validity', ingreso: 'entry', inicio: 'start',
  final: 'end', numero: 'number', despues: 'after', antes: 'before', accion: 'action',
  acciones: 'actions', especifico: 'specific', especifica: 'specific', abajo: 'below',
  arriba: 'above', principal: 'main', adjuntos: 'attachments', ninguno: 'none',
  nadie: 'no one', aun: 'yet', tiene: 'has', tienen: 'have', muestra: 'shows',
  muestran: 'are shown', mostrado: 'shown', mostrar: 'show', cada: 'each',
  desde: 'from', hasta: 'until', nueva: 'new', nuevo: 'new',
  creado: 'created', creada: 'created', creados: 'created',
  completada: 'completed', completado: 'completed', completados: 'completed',
  firmado: 'signed', firmar: 'sign', firme: 'sign', dias: 'days', dia: 'day',
  maximo: 'maximum', minimo: 'minimum', todos: 'all', todas: 'all',
  aqui: 'here', solo: 'only', puede: 'can', pueden: 'can', debe: 'must',
  deben: 'must', ser: 'be', esta: 'this', estado: 'status', tipo: 'type',
  tipos: 'types', categoria: 'category', categorias: 'categories', importante: 'important',
  requerido: 'required', requerida: 'required', requeridos: 'required', requeridas: 'required',
  volver: 'back', regresar: 'back', ingresar: 'sign in', confirmar: 'confirm'
});

const wordEnToEs = Object.fromEntries(
  Object.entries(wordEsToEn).map(([es, en]) => [normalize(en), es])
);

const replacePhrases = (text, pairs, sourceLang) => {
  let result = text;
  pairs.forEach(([fromRaw, toRaw]) => {
    const from = sourceLang === 'es' ? fromRaw : toRaw;
    const to = sourceLang === 'es' ? toRaw : fromRaw;
    // Spanish source phrases are accent-free in the dictionary but the real UI text often has accents.
    const regex = sourceLang === 'es'
      ? buildUnicodeAccentInsensitiveRegex(from)
      : new RegExp(`\\b${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    result = result.replace(regex, (match) => preserveCase(match, to));
  });
  return result;
};

const replaceWords = (text, dictionary) =>
  text.replace(/[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+/g, (match) => {
    const key = normalize(match);
    const translated = dictionary[key];
    return translated ? preserveCase(match, translated) : match;
  });

// \p{L} keeps every accented character in the same token (for example,
// “revisión” is translated as a word instead of becoming “reviewón”).
const replaceUnicodeWords = (text, dictionary) =>
  text.replace(/\p{L}+/gu, (match) => {
    const key = normalize(match);
    const translated = dictionary[key];
    return translated ? preserveCase(match, translated) : match;
  });

const translateText = (text, targetLanguage) => {
  if (!text || !text.trim()) return text;

  if (targetLanguage === 'en') {
    const phraseStep = replacePhrases(text, phraseEsToEn, 'es');
    return replaceUnicodeWords(phraseStep, wordEsToEn);
  }

  const phraseStep = replacePhrases(text, phraseEnToEs, 'en');
  return replaceUnicodeWords(phraseStep, wordEnToEs);
};

const RuntimeTranslator = () => {
  const { language } = useLanguage();
  const originalTextRef = useRef(new WeakMap());
  const originalAttrRef = useRef(new WeakMap());
  const isApplyingRef = useRef(false);
  const batchTokenRef = useRef(0);
  const translateTimerRef = useRef(null);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.body) return;

    const attrNames = ['placeholder', 'title', 'aria-label'];

    const shouldTranslateValueAttr = (el) => {
      if (!el || el.tagName !== 'INPUT') return false;
      const type = (el.getAttribute('type') || '').toLowerCase();
      return type === 'button' || type === 'submit' || type === 'reset';
    };

    const shouldSkipTranslation = (el) =>
      Boolean(el?.closest?.('[data-no-runtime-translate]'));

    const setTextSafely = (node, nextValue) => {
      if (node.textContent === nextValue) return;
      isApplyingRef.current = true;
      node.textContent = nextValue;
      isApplyingRef.current = false;
    };

    const setAttrSafely = (el, attrName, nextValue) => {
      if (el.getAttribute(attrName) === nextValue) return;
      isApplyingRef.current = true;
      el.setAttribute(attrName, nextValue);
      isApplyingRef.current = false;
    };

    const processTextNode = (node) => {
      const parentTag = node.parentElement?.tagName;
      if (!parentTag || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag) || shouldSkipTranslation(node.parentElement)) return;

      const currentText = node.textContent || '';
      const translatedCurrent = translateText(currentText, 'en');
      let meta = originalTextRef.current.get(node);

      if (!meta) {
        meta = { original: currentText, translated: translatedCurrent };
      } else {
        const contentChangedOutside = currentText !== meta.original && currentText !== meta.translated;
        if (contentChangedOutside) {
          meta.original = currentText;
          meta.translated = translateText(currentText, 'en');
        } else if (meta.original !== currentText) {
          meta.translated = translateText(meta.original, 'en');
        }
      }

      originalTextRef.current.set(node, meta);
      setTextSafely(node, language === 'en' ? meta.translated : meta.original);
    };

    const collectTextNodes = (rootNode, out) => {
      if (!rootNode) return;
      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      let current;
      while ((current = walker.nextNode())) {
        const parentTag = current.parentElement?.tagName;
        if (!parentTag || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parentTag) || shouldSkipTranslation(current.parentElement)) continue;
        const value = (current.textContent || '').trim();
        if (!value) continue;

        if (!originalTextRef.current.has(current)) {
          originalTextRef.current.set(current, {
            original: current.textContent || '',
            translated: translateText(current.textContent || '', 'en')
          });
        }

        out.push(current);
      }
    };

    const translateDomWithApi = async () => {
      if (language !== 'en') return;

      const runToken = ++batchTokenRef.current;
      const textNodes = [];
      collectTextNodes(document.body, textNodes);

      const originals = textNodes.map((node) => {
        const meta = originalTextRef.current.get(node);
        return meta?.original ?? (node.textContent || '');
      });

      const translated = await translateTexts(originals, 'en');
      if (batchTokenRef.current !== runToken) return;

      isApplyingRef.current = true;
      textNodes.forEach((node, idx) => {
        const meta = originalTextRef.current.get(node);
        if (!meta) return;
        const apiResult = translated[idx];
        // Only trust the API result if it actually changed the text; otherwise keep the dictionary translation.
        const hasApiResult = apiResult && apiResult.trim() && apiResult !== meta.original;
        meta.translated = hasApiResult ? apiResult : meta.translated;
        originalTextRef.current.set(node, meta);
        node.textContent = meta.translated;
      });
      isApplyingRef.current = false;

      const attrElements = Array.from(document.body.querySelectorAll('*'));
      const attrNames = ['placeholder', 'title', 'aria-label', 'value'];
      const attrPayload = [];
      const attrTargets = [];

      attrElements.forEach((el) => {
        if (shouldSkipTranslation(el)) return;
        const isInput = el.tagName === 'INPUT';
        attrNames.forEach((attrName) => {
          if (attrName === 'value') {
            const type = isInput ? ((el.getAttribute('type') || '').toLowerCase()) : '';
            if (!['button', 'submit', 'reset'].includes(type)) return;
          }

          const current = el.getAttribute(attrName);
          if (!current || !current.trim()) return;

          let store = originalAttrRef.current.get(el);
          if (!store) {
            store = {};
            originalAttrRef.current.set(el, store);
          }
          if (!Object.prototype.hasOwnProperty.call(store, attrName)) {
            store[attrName] = current;
          }

          attrPayload.push(store[attrName]);
          attrTargets.push({ el, attrName });
        });
      });

      if (attrPayload.length === 0) return;
      const translatedAttrs = await translateTexts(attrPayload, 'en');
      if (batchTokenRef.current !== runToken) return;

      isApplyingRef.current = true;
      translatedAttrs.forEach((value, idx) => {
        const target = attrTargets[idx];
        if (!target) return;
        const source = attrPayload[idx];
        // Fall back to dictionary translation instead of the untranslated source when the API made no change.
        const hasApiResult = value && value.trim() && value !== source;
        target.el.setAttribute(target.attrName, hasApiResult ? value : translateText(source, 'en'));
      });
      isApplyingRef.current = false;
    };

    const processElementAttrs = (el) => {
      if (shouldSkipTranslation(el)) return;
      const attrList = shouldTranslateValueAttr(el) ? [...attrNames, 'value'] : attrNames;

      attrList.forEach((attrName) => {
        const current = el.getAttribute(attrName);
        if (!current) return;

        let store = originalAttrRef.current.get(el);
        if (!store) {
          store = {};
          originalAttrRef.current.set(el, store);
        }
        if (!Object.prototype.hasOwnProperty.call(store, attrName)) {
          store[attrName] = current;
        } else if (current !== store[attrName] && current !== translateText(store[attrName], 'en')) {
          // The component updated this attribute after initial capture.
          store[attrName] = current;
        }

        const source = store[attrName];
        setAttrSafely(el, attrName, language === 'en' ? translateText(source, 'en') : source);
      });
    };

    const walkAndTranslate = (rootNode) => {
      if (!rootNode) return;

      const walker = document.createTreeWalker(rootNode, NodeFilter.SHOW_TEXT);
      let current;
      while ((current = walker.nextNode())) {
        processTextNode(current);
      }

      if (rootNode.nodeType === Node.ELEMENT_NODE) {
        processElementAttrs(rootNode);
      }

      const elements = rootNode.querySelectorAll ? rootNode.querySelectorAll('*') : [];
      elements.forEach((el) => processElementAttrs(el));
    };

    walkAndTranslate(document.body);
    translateDomWithApi();

    const scheduleApiTranslation = () => {
      if (translateTimerRef.current) {
        clearTimeout(translateTimerRef.current);
      }
      translateTimerRef.current = setTimeout(() => {
        translateDomWithApi();
      }, 120);
    };

    let pending = false;
    let queuedNodes = [];

    const flushQueue = () => {
      pending = false;
      const nodes = queuedNodes;
      queuedNodes = [];
      nodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          processTextNode(node);
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          walkAndTranslate(node);
        }
      });
    };

    const scheduleProcess = (node) => {
      if (!node) return;
      queuedNodes.push(node);
      if (pending) return;
      pending = true;
      requestAnimationFrame(flushQueue);
    };

    const observer = new MutationObserver((mutations) => {
      if (isApplyingRef.current) return;

      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          scheduleProcess(mutation.target);
        }

        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          scheduleProcess(mutation.target);
        }

        mutation.addedNodes.forEach((node) => scheduleProcess(node));
      });

      // Re-run API translation for dynamic content.
      scheduleApiTranslation();
    });

    observer.observe(document.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['placeholder', 'title', 'aria-label', 'value']
    });

    return () => {
      observer.disconnect();
      if (translateTimerRef.current) {
        clearTimeout(translateTimerRef.current);
      }
    };
  }, [language]);

  return null;
};

export default RuntimeTranslator;
