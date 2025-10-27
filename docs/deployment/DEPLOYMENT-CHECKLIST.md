# ✅ Checklist de Deployment - AEGG en Plesk

## 📋 FASE 1: Preparación Local (15 minutos)

### Configuración de Código

- [ ] Actualizar `backend/src/main.ts` con dominios de producción ✅ (YA HECHO)
- [ ] Verificar que `.env.production` esté creado ✅ (YA HECHO)
- [ ] Verificar que `frontend/.env.production` esté creado ✅ (YA HECHO)

### Editar Variables de Entorno

- [ ] Abrir `.env.production`
- [ ] Generar JWT_SECRET (mínimo 32 caracteres aleatorios)
- [ ] Generar DB_PASSWORD (contraseña fuerte)
- [ ] Reemplazar `CHANGE_THIS_PASSWORD` con password real
- [ ] Reemplazar `CHANGE_THIS_SECRET_KEY` con JWT secret real

### Build del Proyecto

- [ ] Abrir PowerShell en el directorio raíz
- [ ] Ejecutar: `.\prepare-deployment.ps1`
- [ ] Verificar que no hay errores en backend build
- [ ] Verificar que no hay errores en frontend build
- [ ] Confirmar que existe carpeta `deployment-package`

### Preparar para Subida

- [ ] Abrir `deployment-package\.env`
- [ ] Verificar que todos los secretos estén configurados
- [ ] Comprimir `deployment-package` en ZIP
- [ ] O tener WinSCP/FileZilla instalado para transferencia directa

---

## 📋 FASE 2: Configuración del Servidor (20 minutos)

### Acceso SSH

- [ ] Conectar vía SSH: `ssh root@74.208.234.244`
- [ ] Verificar Node.js instalado: `node -v` (debe ser 18+)
- [ ] Verificar npm: `npm -v`
- [ ] Si Node.js no está, instalar:
  ```bash
  curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
  dnf install -y nodejs
  ```

### Instalar PM2

- [ ] Ejecutar: `npm install -g pm2`
- [ ] Verificar: `pm2 -v`

### Configurar PostgreSQL

**Opción A: Usar Plesk UI**

- [ ] Login a Plesk: https://74.208.234.244:8443
- [ ] Ir a Databases → Add Database
- [ ] Nombre: `aegg_db`
- [ ] Usuario: `aegg_user`
- [ ] Password: (usar el mismo que pusiste en .env)
- [ ] Anotar el host (generalmente localhost o 127.0.0.1)

**Opción B: SSH Manual**

- [ ] Verificar PostgreSQL: `systemctl status postgresql`
- [ ] Si no está instalado:
  ```bash
  dnf install -y postgresql15-server
  postgresql-setup --initdb
  systemctl start postgresql
  systemctl enable postgresql
  ```
- [ ] Crear base de datos:
  ```bash
  sudo -u postgres psql
  CREATE DATABASE aegg_db;
  CREATE USER aegg_user WITH ENCRYPTED PASSWORD 'tu_password';
  GRANT ALL PRIVILEGES ON DATABASE aegg_db TO aegg_user;
  \q
  ```

### Crear Directorios

- [ ] Ejecutar:
  ```bash
  mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/backend
  mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/logs
  mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs
  ```

---

## 📋 FASE 3: Subir Archivos (10 minutos)

### Subir deployment-package

**Opción A: WinSCP**

- [ ] Abrir WinSCP
- [ ] Conectar a: 74.208.234.244
- [ ] Usuario: root
- [ ] Navegar a `/tmp/`
- [ ] Subir `deployment-package.zip`
- [ ] O subir carpeta `deployment-package` completa

**Opción B: Plesk File Manager**

- [ ] Login a Plesk
- [ ] File Manager → /tmp/
- [ ] Upload → deployment-package.zip
- [ ] Extract

**Opción C: SCP (PowerShell)**

- [ ] Ejecutar: `scp deployment-package.zip root@74.208.234.244:/tmp/`

### Descomprimir en Servidor

- [ ] SSH al servidor
- [ ] `cd /tmp`
- [ ] Si es ZIP: `unzip deployment-package.zip`
- [ ] Verificar: `ls -la deployment-package/`

---

## 📋 FASE 4: Deployment en Servidor (10 minutos)

### Ejecutar Script de Deployment

- [ ] `cd /tmp`
- [ ] `chmod +x deployment-package/deploy-on-server.sh`
- [ ] O copiar y pegar comandos manualmente:

```bash
# Variables
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api"
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"

# Backend
cp -r /tmp/deployment-package/backend-dist $BACKEND_DIR/backend/dist
cp -r /tmp/deployment-package/backend-node_modules $BACKEND_DIR/backend/node_modules
cp /tmp/deployment-package/package.json $BACKEND_DIR/backend/
cp /tmp/deployment-package/.env $BACKEND_DIR/backend/.env

# Frontend
cp -r /tmp/deployment-package/frontend-dist/* $FRONTEND_DIR/

# PM2 Config
cp /tmp/deployment-package/ecosystem.config.js $BACKEND_DIR/

# Permisos
chown -R www-data:www-data $BACKEND_DIR
chown -R www-data:www-data $FRONTEND_DIR
chmod -R 755 $BACKEND_DIR
chmod -R 755 $FRONTEND_DIR

# Iniciar PM2
cd $BACKEND_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Verificar Backend Corriendo

- [ ] `pm2 status` - Debe mostrar "online"
- [ ] `pm2 logs aegg-backend --lines 20` - Sin errores críticos
- [ ] `curl http://localhost:3000` - Debe responder

---

## 📋 FASE 5: Configurar Plesk (20 minutos)

### Configurar Backend (aegg-api.creapolis.mx)

#### Crear Subdominio

- [ ] Plesk → Websites & Domains
- [ ] Add Subdomain
- [ ] Subdomain name: `aegg-api`
- [ ] Document root: `/var/www/vhosts/creapolis.mx/aegg-api`
- [ ] Click OK

#### Configurar Proxy Reverso

- [ ] Click en `aegg-api.creapolis.mx`
- [ ] Apache & nginx Settings
- [ ] En "Additional nginx directives" pegar:

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

- [ ] Click OK
- [ ] Wait for nginx to restart

#### Habilitar SSL

- [ ] `aegg-api.creapolis.mx` → SSL/TLS Certificates
- [ ] Let's Encrypt → Get it free
- [ ] Email: tu_email@dominio.com
- [ ] Check: Assign the certificate to the domain
- [ ] Check: Include a "www" subdomain (opcional)
- [ ] Click Get it free
- [ ] Wait for certificate to issue

### Configurar Frontend (aegg.creapolis.mx)

#### Crear Subdominio

- [ ] Plesk → Websites & Domains
- [ ] Add Subdomain
- [ ] Subdomain name: `aegg`
- [ ] Document root: `/var/www/vhosts/creapolis.mx/aegg/httpdocs`
- [ ] Click OK

#### Configurar SPA Routing

- [ ] Click en `aegg.creapolis.mx`
- [ ] Apache & nginx Settings
- [ ] En "Additional Apache directives" pegar:

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

- [ ] Click OK

#### Habilitar SSL

- [ ] `aegg.creapolis.mx` → SSL/TLS Certificates
- [ ] Let's Encrypt → Get it free
- [ ] Email: tu_email@dominio.com
- [ ] Check: Assign the certificate to the domain
- [ ] Click Get it free
- [ ] Wait for certificate to issue

---

## 📋 FASE 6: Verificación (10 minutos)

### Verificar Backend

- [ ] Abrir navegador: `https://aegg-api.creapolis.mx`
- [ ] Debe mostrar mensaje o JSON (no 404)
- [ ] Sin errores de certificado SSL (candado verde)

### Verificar Frontend

- [ ] Abrir navegador: `https://aegg.creapolis.mx`
- [ ] Debe cargar la aplicación
- [ ] Sin errores de certificado SSL (candado verde)
- [ ] Abrir consola del navegador (F12) - Sin errores CORS

### Verificar Login

- [ ] Intentar login en frontend
- [ ] Debe autenticar correctamente
- [ ] Debe redirigir al dashboard

### Verificar PM2

- [ ] SSH: `pm2 status`
- [ ] Estado debe ser "online"
- [ ] Restart count debe ser 0 o bajo
- [ ] Memory/CPU usage razonable

### Verificar Logs

- [ ] `pm2 logs aegg-backend --lines 50`
- [ ] No debe haber errores críticos
- [ ] Debe mostrar requests entrantes

---

## 📋 FASE 7: Seguridad y Limpieza (5 minutos)

### Limpiar Archivos Temporales

- [ ] SSH: `rm -rf /tmp/deployment-package`
- [ ] SSH: `rm -rf /tmp/deployment-package.zip`

### Verificar Permisos

- [ ] `ls -la /var/www/vhosts/creapolis.mx/aegg-api/backend/.env`
- [ ] Debe ser: `-rw-r--r-- www-data www-data`
- [ ] Si no: `chmod 644 /var/www/vhosts/creapolis.mx/aegg-api/backend/.env`

### Configurar Firewall (si aplica)

- [ ] Verificar: `firewall-cmd --list-all`
- [ ] HTTP y HTTPS deben estar permitidos
- [ ] Puerto 3000 NO debe estar expuesto públicamente

### Backup Inicial

- [ ] Crear backup de BD:
  ```bash
  pg_dump -U aegg_user aegg_db > /backup/aegg-initial-$(date +%Y%m%d).sql
  ```

---

## 📋 FASE 8: Monitoreo Post-Deployment (5 minutos)

### Configurar PM2 Monitoring

- [ ] `pm2 monit` - Ver dashboard en tiempo real
- [ ] Verificar uso de memoria < 500MB
- [ ] Verificar uso de CPU < 50%

### Configurar Logs Persistentes

- [ ] `pm2 install pm2-logrotate`
- [ ] `pm2 set pm2-logrotate:max_size 10M`
- [ ] `pm2 set pm2-logrotate:retain 7`

### Verificar Auto-Start

- [ ] `pm2 startup` - Configurar inicio automático
- [ ] Copiar y ejecutar el comando que muestra
- [ ] `pm2 save` - Guardar configuración actual

---

## ✅ CHECKLIST FINAL

### Funcionalidad

- [ ] ✅ Backend responde en HTTPS
- [ ] ✅ Frontend carga en HTTPS
- [ ] ✅ Login funciona correctamente
- [ ] ✅ Navegación entre páginas funciona
- [ ] ✅ API calls se completan sin errores
- [ ] ✅ No hay errores CORS

### Seguridad

- [ ] ✅ SSL habilitado y funcionando (candado verde)
- [ ] ✅ JWT_SECRET es único y seguro (32+ chars)
- [ ] ✅ DB_PASSWORD es único y seguro
- [ ] ✅ Archivos .env no son accesibles públicamente
- [ ] ✅ Puerto 3000 solo accesible via proxy

### Performance

- [ ] ✅ PM2 corriendo en modo cluster (2 instancias)
- [ ] ✅ Frontend carga en < 3 segundos
- [ ] ✅ API responde en < 500ms

### Monitoring

- [ ] ✅ PM2 configurado para auto-restart
- [ ] ✅ PM2 configurado para iniciar en boot
- [ ] ✅ Logs rotando automáticamente
- [ ] ✅ Backup inicial de BD creado

---

## 🎉 ¡DEPLOYMENT COMPLETADO!

### URLs Finales:

- **Frontend:** https://aegg.creapolis.mx
- **Backend API:** https://aegg-api.creapolis.mx

### Comandos Útiles:

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs aegg-backend

# Reiniciar
pm2 restart aegg-backend

# Monitoreo
pm2 monit

# Stop
pm2 stop aegg-backend

# Start
pm2 start aegg-backend
```

### Próximos Pasos:

1. 📊 Configurar monitoreo con PM2 Plus (opcional)
2. 🔄 Configurar backups automáticos de BD
3. 📧 Configurar alertas de errores
4. 🧪 Testing end-to-end en producción
5. 📈 Configurar analytics (opcional)

---

## 📞 Soporte

Si algo falla:

1. `pm2 logs aegg-backend --lines 100` - Ver errores
2. Revisar `/var/log/nginx/error.log`
3. Revisar `journalctl -u postgresql -n 50`
4. Verificar que todos los checklist items estén ✅

¡Buena suerte con tu deployment! 🚀
