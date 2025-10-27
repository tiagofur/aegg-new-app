# 🎯 Guía Rápida: Deployment en Plesk Obsidian

## 📝 Resumen de las 3 Opciones

### ✅ OPCIÓN 1: Manual con PM2 (RECOMENDADA PARA PRINCIPIANTES)

**Dificultad:** ⭐⭐ Media  
**Tiempo:** 30-45 minutos  
**Pros:** Control total, fácil debugging, documentación abundante  
**Contras:** Configuración manual

### 🐳 OPCIÓN 2: Docker con Plesk

**Dificultad:** ⭐⭐⭐ Alta  
**Tiempo:** 1-2 horas  
**Pros:** Portable, aislamiento  
**Contras:** Requiere Docker Extension, más complejo

### 🔀 OPCIÓN 3: Híbrido (Frontend estático + Backend PM2)

**Dificultad:** ⭐⭐ Media  
**Tiempo:** 30 minutos  
**Pros:** Mejor rendimiento para frontend  
**Contras:** Dos sistemas que gestionar

---

## 🚀 INICIO RÁPIDO - Opción 1 (PM2)

### Pre-requisitos en Plesk:

1. ✅ Node.js 18+ instalado
2. ✅ PostgreSQL disponible (o instalar)
3. ✅ Acceso SSH habilitado
4. ✅ Dominios agregados:
   - `aegg-api.creapolis.mx`
   - `aegg.creapolis.mx`

### Pasos Simplificados:

```
1. PREPARAR LOCALMENTE
   → Ejecutar: .\prepare-deployment.ps1
   → Editar: deployment-package\.env
   → Comprimir: deployment-package.zip

2. SUBIR AL SERVIDOR
   → Via Plesk File Manager o WinSCP
   → Ubicación: /tmp/

3. CONFIGURAR POSTGRESQL
   → Plesk → Databases → Add Database
   → Crear: aegg_db, aegg_user

4. SSH Y DEPLOYMENT
   → ssh root@74.208.234.244
   → cd /tmp
   → unzip deployment-package.zip
   → chmod +x deploy-on-server.sh
   → ./deploy-on-server.sh

5. CONFIGURAR PROXY EN PLESK
   → aegg-api.creapolis.mx → Apache & nginx Settings
   → Agregar nginx directives (ver guía completa)
   → Habilitar SSL

6. VERIFICAR
   → https://aegg-api.creapolis.mx
   → https://aegg.creapolis.mx
```

---

## 🔍 Checklist Pre-Deployment

### En tu máquina local:

- [ ] Backend builds sin errores (`npm run build`)
- [ ] Frontend builds sin errores (`npm run build`)
- [ ] Variables de entorno configuradas
- [ ] Dominios de producción agregados en CORS

### En el servidor VPS:

- [ ] Node.js instalado (`node -v` debe ser 18+)
- [ ] PM2 instalado globalmente (`npm install -g pm2`)
- [ ] PostgreSQL corriendo (`systemctl status postgresql`)
- [ ] Base de datos creada
- [ ] Directorios creados:
  - `/var/www/vhosts/creapolis.mx/aegg-api`
  - `/var/www/vhosts/creapolis.mx/aegg/httpdocs`

### En Plesk:

- [ ] Subdominios creados
- [ ] SSL habilitado (Let's Encrypt)
- [ ] Proxy reverso configurado para backend
- [ ] Rewrite rules configuradas para frontend SPA

---

## ⚡ Comandos Rápidos

### En tu máquina (Windows PowerShell):

```powershell
# Preparar deployment
.\prepare-deployment.ps1

# Editar variables de entorno
notepad deployment-package\.env

# Comprimir (o usar GUI)
Compress-Archive -Path deployment-package -DestinationPath deployment-package.zip

# Subir al servidor (con WinSCP o)
scp deployment-package.zip root@74.208.234.244:/tmp/
```

### En el servidor (SSH):

```bash
# Conectar
ssh root@74.208.234.244

# Verificar Node.js
node -v
npm -v

# Instalar PM2 si no está
npm install -g pm2

# Descomprimir y desplegar
cd /tmp
unzip deployment-package.zip
chmod +x deploy-on-server.sh
./deploy-on-server.sh

# Verificar
pm2 status
pm2 logs aegg-backend
```

---

## 🔧 Configuración de Plesk

### Para Backend (aegg-api.creapolis.mx):

1. **Crear Subdominio:**

   - Plesk → Websites & Domains → Add Subdomain
   - Subdomain name: `aegg-api`
   - Document root: `/var/www/vhosts/creapolis.mx/aegg-api`

2. **Apache & nginx Settings:**

   **Additional nginx directives:**

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

3. **SSL/TLS:**
   - SSL/TLS Certificates → Let's Encrypt
   - Issue certificate

### Para Frontend (aegg.creapolis.mx):

1. **Crear Subdominio:**

   - Plesk → Websites & Domains → Add Subdomain
   - Subdomain name: `aegg`
   - Document root: `/var/www/vhosts/creapolis.mx/aegg/httpdocs`

2. **Apache & nginx Settings:**

   **Additional Apache directives:**

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

3. **SSL/TLS:**
   - SSL/TLS Certificates → Let's Encrypt
   - Issue certificate

---

## 🛡️ Seguridad - IMPORTANTE

### Antes de deployment:

1. **Generar JWT Secret fuerte:**

   ```powershell
   # En PowerShell
   -join ((65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
   ```

2. **Generar Password de BD fuerte:**

   ```powershell
   -join ((33..126) | Get-Random -Count 24 | % {[char]$_})
   ```

3. **Editar `.env` con valores reales:**
   ```env
   JWT_SECRET=tu_secret_generado_aqui_minimo_32_chars
   DB_PASSWORD=tu_password_generado_aqui
   ```

### Después de deployment:

1. **Configurar Firewall:**

   ```bash
   # Solo si es necesario
   sudo firewall-cmd --permanent --add-service=http
   sudo firewall-cmd --permanent --add-service=https
   sudo firewall-cmd --reload
   ```

2. **Verificar permisos:**
   ```bash
   ls -la /var/www/vhosts/creapolis.mx/aegg-api
   # Debe ser: drwxr-xr-x www-data www-data
   ```

---

## 🐛 Troubleshooting Común

### ❌ Backend no responde:

```bash
# Ver logs
pm2 logs aegg-backend --lines 50

# Reiniciar
pm2 restart aegg-backend

# Verificar puerto
netstat -tlnp | grep :3000
```

### ❌ Error de conexión a PostgreSQL:

```bash
# Verificar servicio
sudo systemctl status postgresql

# Verificar conexión
psql -U aegg_user -d aegg_db -h localhost

# Ver .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env
```

### ❌ CORS Errors:

1. Verificar que el dominio frontend esté en `main.ts`
2. Verificar `CORS_ORIGIN` en `.env`
3. Rebuild backend: `npm run build && pm2 restart aegg-backend`

### ❌ Frontend muestra 404:

1. Verificar rewrite rules en Apache
2. Verificar que archivos están en `httpdocs`
3. Verificar permisos: `chmod -R 755 /var/www/vhosts/creapolis.mx/aegg/httpdocs`

### ❌ "502 Bad Gateway":

- Backend no está corriendo → `pm2 status`
- Puerto incorrecto en nginx → Verificar `proxy_pass`
- Firewall bloqueando → `sudo firewall-cmd --list-all`

---

## 📊 Monitoreo Post-Deployment

### Ver estado:

```bash
pm2 status
pm2 monit  # Dashboard interactivo
```

### Ver logs en tiempo real:

```bash
pm2 logs aegg-backend
```

### Ver uso de recursos:

```bash
pm2 show aegg-backend
```

### Backup de BD:

```bash
pg_dump -U aegg_user aegg_db > /backup/aegg-$(date +%Y%m%d).sql
```

---

## 🔄 Actualizaciones Futuras

### Actualizar Backend:

```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg-api

# Si usas Git
git pull origin mejoras-2025-10-18
cd backend
npm install --production
npm run build
pm2 restart aegg-backend
```

### Actualizar Frontend:

```powershell
# En local
cd frontend
npm run build

# Subir al servidor
scp -r dist/* root@74.208.234.244:/var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

---

## 📚 Recursos Adicionales

- [Documentación PM2](https://pm2.keymetrics.io/)
- [Documentación Plesk](https://docs.plesk.com/)
- [NestJS Production](https://docs.nestjs.com/faq/deployment)
- [Vite Build](https://vitejs.dev/guide/build.html)

---

## ✅ Verificación Final

Después del deployment, verifica:

- [ ] ✅ Backend responde: `curl https://aegg-api.creapolis.mx`
- [ ] ✅ Frontend carga: https://aegg.creapolis.mx
- [ ] ✅ Login funciona
- [ ] ✅ SSL activo (candado verde)
- [ ] ✅ PM2 corriendo: `pm2 status`
- [ ] ✅ Sin errores en logs: `pm2 logs`
- [ ] ✅ Base de datos accesible

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisar logs: `pm2 logs aegg-backend --lines 100`
2. Revisar nginx: `/var/log/nginx/error.log`
3. Revisar PostgreSQL: `journalctl -u postgresql -n 50`
