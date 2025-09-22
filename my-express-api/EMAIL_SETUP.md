# Email Service Setup - Sistema de Gestión de Contratos

## Configuración SMTP

El sistema de email está configurado para usar el servidor SMTP interno de Bausch Health Companies.

### Variables de Entorno (`.env`)

Asegúrate de tener las siguientes variables en tu archivo `.env`:

```env
SMTP_HOST=161.242.68.103
SMTP_PORT=25
FROM_EMAIL=it.latam@valeant.com
```

## Funcionalidades Implementadas

### 1. Notificaciones de Contratos

#### Creación de Contrato
- ✅ **Usuario**: Recibe confirmación de que el contrato fue creado
- ✅ **Abogados**: Reciben notificación de nuevo contrato para revisión

#### Cambios de Estado
- ✅ **Todas las partes**: Notificación cuando el estado del contrato cambia
- ✅ **Acciones requeridas**: Notificación específica cuando se requiere una acción

#### Estados que Generan Notificaciones
- `new` → `awaiting_lawyer_review`: Notifica a abogados
- `awaiting_lawyer_review` → `awaiting_user_response`: Notifica al usuario
- `awaiting_user_response` → `awaiting_signature`: Notifica para firma
- `awaiting_signature` → `signed`: Notifica a todos los involucrados
- Estados de Otrosí: Misma lógica con prefijo `otrosi_`

### 2. Notificaciones de Usuario

#### Registro
- ✅ **Usuario**: Confirmación de registro exitoso
- ✅ **Administradores**: Notificación de nuevo usuario pendiente

#### Aprobación/Rechazo
- ✅ **Usuario**: Notificación de cuenta aprobada
- ✅ **Usuario**: Notificación de cuenta rechazada

## Endpoints de Email

### Verificación de Configuración
```http
GET /api/env-check
```

Respuesta incluye el estado de las variables SMTP:
```json
{
  "env_status": {
    "SMTP_HOST": "161.242.68.103",
    "SMTP_PORT": "25", 
    "FROM_EMAIL": "it.latam@valeant.com"
  }
}
```

### Prueba de Email
```http
POST /api/test-email
Content-Type: application/json

{
  "to": "usuario@ejemplo.com",
  "subject": "Prueba de Email",
  "message": "Este es un mensaje de prueba"
}
```

## Plantillas de Email

Todas las plantillas incluyen:
- ✅ Diseño responsive con HTML/CSS inline
- ✅ Colores corporativos y diseño profesional
- ✅ Información detallada del contrato/usuario
- ✅ Instrucciones claras sobre próximos pasos

### Tipos de Plantillas

1. **Contrato Creado**: Confirmación para el usuario
2. **Cambio de Estado**: Notificación de actualización
3. **Acción Requerida**: Solicitud específica de acción
4. **Registro de Usuario**: Confirmación de registro
5. **Aprobación de Usuario**: Cuenta activada
6. **Rechazo de Usuario**: Cuenta no aprobada
7. **Nuevo Usuario (Admin)**: Notificación a administradores

## Manejo de Errores

- ❌ **Errores de email NO fallan las operaciones principales**
- ✅ Los errores se registran en los logs del servidor
- ✅ Las operaciones (crear contrato, aprobar usuario, etc.) continúan normalmente
- ✅ Logs detallados para debugging

## Logs de Email

El sistema registra:
```
✅ Email de creación de contrato enviado a: usuario@ejemplo.com
✅ Email de nuevo contrato enviado a abogados: ["abogado1@ejemplo.com", "abogado2@ejemplo.com"]
❌ Error enviando email de creación: Connection timeout
```

## Configuración del Servidor SMTP

### Configuración Actual
- **Host**: 161.242.68.103
- **Puerto**: 25 (sin TLS)
- **Autenticación**: No requerida
- **TLS**: `rejectUnauthorized: false` (permite certificados auto-firmados)

### Verificación de Conexión

El servicio incluye un método para verificar la conexión:
```javascript
const emailService = require('./services/emailService');
const test = await emailService.testConnection();
console.log(test); // { success: true, message: 'SMTP connection verified' }
```

## Personalización

### Agregar Nuevas Plantillas

1. Agregar método en `emailService.js`:
```javascript
async sendCustomNotification(userEmail, data) {
  const subject = 'Mi Notificación Personalizada';
  const html = this.getCustomTemplate(data);
  return await this.sendEmail({ to: userEmail, subject, html });
}
```

2. Agregar plantilla HTML:
```javascript
getCustomTemplate(data) {
  return `<div>...HTML personalizado...</div>`;
}
```

### Modificar Plantillas Existentes

Las plantillas están en métodos como:
- `getContractCreatedTemplate()`
- `getUserApprovalTemplate()`
- etc.

Simplemente modifica el HTML en estos métodos.

## Troubleshooting

### Email no se envía
1. Verificar variables de entorno: `GET /api/env-check`
2. Probar conexión: `POST /api/test-email`
3. Revisar logs del servidor
4. Verificar conectividad de red al servidor SMTP

### Plantillas no se ven bien
- Las plantillas usan CSS inline para máxima compatibilidad
- Testear en diferentes clientes de email
- Usar herramientas como Litmus para testing

### Performance
- Los emails se envían de forma asíncrona
- Los errores no afectan el flujo principal
- Considerar implementar cola de emails para alto volumen

## Próximos Pasos

Funcionalidades adicionales que se podrían implementar:

- 📧 **Recordatorios**: Emails automáticos para contratos pendientes
- 📊 **Reportes**: Resúmenes semanales/mensuales por email
- 🔔 **Notificaciones de vencimiento**: Alertas antes del vencimiento
- 📱 **Plantillas móviles**: Optimización adicional para móviles
- 🔄 **Cola de emails**: Sistema de cola para mejor performance
- 📈 **Métricas**: Tracking de emails enviados/abiertos
