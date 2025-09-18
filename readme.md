## 🚀 Inicio rápido (desarrollo local)

Requisitos mínimos: Node.js 18/20/22 + npm, Git, (opcional) SQL Server en local si vas a usar la base de datos real.

1) Clonar y abrir en un IDE:
```powershell
git clone https://github.com/<org>/<repo>.git
cd Gestion-de-contratos
code .   # opcional: abre la carpeta en el IDLE
```

2) Levantar el backend (Express):
```powershell
cd my-express-api
npm install
nodemon server.js    # http://localhost:3001
```

3) Levantar el frontend (Vite):
```powershell
cd Frontend
npm install
npm run dev       # http://localhost:5173
```

Notas rápidas:
- Si usas DB real, configura `my-express-api/.env` (SQL Server, JWT, Google Drive, etc.).
- El frontend usa `axiosInstance` para apuntar a `http://localhost:3001/api` cuando corres en `localhost`.

---

## Gestión de Contratos — Guía de despliegue (Windows Server + PM2)

Aplicación con frontend React (Vite) y backend Express.js. Backend usa SQL Server con Sequelize y archivos en Google Drive mediante API.

### Licencia y uso
Software interno de Bausch Health. Todos los derechos reservados.

---

## Infraestructura objetivo
- Windows Server 2012 R2 (o similar)
- Node.js LTS (18/20/22) + npm
- Git
- PM2 (administrador de procesos Node)
- SQL Server (puerto típico 1433)

### Rutas y puertos
- Carpeta del proyecto en servidor: `C:\Apps\Gestion-de-contratos`
- Backend: `http://<server-ip>:3001` (API bajo `/api`)
- Frontend: `http://<server-ip>:5173`

---

## Variables de entorno (backend `my-express-api/.env`)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (SQL Server)
- `JWT_SECRET`
- `PORT=3001`
- `FRONTEND_URL=http://localhost:5173,http://<server-ip>:5173`  ← varias permitidas separadas por coma
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_DRIVE_FOLDER_NAME=Contract Management Files` (opcional)

Nota CORS: el backend permite múltiples orígenes. Asegúrate de incluir `localhost` y la IP del servidor.

---

## Instalación inicial en el servidor (una sola vez)
```powershell
mkdir C:\Apps\Gestion-de-contratos
cd C:\Apps\Gestion-de-contratos
git clone https://github.com/<org>/<repo>.git .

# Backend
cd C:\Apps\Gestion-de-contratos\my-express-api
pm2 start server.js --name contract-api --cwd "C:\software\Gestion-de-contratos\my-express-api" --time

# Frontend
cd C:\Apps\Gestion-de-contratos\Frontend
npm install
npm run build

# PM2 procesos
pm2 start server.js --name contract-api --cwd "C:\Apps\Gestion-de-contratos\my-express-api" --time
pm2 serve "C:\Apps\Gestion-de-contratos\Frontend\dist" 5173 --name contract-frontend --spa
pm2 status
pm2 save  
```

Accesos:
- Frontend: `http://<server-ip>:5173`
- Backend salud: `curl.exe -i http://localhost:3001/api/login` (o tu endpoint de salud)

---

## Actualizar después de un `git push` (deploy manual)
```powershell
# 1) Obtener última versión
cd C:\Apps\Gestion-de-contratos
git fetch --all --prune
git checkout main
git reset --hard origin/main
git clean -fd      # elimina archivos y carpetas no rastreados
# Si aún ves basura generada/ignorados (por ejemplo de build), usa:
# git clean -fdx   # incluye ignorados (.gitignore). Más agresivo.

# 2) Backend: instalar y reiniciar
cd C:\Apps\Gestion-de-contratos\my-express-api

pm2 delete contract-api

npm i 

pm2 start server.js --name contract-api --cwd "C:\software\Gestion-de-contratos\my-express-api" --time

pm2 logs contract-api --lines 50

pm2 save

# 3) Frontend: build y recarga
cd C:\Apps\Gestion-de-contratos\Frontend

pm2 delete contract-frontend

npm i

npm run build

pm2 serve "C:\software\Gestion-de-contratos\Frontend\dist" 5173 --name contract-frontend --spa

pm2 logs contract-frontend --lines 30

Pm2 save

# 4) Verificar
pm2 status
```

Si PM2 apunta a otra ruta (UNC o Escritorio), recrea los procesos manualmente:
```powershell
pm2 delete contract-api
pm2 delete contract-frontend
pm2 start server.js --name contract-api --cwd "C:\Apps\Gestion-de-contratos\my-express-api" --time
pm2 serve "C:\Apps\Gestion-de-contratos\Frontend\dist" 5173 --name contract-frontend --spa
pm2 save
```

---

## Actualizaciones

1) Pull latest code
Powershell (admin mode)

```powershell
cd C:\software\Gestion-de-contratos

git fetch --all --prune
git checkout main
git reset --hard origin/main
git clean -fd      # elimina archivos y carpetas no rastreados
# Si aún ves basura generada/ignorados (por ejemplo de build), usa:
# git clean -fdx   # incluye ignorados (.gitignore). Más agresivo.

2) Backend: install and restart
Powershell (admin mode)

```powershell
cd C:\Apps\Gestion-de-contratos\my-express-api
pm2 delete contract-api
pm2 start server.js --name contract-api --cwd "C:\software\Gestion-de-contratos\my-express-api" --time
pm2 logs contract-api --lines 50
pm2 save
```

3)
Powershell (admin mode)

```powershell
cd C:\Apps\Gestion-de-contratos\Frontend
npm install
npm run build
pm2 delete contract-frontend
pm2 serve "C:\software\Gestion-de-contratos\Frontend\dist" 5173 --name contract-frontend --spa
pm2 logs contract-frontend --lines 30
Pm2 save
```

4) Check
Powershell (admin mode)

```powershell
Pm2 status
```

asi es como se va a hacer alguna actualizacion

---

## Comandos útiles de PM2
```powershell
pm2 ls                      # lista procesos
pm2 describe <name> | cat   # detalles (cwd, script)
pm2 logs <name> --lines 100 # ver logs
pm2 restart <name>          # reinicio (API)
pm2 reload <name>           # recarga sin downtime (estático)
pm2 delete <name>           # borrar proceso
pm2 save; pm2 resurrect     # persistencia al reiniciar
pm2 kill                    # mata el daemon si está corrupto
```

---

## Solución de problemas
- **Process X not found / ids cambiantes**: usa `pm2 ls`; maneja por nombre. Si quedó inconsistente: `pm2 delete <name>` y vuelve a crear.
- **PM2 daemon corrupto (EPERM rpc.sock / pm2_env TypeError)**:
  ```powershell
  pm2 kill
  # (opcional) borra carpeta PM2_HOME si está dañada
  # setx PM2_HOME C:\pm2   # para usar una carpeta propia
  ```
- **Vite/UNC path**: no construyas desde `\\SVR2\...`. Usa ruta local `C:\Apps\...`.
- **CORS**: incluye `localhost` y la IP en `FRONTEND_URL`. Preflight debe responder 204 y enviar `Access-Control-Allow-Origin` con el origen solicitado.
- **Descarga de archivos**: el backend debe enviar `Content-Disposition` y exponerlo: `Access-Control-Expose-Headers: Content-Disposition, Content-Length`.
- **Express 5 y preflight**: evita `app.options('*', cors())`; usa middleware que responda 204 a `OPTIONS`.

---

## Desarrollo local
```powershell
# Backend
cd my-express-api
npm install
node server.js   # http://localhost:3001

# Frontend
cd Frontend
npm install
npm run dev      # http://localhost:5173
```

---

© 2025 Bausch Health. Uso interno.
