# my-express-api (Express.js + SQL Server + Google Drive)

Backend del sistema de Gestión de Contratos. Expone endpoints REST para autenticación, contratos, otrosí, archivos y trazabilidad. Almacena documentos en Google Drive y datos en SQL Server mediante Sequelize.

---

## Arquitectura
- Express 5 (middleware y routing)
- Sequelize + MS SQL Server (mssql/tedious)
- JWT para autenticación (Authorization: Bearer <token>)
- CORS con lista blanca de orígenes conocidos
- Subida de archivos en memoria (multer.memoryStorage) + Google Drive API
- Descargas vía streaming (pipe de Google Drive → respuesta HTTP)

Flujo en `server.js`:
1) Carga `.env` y muestra chequeo de variables.
2) Configura CORS con orígenes permitidos y maneja preflight devolviendo 204.
3) `express.json()` para parseo de JSON.
4) Conecta a SQL Server con Sequelize, `sync({ force: false })` y arranca `app.listen`.
5) Registra rutas: `/api/login`, `/api/contracts`, `/api/otrosi`, `/api/profile`, `/api/traceability`.

---

## Variables de entorno (`my-express-api/.env`)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `PORT` (3001 por defecto)
- `FRONTEND_URL` (múltiples orígenes separados por coma, ej. `http://localhost:5173,http://10.255.6.4:5173`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_NAME` (ej. `Contract Management Files`)

Notas:
- SQL Server usa `trustServerCertificate: true` en `config/database.js`.
- Estado de `.env`: `GET /api/env-check`.

---

## Modelos (Sequelize)
- `User` (roles: `regular`, `lawyer`)
- `Contract`, `ContractViewer`
- `ContractFile` (guarda ID de Google Drive en `filepath`/`driveFileId`)
- `Otrosi`, `OtrosiFile`
- `ContractHistory`

Asociaciones clave en `models/associations.js`.

---

## Autenticación
- `POST /api/login` retorna JWT.
- Middleware `middleware/auth.js` valida token y adjunta `req.user`.

---

## Rutas

Login
- `POST /api/login`
- `POST /api/login/register`

Perfil (protegido)
- `GET /api/profile`
- `PUT /api/profile`

Contratos (protegido)
- `GET /api/contracts`
- `GET /api/contracts/:id`
- `POST /api/contracts` (sube PDFs a Google Drive desde memoria)
- `POST /api/contracts/:id/respond`
- `POST /api/contracts/:id/sign`
- `POST /api/contracts/:id/return`
- Archivos: `GET /api/contracts/files/:fileId/download`, `GET /api/contracts/files/:fileId/metadata`
- Trazabilidad: `GET /api/traceability/contracts/:id`

Otrosí (protegido)
- `GET /api/otrosi`
- `GET /api/otrosi/contract/:contractId`
- `POST /api/otrosi` (carta, firma, etc. a Google Drive)
- `POST /api/otrosi/:id/action` (sign/respond/return)
- Archivos: `GET /api/otrosi/files/:fileId/download`, `GET /api/otrosi/files/:fileId/metadata`

---

## CORS y preflight
- Orígenes permitidos en `server.js` (ajusta IP/URLs).
- Preflight: middleware devuelve 204 para `OPTIONS` (compatibilidad con Express 5).
- Si el frontend necesita leer `Content-Disposition`, expón cabeceras con `Access-Control-Expose-Headers` en el endpoint de descarga.

---

## Google Drive
- Autenticación OAuth2 con refresh token.
- Carpetas: principal `Contract Management Files` + subcarpetas `Contract Files` y `Otrosi Files`.
- Subida desde memoria (sin archivos temporales), con reintentos/backoff.
- Descarga por streaming a la respuesta HTTP.

---

## Ejecutar

Desarrollo local
```powershell
cd my-express-api
npm install
node server.js  # http://localhost:3001
```

Producción (PM2)
```powershell
pm2 start server.js --name contract-api --cwd "C:\Apps\Gestion-de-contratos\my-express-api" --time
pm2 restart contract-api
pm2 logs contract-api --lines 100
```

---

## Pruebas rápidas
- Env: `GET /api/env-check`
- Login: `POST /api/login` (email/password)
- Contratos: `GET /api/contracts` con `Authorization: Bearer <token>`
- Descarga: `GET /api/contracts/files/:fileId/download`

---

## Troubleshooting
- SQL Server: verifica servicio, credenciales y puerto 1433; mira logs al iniciar.
- CORS: revisa orígenes y preflight 204. Test:
  ```powershell
  curl.exe -i -X OPTIONS http://localhost:3001/api/login ^
    -H "Origin: http://10.255.6.4:5173" ^
    -H "Access-Control-Request-Method: POST" ^
    -H "Access-Control-Request-Headers: content-type,authorization"
  ```
- Express 5 `path-to-regexp`: mitigado evitando `app.options('*', ...)`.
- Descargas: si usas axios, pide `responseType: 'blob'` y dispara descarga manual; o navega directo al endpoint.
- Google Drive: valida credenciales y formato de IDs.

---

© 2025 Bausch Health — Uso interno
