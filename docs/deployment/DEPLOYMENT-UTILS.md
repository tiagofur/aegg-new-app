# 🔧 Scripts de Utilidad para Deployment

## 🔐 Generar Secretos Seguros

### Generar JWT Secret (PowerShell)

```powershell
# Generar string aleatorio de 32 caracteres
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Generar string aleatorio de 64 caracteres (más seguro)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | % {[char]$_})

# Generar con caracteres especiales
$chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
-join ($chars.ToCharArray() | Get-Random -Count 32)
```

### Generar Password de BD (PowerShell)

```powershell
# Password alfanumérico de 24 caracteres
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | % {[char]$_})

# Password con caracteres especiales
$chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()"
-join ($chars.ToCharArray() | Get-Random -Count 24)
```

---

## 📦 Comprimir Deployment Package (PowerShell)

```powershell
# Comprimir carpeta
Compress-Archive -Path deployment-package -DestinationPath deployment-package.zip -Force

# Comprimir con fecha
$date = Get-Date -Format "yyyyMMdd-HHmm"
Compress-Archive -Path deployment-package -DestinationPath "deployment-$date.zip" -Force

# Verificar contenido del ZIP
Expand-Archive -Path deployment-package.zip -DestinationPath temp-verify -Force
Get-ChildItem -Path temp-verify -Recurse
Remove-Item temp-verify -Recurse -Force
```

---

## 🚀 Subir Archivos al Servidor

### Via SCP (PowerShell con OpenSSH)

```powershell
# Subir ZIP
scp deployment-package.zip root@74.208.234.244:/tmp/

# Subir carpeta completa
scp -r deployment-package root@74.208.234.244:/tmp/

# Subir con puerto específico
scp -P 22 deployment-package.zip root@74.208.234.244:/tmp/

# Verificar que se subió
ssh root@74.208.234.244 "ls -lh /tmp/deployment-package.zip"
```

### Via SFTP (PowerShell)

```powershell
# Conectar via SFTP
sftp root@74.208.234.244

# Comandos dentro de SFTP:
# cd /tmp
# put deployment-package.zip
# ls -l
# bye
```

---

## 🔄 Actualización Rápida

### Script de Actualización Local (PowerShell)

```powershell
# update-deployment.ps1
Write-Host "🔄 Actualizando deployment..." -ForegroundColor Cyan

# Backend
Write-Host "📦 Building backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# Frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location ..\frontend
npm run build
if ($LASTEXITCODE -ne 0) { exit 1 }

# Copiar a deployment existente
Set-Location ..
Copy-Item -Recurse -Force backend\dist deployment-package\backend-dist
Copy-Item -Recurse -Force frontend\dist deployment-package\frontend-dist

Write-Host "✅ Builds actualizados en deployment-package" -ForegroundColor Green
Write-Host "Comprimir y subir al servidor" -ForegroundColor Cyan

# Comprimir
$date = Get-Date -Format "yyyyMMdd-HHmm"
Compress-Archive -Path deployment-package -DestinationPath "deployment-update-$date.zip" -Force

Write-Host "✅ Creado: deployment-update-$date.zip" -ForegroundColor Green
```

### Script de Actualización en Servidor (Bash)

```bash
#!/bin/bash
# update-on-server.sh

echo "🔄 Actualizando aplicación..."

BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api"
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"
TEMP_DIR="/tmp/deployment-package"

# Backup actual
echo "💾 Creando backup..."
cp -r $BACKEND_DIR/backend/dist $BACKEND_DIR/backend/dist.backup.$(date +%Y%m%d-%H%M)
cp -r $FRONTEND_DIR $FRONTEND_DIR.backup.$(date +%Y%m%d-%H%M)

# Desplegar nuevas versiones
echo "📦 Desplegando backend..."
rm -rf $BACKEND_DIR/backend/dist
cp -r $TEMP_DIR/backend-dist $BACKEND_DIR/backend/dist

echo "📦 Desplegando frontend..."
rm -rf $FRONTEND_DIR/*
cp -r $TEMP_DIR/frontend-dist/* $FRONTEND_DIR/

# Reiniciar
echo "🔄 Reiniciando aplicación..."
cd $BACKEND_DIR
pm2 reload ecosystem.config.js

echo "✅ Actualización completada"
pm2 logs aegg-backend --lines 20
```

---

## 📊 Monitoreo y Debugging

### Ver Estado (SSH)

```bash
# Estado general
pm2 status

# Detalle de la app
pm2 show aegg-backend

# Monitoreo en tiempo real
pm2 monit

# Logs en tiempo real
pm2 logs aegg-backend

# Últimas 100 líneas de logs
pm2 logs aegg-backend --lines 100

# Solo errores
pm2 logs aegg-backend --err

# Limpiar logs viejos
pm2 flush
```

### Verificar Conexiones (SSH)

```bash
# Ver si el backend está escuchando en puerto 3000
netstat -tlnp | grep :3000
# O
ss -tlnp | grep :3000

# Ver procesos de Node.js
ps aux | grep node

# Ver uso de recursos
top -p $(pgrep -d',' node)

# Memoria usada por PM2
pm2 show aegg-backend | grep memory
```

### Verificar Base de Datos (SSH)

```bash
# Conectar a PostgreSQL
psql -U aegg_user -d aegg_db

# Dentro de psql:
# \dt              -- Listar tablas
# \d+ nombre_tabla -- Describir tabla
# SELECT count(*) FROM usuarios;
# \q               -- Salir

# Backup de BD
pg_dump -U aegg_user aegg_db > /backup/aegg-$(date +%Y%m%d-%H%M).sql

# Restaurar BD
psql -U aegg_user aegg_db < /backup/aegg-20250125-1200.sql
```

### Verificar Nginx (SSH)

```bash
# Test de configuración
nginx -t

# Recargar configuración
nginx -s reload

# Ver logs de error
tail -f /var/log/nginx/error.log

# Ver logs de acceso
tail -f /var/log/nginx/access.log

# Filtrar por dominio
grep "aegg-api.creapolis.mx" /var/log/nginx/access.log
```

---

## 🐛 Solución de Problemas

### Backend no inicia

```bash
# Ver logs detallados
pm2 logs aegg-backend --lines 200 --err

# Verificar .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env

# Intentar iniciar manualmente
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
node dist/main.js

# Verificar dependencias
npm list --depth=0
```

### Error de conexión a BD

```bash
# Verificar que PostgreSQL esté corriendo
systemctl status postgresql

# Verificar conexión
psql -U aegg_user -d aegg_db -h localhost

# Ver usuarios de PostgreSQL
sudo -u postgres psql -c "\du"

# Ver bases de datos
sudo -u postgres psql -c "\l"

# Reiniciar PostgreSQL
systemctl restart postgresql
```

### CORS Errors

```bash
# Verificar configuración en main.ts
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/dist/main.js | grep -A 5 "enableCors"

# Verificar .env
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env | grep CORS

# Rebuild y reiniciar
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
npm run build
pm2 restart aegg-backend
```

### 502 Bad Gateway

```bash
# Verificar que backend esté corriendo
pm2 status

# Verificar puerto
netstat -tlnp | grep :3000

# Verificar logs de nginx
tail -f /var/log/nginx/error.log

# Test de conexión local
curl http://localhost:3000

# Si falla, reiniciar todo
pm2 restart aegg-backend
systemctl restart nginx
```

### Frontend muestra página en blanco

```bash
# Verificar que archivos existan
ls -la /var/www/vhosts/creapolis.mx/aegg/httpdocs/

# Verificar index.html
cat /var/www/vhosts/creapolis.mx/aegg/httpdocs/index.html

# Verificar permisos
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg/httpdocs/
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg/httpdocs/

# Ver logs de Apache
tail -f /var/log/httpd/error_log
```

---

## 🔄 Rollback Rápido

### Rollback Backend

```bash
# Si hiciste backup antes de actualizar
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
rm -rf dist
mv dist.backup.20250125-1200 dist
pm2 restart aegg-backend
```

### Rollback Frontend

```bash
# Si hiciste backup antes de actualizar
cd /var/www/vhosts/creapolis.mx/aegg
rm -rf httpdocs
mv httpdocs.backup.20250125-1200 httpdocs
```

### Rollback de Base de Datos

```bash
# Restaurar desde backup
psql -U aegg_user aegg_db < /backup/aegg-20250125-1200.sql
```

---

## 📈 Performance Tuning

### Aumentar Instancias de PM2

```bash
# Escalar a 4 instancias
pm2 scale aegg-backend 4

# Verificar
pm2 status
```

### Configurar Límites de Memoria

```bash
# Editar ecosystem.config.js
# max_memory_restart: '2G'  // Aumentar si necesario

pm2 reload ecosystem.config.js
```

### Cachear Assets del Frontend

```nginx
# Agregar en nginx directives de frontend
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🔐 Seguridad Adicional

### Configurar Rate Limiting en Nginx

```nginx
# En nginx directives del backend
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;

location / {
    limit_req zone=api_limit burst=20 nodelay;
    proxy_pass http://localhost:3000;
    # ... resto de configuración
}
```

### Ocultar Header de Servidor

```nginx
# En nginx directives
server_tokens off;
more_clear_headers Server;
```

### Configurar HTTPS Redirect

```apache
# En Apache directives
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

---

## 📊 Logs Centralizados

### Configurar PM2 Logrotate

```bash
# Instalar
pm2 install pm2-logrotate

# Configurar
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss
```

### Ver Logs Antiguos

```bash
# Logs de PM2
ls -la ~/.pm2/logs/

# Logs de Nginx
ls -la /var/log/nginx/

# Logs de PostgreSQL
journalctl -u postgresql --since "1 hour ago"
```

---

## 🎯 Health Checks

### Script de Health Check (Bash)

```bash
#!/bin/bash
# health-check.sh

echo "🏥 Health Check - AEGG"
echo "====================="

# Backend
echo -n "Backend (API): "
if curl -sf https://aegg-api.creapolis.mx > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Frontend
echo -n "Frontend: "
if curl -sf https://aegg.creapolis.mx > /dev/null; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# PM2
echo -n "PM2 Process: "
if pm2 list | grep -q "aegg-backend.*online"; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# PostgreSQL
echo -n "PostgreSQL: "
if systemctl is-active --quiet postgresql; then
    echo "✅ OK"
else
    echo "❌ FAIL"
fi

# Disk Space
echo "Disk Usage:"
df -h / | tail -1 | awk '{print "  "$3" used of "$2" ("$5" used)"}'
```

### Automatizar Health Check (Cron)

```bash
# Agregar a crontab
crontab -e

# Ejecutar cada 5 minutos
*/5 * * * * /root/health-check.sh >> /var/log/aegg-health.log 2>&1
```

---

## 💾 Backup Automatizado

### Script de Backup (Bash)

```bash
#!/bin/bash
# backup-aegg.sh

BACKUP_DIR="/backup/aegg"
DATE=$(date +%Y%m%d-%H%M)

mkdir -p $BACKUP_DIR

echo "💾 Iniciando backup $DATE..."

# Backup de BD
pg_dump -U aegg_user aegg_db | gzip > $BACKUP_DIR/db-$DATE.sql.gz

# Backup de archivos subidos (si hay)
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /var/www/vhosts/creapolis.mx/aegg-api/uploads 2>/dev/null || true

# Limpiar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup completado: $BACKUP_DIR"
ls -lh $BACKUP_DIR | tail -5
```

### Automatizar Backup (Cron)

```bash
# Backup diario a las 2 AM
0 2 * * * /root/backup-aegg.sh >> /var/log/aegg-backup.log 2>&1
```

---

## 🚨 Alertas

### Enviar Email en Error (Bash + mail)

```bash
# Instalar mailx
dnf install -y mailx

# Script de monitoreo con alerta
#!/bin/bash
if ! pm2 list | grep -q "aegg-backend.*online"; then
    echo "Backend AEGG está caído!" | mail -s "ALERTA: Backend Down" tu_email@dominio.com
    pm2 restart aegg-backend
fi
```

---

¿Necesitas algún script específico adicional? 🚀
