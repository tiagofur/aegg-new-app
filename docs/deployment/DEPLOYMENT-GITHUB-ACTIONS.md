# 🚀 Deployment Automático con GitHub Actions

## 📋 Resumen Rápido

Este proyecto tiene **deployment automático** desde la rama `main` a tu VPS usando GitHub Actions.

## ⚡ Deployment en 3 Pasos

1. **Configurar Secrets en GitHub** (1 vez)
2. **Hacer push a main** → Deployment automático
3. **Verificar en el servidor** → Aplicación actualizada

## 🔑 Secrets Requeridos en GitHub

Ve a: `Repository Settings > Secrets and variables > Actions`

### VPS/SSH (4 secrets)
```
VPS_HOST = 74.208.234.244
VPS_USER = root
VPS_PORT = 22
VPS_SSH_KEY = (llave privada SSH completa)
```

### Base de Datos (5 secrets)
```
DB_HOST = localhost:5440
DB_PORT = 5432
DB_USER = postgres
DB_PASSWORD = tu-password
DB_NAME = appdb
```

### JWT (1 secret)
```
JWT_SECRET = (mínimo 32 caracteres, generar con: openssl rand -base64 48)
```

**Total: 10 secrets requeridos**

## 🚀 Activar Deployment

### Opción 1: Automático (recomendado)
```bash
git checkout main
git pull
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# ✅ Deployment se activa automáticamente
```

### Opción 2: Manual desde GitHub
1. Ve a `Actions` tab
2. Selecciona `🚀 Deploy to Production (VPS)`
3. Clic en `Run workflow` > `Run workflow`

## 📁 Rutas en el Servidor

El workflow despliega a estas rutas (configurables en `.github/workflows/deploy-to-production.yml`):

```
Backend:  /var/www/vhosts/creapolis.mx/aegg-api/backend
Frontend: /var/www/vhosts/creapolis.mx/aegg/httpdocs
Logs:     /var/www/vhosts/creapolis.mx/aegg-api/logs
```

## 🔍 Verificar Deployment

### En GitHub Actions
```
Repository > Actions > Seleccionar workflow > Ver pasos
```

### En el Servidor
```bash
pm2 status              # Ver estado de PM2
pm2 logs aegg-backend --lines 50  # Ver logs recientes
pm2 monit              # Dashboard en tiempo real
```

## 🛠️ Scripts Útiles

### Configurar Secrets
```bash
# Interactivo: recolecta valores y crea script de configuración
bash setup-github-secrets.sh
```

### Ver Logs
```bash
# Backend
pm2 logs aegg-backend

# O directamente en archivos
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-error.log
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-out.log
```

### Reiniciar Manualmente
```bash
cd /var/www/vhosts/creapolis.mx/aegg-api
pm2 reload ecosystem.config.js
```

## ⚠️ Solución de Problemas

### Error: "No such file or directory"
```bash
# Crear directorios manualmente
mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/{backend,logs}
mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg
```

### Error: "Permission denied"
```bash
# Corregir permisos
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg
```

### Error: "Database connection failed"
```bash
# Verificar PostgreSQL
docker ps | grep postgres
docker exec aegg-postgres pg_isready -U postgres -d appdb

# Si está en Docker, usa localhost:5440 en DB_HOST
```

### Error: "PM2 command not found"
```bash
# Instalar PM2 en el servidor
npm install -g pm2
pm2 startup
pm2 save
```

## 📊 Proceso de Deployment

1. ✅ Checkout del código
2. ✅ Build del backend (NestJS)
3. ✅ Build del frontend (React + Vite)
4. ✅ Ejecutar tests (continúa si fallan)
5. ✅ Crear paquete de deployment
6. ✅ Crear .env de producción
7. ✅ Subir paquete al VPS (SCP)
8. ✅ Desplegar archivos en servidor
9. ✅ Ejecutar migraciones de base de datos
10. ✅ Reiniciar PM2
11. ✅ Verificar estado

## 🔐 Seguridad

- ✅ Secrets en GitHub (nunca commiteados)
- ✅ SSH keys en lugar de passwords
- ✅ HTTPS en producción
- ✅ Rate limiting activo
- ✅ Helmet headers configurados
- ✅ Input sanitization disponible

## 📚 Documentación Completa

Ver [`.github/workflows/README.md`](.github/workflows/README.md) para:
- Instrucciones detalladas
- Checklist de pre-deployment
- Solución avanzada de problemas
- Monitoreo y troubleshooting

## 🎯 Checklist Pre-Deployment

Antes del primer deployment:

- [ ] Todos los 10 secrets configurados en GitHub
- [ ] PM2 instalado en servidor (`pm2 --version`)
- [ ] PostgreSQL corriendo (`docker ps | grep postgres`)
- [ ] Directorios creados en servidor
- [ ] Permisos configurados (www-data:www-data)
- [ ] Firewall permite puertos necesarios (22, 80, 443, 3000)
- [ ] Tests locales pasan (`npm test` en backend y frontend)
- [ ] Build local funciona (`npm run build` en backend y frontend)

---

**Estado**: ✅ Configurado y listo para usar
**Última actualización**: 27/12/2025
