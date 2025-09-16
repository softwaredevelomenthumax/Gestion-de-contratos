## Frontend (React + Vite) — Guía de uso y despliegue

Aplicación React (Vite) para Gestión de Contratos. Consume la API de `my-express-api` y maneja autenticación JWT, subida/descarga de archivos, y navegación protegida.

---

### Arquitectura básica
- Vite + React + React Router
- UI con Tailwind y componentes locales en `Frontend/src/components`
- Lógica de API centralizada en `Frontend/src/api/axiosInstance.js`
- Contextos: `AuthContext` (auth), `RefreshContext` y `NotificationContext`
- Rutas protegidas con `ProtectedRoute`

---

### API base y CORS
- Archivo: `Frontend/src/api/axiosInstance.js`
- Cómo elige la URL del backend:
  - Si el navegador está en `localhost`, usa `http://localhost:3001/api`
  - Si no, usa `http://10.255.6.4:3001/api`
- Para cambiar la IP del servidor, edita la lógica de `getApiBaseUrl()` en `axiosInstance.js`.
- Asegúrate de que el backend permita el origen del frontend en CORS (`http://localhost:5173` y `http://<server-ip>:5173`).

Interceptors:
- Request: añade `Authorization: Bearer <token>` si existe en `localStorage` y verifica coherencia con el usuario guardado.
- Response: ante `401/403`, limpia sesión y redirige a `/login`.

---

### Autenticación
- `AuthContext` guarda `token` y `user` en `localStorage`.
- `ProtectedRoute` bloquea acceso si no hay usuario/Token válido.
- Endpoints usados: `POST /api/login`, `GET /api/profile` (backend).

---

### Scripts
```bash
npm run dev      # Desarrollo en http://localhost:5173
npm run build    # Compilar a producción en ./dist
npm run preview  # Servir build localmente (no usar en servidor productivo)
```

---

### Despliegue manual en Windows Server con PM2 (solo frontend)
Primera vez (crear proceso estático):
```powershell
cd C:\Apps\Gestion-de-contratos\Frontend
npm install
npm run build
pm2 serve "C:\Apps\Gestion-de-contratos\Frontend\dist" 5173 --name contract-frontend --spa
pm2 status
pm2 save  # opcional para resurrect
```

Actualizaciones después de un git push:
```powershell
cd C:\Apps\Gestion-de-contratos\Frontend
npm install
npm run build
pm2 reload contract-frontend
pm2 logs contract-frontend --lines 30
```

Abrir en navegador: `http://<server-ip>:5173`

---

### Descargas de archivos
- Los endpoints de descarga devuelven streams desde el backend.
- En el cliente, se usa `responseType: 'blob'` y se dispara la descarga creando un enlace temporal.
- El backend debe exponer cabeceras como `Content-Disposition` si se necesita el nombre de archivo.

Utilidades incluidas:
- Hook `useDownload` y componente `DownloadingAnimation` para UX durante descargas.

---

### Estructura relevante
- `src/api/axiosInstance.js` base Axios, auth interceptors
- `src/api/*.js` módulos por feature (`auth`, `contracts`, `otrosi`, `profile`, `file`)
- `src/context/*` contextos de Auth, Refresh y Notifications
- `src/components/*` UI y vistas de detalle/listado
- `src/pages/*` páginas protegidas por rol/estado

---

### Troubleshooting
- “Network Error” o `ERR_CONNECTION_REFUSED` en login:
  - Verifica que el backend corre en `http://<server-ip>:3001` y la IP en `axiosInstance.js`.
- Error CORS: agrega la URL del frontend en la whitelist del backend; refresca con Ctrl+F5.
- Cambios no visibles tras deploy: limpia caché fuerte (Ctrl+F5) y revisa `pm2 logs contract-frontend`.

---

© 2025 Bausch Health — Uso interno
