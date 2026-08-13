# Changelog

## Resumen completo de cambios
Este documento registra todos los cambios realizados en el sistema durante la última actualización. Incluye lo nuevo, lo modificado y lo agregado tanto en frontend como en backend.

### Nuevas funcionalidades agregadas
- Página de perfil de usuario (`/profile`) para ver información personal y subir foto de avatar.
- Selector de idioma multilingüe con soporte para español e inglés.
- Traducción dinámica en tiempo de ejecución desde el frontend mediante un servicio de backend.
- Gestión de usuarios pendientes para administrador: aprobar o rechazar nuevos registros.
- Formulario de creación de administradores con validación de campos y cambio de visibilidad de contraseña.
- Mejora de rutas protegidas y control de acceso a secciones según rol.
- Mejoras en la gestión de contratos para abogados y administradores, incluyendo filtros y estados de contrato.
- Sistema de actualización de perfil que refresca el usuario en sesión tras cambios de avatar o idioma.

### Cambios funcionales en frontend
- `Frontend/src/pages/Profile.jsx`
  - Agrega una página de perfil completa.
  - Permite seleccionar imagen, previsualizarla y subirla.
  - Actualiza datos del usuario en el contexto al subir el avatar.
  - Muestra nombre, email, rol, idioma y país con bandera.

- `Frontend/src/context/LanguageContext.jsx`
  - Añade estado de idioma global.
  - Persiste idioma en `localStorage`.
  - Cambia el atributo `document.documentElement.lang`.
  - Actualiza el perfil en backend cuando el usuario cambia el idioma.

- `Frontend/src/components/LanguageSelector.jsx`
  - Crea una UI para cambiar idioma con presentación compacta y barra lateral.
  - Incluye banderas y botones de selección.
  - Integra un botón para navegar al perfil desde el selector.

- `Frontend/src/components/RuntimeTranslator.jsx`
  - Añade un traductor de textos en ejecución.
  - Normaliza acentos y busca palabras en español para traducirlas a inglés.
  - Sirve como capa de soporte cuando el contenido no está directamente traducido usando archivos estáticos.

- `Frontend/src/api/translations.js`
  - Define la llamada a `/translations/batch` para obtener traducciones desde el backend.
  - Implementa caché local de traducciones para evitar llamadas repetidas.

- `Frontend/src/api/profile.js`
  - Implementa `getProfile` y `updateProfile`.
  - Soporta envíos `FormData` para avatar e información de perfil.
  - Limpia caché de axios para forzar datos frescos después de cambios.

- `Frontend/src/context/AuthContext.jsx`
  - Mejora la inicialización de la sesión con validación de token expirado.
  - Normaliza y carga datos del usuario de manera más robusta.
  - Añade `refreshUser` para obtener datos actualizados del perfil.
  - Mejora `login` con mensajes de error y limpieza de estado anterior.
  - Mejora `logout` con limpieza completa de almacenamiento local.

- `Frontend/src/App.jsx`
  - Agrega la ruta protegida `/profile`.
  - Añade carga diferida (`lazy`) optimizada para páginas grandes.
  - Inserta `RuntimeTranslator` global para traducción automática.
  - Pre-carga agresiva de páginas importantes si el usuario ya está logueado.

- `Frontend/src/pages/AdminUsers.jsx`
  - Página de administrador para aprobar/ rechazar usuarios pendientes.
  - Usa actualizaciones optimistas y recarga de lista tras acciones.
  - Muestra notificaciones de éxito o error.

- `Frontend/src/pages/CreateAdmin.jsx`
  - Formulario para crear nuevos administradores.
  - Valida nombre, apellido, email, contraseña y confirmación.
  - Incluye selección de país.

- `Frontend/src/components/ContractForm.jsx`
  - Mejora lógica de validación de contratos.
  - Agrega textos y mensajes más descriptivos.
  - Soporta diferentes tipos de contratos y campos dependientes.

- `Frontend/src/components/ContractFullDetail.jsx`
  - Mejora la vista detallada de contrato.
  - Añade estados y etiquetas más claras.

- `Frontend/src/components/ContractFilters.jsx`
  - Mejora filtros de listado con búsqueda y ordenamiento.

- `Frontend/src/components/Layout.jsx`
  - Ajustes de estructura, diseño y organización general.

- `Frontend/src/components/Loginform.jsx`
  - Ajustes de formulario de login.
  - Mejor manejo de errores y estados de carga.

- `Frontend/src/components/ProtectedRoute.jsx`
  - Mejora el control de rutas privadas.
  - Asegura que solo usuarios autenticados accedan a ciertas páginas.

- Otras páginas actualizadas con cambios de estilo, validación y permisos:
  - `Home.jsx`
  - `Login.jsx`
  - `Register.jsx`
  - `Frontend/src/pages/user/UserSentContracts.jsx`
  - `Frontend/src/pages/AdminContractDetail.jsx`
  - `Frontend/src/pages/AdminContracts.jsx`
  - `Frontend/src/pages/Trazabilidad.jsx`
  - `Frontend/src/pages/ContractTracePage.jsx`
  - `Frontend/src/pages/OtrosiForm.jsx`

### Cambios en backend
- `my-express-api/routes/translations.js`
  - Añadida ruta `POST /api/translations/batch`.
  - Recibe un arreglo de textos y devuelve su traducción.
  - Usa autenticación para proteger la ruta.

- `my-express-api/services/translationService.js`
  - Implementa traducción con LibreTranslate.
  - Añade caché local y omite textos irrelevantes.
  - Gestiona fallos de la API y devuelve el texto original en caso de error.

- `my-express-api/routes/profile.js`
  - Agrega `GET /api/profile` para obtener datos del usuario.
  - Agrega `PUT /api/profile` para actualizar perfil y subir avatar.
  - Usa `multer` para almacenar imágenes en `my-express-api/uploads/`.
  - Normaliza el lenguaje preferido y guarda la ruta de avatar.

- `my-express-api/routes/admin.js`
  - Agrega endpoints de administración de usuarios pendientes.
  - Permite aprobar y rechazar usuarios nuevos.
  - Incluye creación de administradores desde frontend.

- `my-express-api/routes/contracts.js`
  - Mejora las consultas de contratos por estado y por rol.
  - Añade filtrado por país del usuario para seguridad y segmentación.
  - Optimiza inclusiones de relaciones en consultas.
  - Maneja errores y evita exposiciones directas de datos cuando falla la consulta.

- `my-express-api/middleware/contractAuth.js`
  - Mejora autorización sobre contratos.
  - Garantiza que solo usuarios autorizados accedan a información de contrato.

- `my-express-api/models/User.js`
  - Actualiza el modelo de `User` para incluir campos como `avatar`, `preferredLanguage` y país.
  - Mejora validación de datos.

- `my-express-api/models/Contract.js`
  - Ajustes para nuevos estados de contrato y relaciones con otros módulos.
  - Mejora el manejo de `otrosi` y trazabilidad.

- `my-express-api/services/contractFileService.js`
  - Actualiza la gestión de archivos de contrato.
  - Incluye casos de subida y manejo de PDFs.

- `my-express-api/services/otrosiFileService.js`
  - Mejora el manejo de archivos en procesos de otrosí.

- `my-express-api/routes/files.js`
  - Ajustes en el manejo de archivos de contrato y otrosí.

- `my-express-api/routes/login.js`
  - Ajustes de inicio de sesión y respuestas.

- `my-express-api/routes/otrosi.js`
  - Cambios en la lógica de otrosí y estados de firma.

- `my-express-api/routes/traceability.js`
  - Ajustes de trazabilidad para registrar acciones y estados.

- `my-express-api/server.js`
  - Registro de nuevas rutas y middleware.
  - Ajusta configuración de CORS, rutas estáticas y manejo de archivos.

### Archivos nuevos y paquetes añadidos
- `Frontend/public/flags/` : íconos de banderas para selector de idioma.
- `Frontend/src/api/translations.js` : cliente de API de traducción.
- `Frontend/src/components/LanguageSelector.jsx` : selector de idioma.
- `Frontend/src/components/RuntimeTranslator.jsx` : traductor en tiempo real.
- `Frontend/src/context/LanguageContext.jsx` : contexto global de idioma.
- `Frontend/src/pages/Profile.jsx` : página de perfil.
- `my-express-api/create-regular-user.js` : script de creación de usuario regular.
- `my-express-api/routes/translations.js` : ruta de backend para traducciones.
- `my-express-api/services/translationService.js` : servicio de traducción.
- `my-express-api/tests/countryLanguageNormalization.test.js` : prueba de normalización de idioma/país.
- `my-express-api/tmp-login-check.js` : script auxiliar temporal de login.
- `my-express-api/uploads/` : carpeta para archivos subidos.
- `my-express-api/utils/` : utilidades auxiliares.

### Cambios en base de datos
- `base_de_datos.sql` se actualizó para reflejar campos nuevos y ajustes de datos relacionados con usuarios, contratos y otrosí.

### Detalles de commits recientes
- `d8c12717` — Corregir responsive de carga de archivos.
- `d1465333` — Compactar tarjetas admin y dejar solo eliminación.
- `40c989c9` — Ajustar vista admin al estilo de contratos y detalle completo.
- `1621c573` — Habilitar gestión de contratos para administrador.
- `d62309a2` — Actualizaciones generales.

## ¿Qué cambió exactamente?
- Se agregó la gestión completa de perfil de usuario con avatar.
- Se agregó un sistema de idiomas en frontend que también guarda la preferencia en el backend.
- Se añadió un traductor dinámico de textos entre español e inglés.
- Se incluyó una sección de administración para moderar nuevos registros.
- Se incorporó una página para crear nuevos administradores desde el panel.
- Se mejoró la lógica de contratos para roles de abogado, administrador y usuario.
- Se mejoró la seguridad y autorización de rutas API de contratos.
- Se mejoraron y reescribieron varias páginas y componentes para UI/UX más consistente.

## Recomendación
Mantén este archivo actualizado con cada cambio importante para documentar claramente qué se agregó, qué se cambió y por qué.
