# 🔍 Troubleshooting Visual - Deployment AEGG

## 🎯 Diagnóstico Rápido

### ¿Qué no funciona?

```
┌─────────────────────────────────────────┐
│ ¿Frontend carga?                        │
│   ├─ NO → Ver Sección A                │
│   └─ SÍ → ¿Backend responde?           │
│            ├─ NO → Ver Sección B       │
│            └─ SÍ → ¿Login funciona?    │
│                     ├─ NO → Ver Sección C│
│                     └─ SÍ → ¿CRUD OK?  │
│                              ├─ NO → Ver Sección D│
│                              └─ SÍ → ✅ TODO OK│
└─────────────────────────────────────────┘
```

---

## 📋 SECCIÓN A: Frontend No Carga

### Síntomas

- ❌ `https://aegg.creapolis.mx` muestra 404
- ❌ `https://aegg.creapolis.mx` muestra página en blanco
- ❌ `https://aegg.creapolis.mx` da error de SSL

### Diagnóstico

#### 1. Verificar que archivos existen

```bash
ssh root@74.208.234.244
ls -la /var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

**Debe mostrar:**

```
total 100
-rw-r--r-- 1 www-data www-data  5123 Oct 25 10:00 index.html
drwxr-xr-x 2 www-data www-data  4096 Oct 25 10:00 assets
-rw-r--r-- 1 www-data www-data   123 Oct 25 10:00 vite.svg
```

**Si NO hay archivos:**

```bash
# Copiar frontend dist
cd /tmp/deployment-package
cp -r frontend-dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

#### 2. Verificar permisos

```bash
ls -la /var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

**Permisos correctos:**

- Directorios: `drwxr-xr-x` (755)
- Archivos: `-rw-r--r--` (644)
- Owner: `www-data` o usuario de Plesk

**Si permisos incorrectos:**

```bash
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg/httpdocs/
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

#### 3. Verificar dominio en Plesk

**Checklist:**

- [ ] Subdominio `aegg` existe en Plesk
- [ ] Document root apunta a `/var/www/vhosts/creapolis.mx/aegg/httpdocs`
- [ ] DNS apuntando a `74.208.234.244`
- [ ] Apache/Nginx rewrite rules configuradas

**Rewrite rules correctas (Apache):**

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
```

#### 4. Verificar SSL

```bash
# Test SSL
curl -I https://aegg.creapolis.mx
```

**Debe mostrar:**

```
HTTP/2 200
content-type: text/html
```

**Si error SSL:**

- Ir a Plesk → aegg.creapolis.mx → SSL/TLS Certificates
- Let's Encrypt → Get it free
- Wait for issuance (2-3 minutos)

#### 5. Ver logs de error

```bash
# Apache
tail -f /var/log/httpd/error_log | grep aegg

# Nginx
tail -f /var/log/nginx/error.log | grep aegg
```

---

## 📋 SECCIÓN B: Backend No Responde

### Síntomas

- ❌ `https://aegg-api.creapolis.mx` muestra 502 Bad Gateway
- ❌ `https://aegg-api.creapolis.mx` muestra 504 Gateway Timeout
- ❌ Frontend muestra errores de network en consola

### Diagnóstico

#### 1. Verificar que PM2 está corriendo

```bash
ssh root@74.208.234.244
pm2 status
```

**Debe mostrar:**

```
┌────┬─────────────────┬─────────┬─────────┬───────────┬──────────┐
│ id │ name            │ mode    │ ↺       │ status    │ cpu      │
├────┼─────────────────┼─────────┼─────────┼───────────┼──────────┤
│ 0  │ aegg-backend    │ cluster │ 0       │ online    │ 0%       │
└────┴─────────────────┴─────────┴─────────┴───────────┴──────────┘
```

**Si muestra `stopped` o `errored`:**

```bash
pm2 logs aegg-backend --lines 50
# Leer el error

# Intentar restart
pm2 restart aegg-backend

# Si falla, verificar .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env
```

**Si no aparece en pm2 list:**

```bash
cd /var/www/vhosts/creapolis.mx/aegg-api
pm2 start ecosystem.config.js
pm2 save
```

#### 2. Verificar que backend escucha en puerto 3000

```bash
netstat -tlnp | grep :3000
# O
ss -tlnp | grep :3000
```

**Debe mostrar:**

```
tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  12345/node
```

**Si NO está escuchando:**

```bash
# Ver logs de PM2
pm2 logs aegg-backend --lines 100

# Problemas comunes:
# - Error de conexión a BD
# - Puerto ya en uso
# - Error en código (syntax error)
```

#### 3. Verificar conexión local

```bash
curl http://localhost:3000
```

**Debe responder:**

```json
{ "message": "Backend is running" }
```

O similar.

**Si no responde:**

- Backend no está iniciado
- Error en la aplicación
- Ver logs: `pm2 logs aegg-backend`

#### 4. Verificar proxy reverso en Plesk

**Checklist:**

- [ ] Subdominio `aegg-api` existe
- [ ] Nginx directives configuradas
- [ ] Proxy pass apunta a `http://localhost:3000`

**Nginx directives correctas:**

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

**Test desde exterior:**

```bash
curl -I https://aegg-api.creapolis.mx
```

#### 5. Ver logs detallados

```bash
# PM2 logs
pm2 logs aegg-backend --lines 200

# Nginx error log
tail -f /var/log/nginx/error.log | grep aegg-api

# System logs
journalctl -u nginx -n 50
```

---

## 📋 SECCIÓN C: Login No Funciona

### Síntomas

- ❌ Login muestra "Network Error"
- ❌ Login muestra "CORS Error"
- ❌ Login muestra "Unauthorized"
- ❌ Login se queda en "Loading..."

### Diagnóstico

#### 1. Verificar CORS

**Abrir consola del navegador (F12):**

**Si ves:**

```
Access to XMLHttpRequest at 'https://aegg-api.creapolis.mx'
from origin 'https://aegg.creapolis.mx' has been blocked by CORS policy
```

**Solución:**

```bash
ssh root@74.208.234.244

# Verificar .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env | grep CORS

# Debe mostrar:
CORS_ORIGIN=https://aegg.creapolis.mx

# Si está mal, editar:
nano /var/www/vhosts/creapolis.mx/aegg-api/backend/.env
# Cambiar a: CORS_ORIGIN=https://aegg.creapolis.mx
# Guardar: Ctrl+O, Enter, Ctrl+X

# Reiniciar
pm2 restart aegg-backend
```

#### 2. Verificar URL del API en frontend

**En navegador (F12 → Network → filtrar "login"):**

**Debe hacer request a:**

```
https://aegg-api.creapolis.mx/auth/login
```

**Si hace request a localhost o URL incorrecta:**

El build del frontend tiene URL incorrecta.

**Verificar `.env.production` local:**

```powershell
# En tu máquina
cat frontend\.env.production
```

**Debe contener:**

```
VITE_API_URL=https://aegg-api.creapolis.mx
```

**Si está mal:**

```powershell
# Corregir
notepad frontend\.env.production
# Cambiar a: VITE_API_URL=https://aegg-api.creapolis.mx

# Rebuild
cd frontend
npm run build

# Re-subir al servidor
scp -r dist/* root@74.208.234.244:/var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

#### 3. Verificar base de datos

**Test conexión:**

```bash
ssh root@74.208.234.244
psql -U aegg_user -d aegg_db
```

**Si error de conexión:**

```bash
# Verificar credenciales en .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env

# Verificar que PostgreSQL esté corriendo
systemctl status postgresql

# Ver usuarios
sudo -u postgres psql -c "\du"

# Ver bases de datos
sudo -u postgres psql -c "\l"
```

**Si no existe el usuario:**

```bash
sudo -u postgres psql
CREATE USER aegg_user WITH ENCRYPTED PASSWORD 'TU_PASSWORD';
CREATE DATABASE aegg_db;
GRANT ALL PRIVILEGES ON DATABASE aegg_db TO aegg_user;
\q
```

#### 4. Verificar que usuarios existen

```bash
psql -U aegg_user -d aegg_db

-- Ver tablas
\dt

-- Ver usuarios
SELECT * FROM "user";

-- Si no hay usuarios, crear uno:
-- (Necesitarás hashear el password con bcrypt)
\q
```

**Si no hay usuarios, crear desde el frontend:**

- Ir a página de registro
- Crear usuario de prueba

---

## 📋 SECCIÓN D: CRUD No Funciona

### Síntomas

- ❌ Error al crear trabajos
- ❌ No se muestran trabajos existentes
- ❌ Error al subir Excel
- ❌ 500 Internal Server Error

### Diagnóstico

#### 1. Ver error específico

**Consola del navegador (F12 → Console):**

- Leer mensaje de error
- Anotar status code (500, 400, 404, etc.)

**PM2 logs:**

```bash
ssh root@74.208.234.244
pm2 logs aegg-backend --lines 100
```

#### 2. Problemas comunes

##### A. Error 500 al crear trabajo

**Causa:** Problema con base de datos o relaciones

```bash
# Ver logs
pm2 logs aegg-backend --err --lines 50

# Verificar que tablas existan
psql -U aegg_user -d aegg_db
\dt
# Debe mostrar: trabajo, mes, reporte_mensual, user
\q
```

**Si faltan tablas:**

```bash
cd /var/www/vhosts/creapolis.mx/aegg-api/backend

# Ejecutar migraciones (si las tienes)
npm run typeorm migration:run

# O sincronizar schema (CUIDADO en producción)
# Agregar en .env:
# TYPEORM_SYNCHRONIZE=true
# Restart PM2
# Quitar después
```

##### B. Error al subir Excel

**Causa:** Límite de tamaño de archivo

**Ver tamaño límite en Plesk:**

- PHP Settings → `upload_max_filesize`
- Debe ser al menos 25M

**Ver logs:**

```bash
pm2 logs aegg-backend | grep -i excel
pm2 logs aegg-backend | grep -i multer
```

##### C. No se muestran trabajos

**Causa:** JWT inválido o problema de autenticación

**Verificar en consola (F12 → Network → Headers):**

```
Authorization: Bearer eyJhbGciOiJ...
```

**Debe existir header Authorization.**

**Si no hay header:**

- Problema con localStorage
- Limpiar cache y volver a hacer login

**Si hay header pero 401 Unauthorized:**

- JWT_SECRET en servidor diferente al usado para crear token
- Verificar JWT_SECRET en `.env` del servidor

---

## 🔄 Soluciones Rápidas

### Reiniciar todo

```bash
ssh root@74.208.234.244

# Reiniciar backend
pm2 restart aegg-backend

# Reiniciar nginx
systemctl restart nginx

# Reiniciar PostgreSQL
systemctl restart postgresql

# Ver estado
pm2 status
systemctl status nginx
systemctl status postgresql
```

### Limpiar logs y cache

```bash
# Limpiar logs de PM2
pm2 flush

# Ver logs desde cero
pm2 logs aegg-backend
```

### Verificación completa

```bash
#!/bin/bash
echo "=== HEALTH CHECK ==="

# 1. PM2
echo -n "PM2: "
pm2 list | grep -q "aegg-backend.*online" && echo "✅" || echo "❌"

# 2. Puerto 3000
echo -n "Port 3000: "
netstat -tlnp | grep -q ":3000" && echo "✅" || echo "❌"

# 3. PostgreSQL
echo -n "PostgreSQL: "
systemctl is-active --quiet postgresql && echo "✅" || echo "❌"

# 4. Frontend files
echo -n "Frontend: "
[ -f "/var/www/vhosts/creapolis.mx/aegg/httpdocs/index.html" ] && echo "✅" || echo "❌"

# 5. Backend public
echo -n "Backend API: "
curl -sf https://aegg-api.creapolis.mx > /dev/null && echo "✅" || echo "❌"

# 6. Frontend public
echo -n "Frontend: "
curl -sf https://aegg.creapolis.mx > /dev/null && echo "✅" || echo "❌"
```

---

## 📊 Códigos de Error Comunes

### HTTP Status Codes

| Code     | Significado           | Causa Probable          | Solución                         |
| -------- | --------------------- | ----------------------- | -------------------------------- |
| **502**  | Bad Gateway           | Backend no responde     | Verificar PM2, reiniciar backend |
| **504**  | Gateway Timeout       | Backend muy lento       | Verificar BD, optimizar queries  |
| **500**  | Internal Server Error | Error en código backend | Ver `pm2 logs`                   |
| **404**  | Not Found             | Ruta incorrecta         | Verificar URL, rewrite rules     |
| **401**  | Unauthorized          | Token inválido          | Verificar JWT_SECRET, re-login   |
| **403**  | Forbidden             | Permisos insuficientes  | Verificar permisos de archivos   |
| **400**  | Bad Request           | Datos inválidos         | Ver validaciones en backend      |
| **CORS** | CORS Error            | CORS mal configurado    | Ver CORS_ORIGIN en .env          |

---

## 📞 Checklist de Diagnóstico Completo

```
[ ] PM2 muestra "online" para aegg-backend
[ ] Puerto 3000 escucha localmente
[ ] PostgreSQL está corriendo
[ ] Credenciales de BD en .env son correctas
[ ] JWT_SECRET está configurado (32+ chars)
[ ] CORS_ORIGIN en .env es https://aegg.creapolis.mx
[ ] Frontend .env.production tiene VITE_API_URL correcto
[ ] Archivos de frontend existen en httpdocs
[ ] Permisos de archivos son 644/755
[ ] Owner de archivos es www-data
[ ] Dominios en Plesk están creados
[ ] DNS apunta a 74.208.234.244
[ ] SSL está activo (Let's Encrypt)
[ ] Nginx proxy pass configurado
[ ] Apache rewrite rules configurados
[ ] curl http://localhost:3000 responde
[ ] curl https://aegg-api.creapolis.mx responde
[ ] curl https://aegg.creapolis.mx responde
[ ] No hay errores en pm2 logs
[ ] No hay errores en nginx error.log
[ ] Tablas de BD existen (\dt en psql)
[ ] Usuario de prueba existe en BD
```

---

**Si después de todo esto sigue sin funcionar:**

1. Tomar screenshot del error
2. Copiar últimas 100 líneas de `pm2 logs`
3. Copiar contenido de `.env` (sin mostrar passwords)
4. Verificar cada item del checklist arriba
5. Consultar DEPLOYMENT-GUIDE.md sección Troubleshooting

¡Buena suerte! 🚀
