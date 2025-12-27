# 🚀 Configuración de GitHub Actions para Deployment Automático

## 📋 Resumen

Este workflow permite deployment automático a producción desde la rama `main` a tu VPS (74.208.234.244).

## 🔑 Secrets Requeridos en GitHub

Navega a: `Repository Settings > Secrets and variables > Actions`

### Configuración de VPS/SSH
- **`VPS_HOST`**: IP o dominio del VPS
  - Ejemplo: `74.208.234.244` o `tu-dominio.com`

- **`VPS_USER`**: Usuario SSH del VPS
  - Ejemplo: `root`

- **`VPS_PORT`**: Puerto SSH (por defecto 22)
  - Ejemplo: `22`

- **`VPS_SSH_KEY`**: Llave privada SSH para conectar al VPS
  - Obténla con: `cat ~/.ssh/id_rsa` o `cat ~/.ssh/id_ed25519`
  - **IMPORTANTE**: Incluye todo el contenido incluyendo `-----BEGIN...-----` y `-----END...-----`

### Configuración de Base de Datos
- **`DB_HOST`**: Host de la base de datos
  - Ejemplo: `localhost` o `localhost:5440` (si PostgreSQL está en Docker)

- **`DB_PORT`**: Puerto de PostgreSQL
  - Ejemplo: `5432` (directo) o `5440` (Docker)

- **`DB_USER`**: Usuario de la base de datos
  - Ejemplo: `postgres`

- **`DB_PASSWORD`**: Contraseña de la base de datos
  - Ejemplo: `tu-password-seguro`

- **`DB_NAME`**: Nombre de la base de datos
  - Ejemplo: `appdb`

### Configuración de JWT
- **`JWT_SECRET`**: Secreto para firmar tokens JWT
  - **IMPORTANTE**: Mínimo 32 caracteres
  - Generar con: `openssl rand -base64 48`
  - Ejemplo: `xYz123abcDEF456ghiJKL789mnoPQR0stUVwx`

## 📁 Rutas en el Servidor

El workflow asume estas rutas en tu VPS:

### Backend
- **Directorio**: `/var/www/vhosts/creapolis.mx/aegg-api/backend`
- **Node Modules**: `/var/www/vhosts/creapolis.mx/aegg-api/backend/node_modules`
- **Logs**: `/var/www/vhosts/creapolis.mx/aegg-api/logs`
- **Logs PM2**: Ver con `pm2 logs aegg-backend`

### Frontend
- **Directorio**: `/var/www/vhosts/creapolis.mx/aegg/httpdocs`

## 🔄 Cómo Funciona el Deployment

1. **Build Local (en GitHub Actions)**
   - Backend: `npm ci --production && npm run build`
   - Frontend: `npm ci && npm run build`
   - Tests: `npm test` (continúa aunque fallen)

2. **Crear Paquete de Deployment**
   - Backend dist compilado
   - Node modules de producción
   - Frontend dist compilado
   - Archivos de configuración

3. **Subir al VPS**
   - Usa SCP para transferir archivos a `/tmp/deployment-package`

4. **Deploy en Servidor**
   - Reemplaza archivos de backend
   - Reemplaza archivos de frontend
   - Ejecuta migraciones de base de datos
   - Reinicia aplicación con PM2

5. **Verificación**
   - Revisa logs de PM2
   - Verifica que los servicios estén corriendo

## 🚀 Cómo Activar Deployment Automático

### Opción A: Push a Main (Automático)
```bash
git checkout main
git pull origin main
# Hacer tus cambios
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# El deployment se activa automáticamente
```

### Opción B: Manual desde GitHub
1. Ve al repositorio en GitHub
2. Navega a `Actions` tab
3. Selecciona `🚀 Deploy to Production (VPS)`
4. Haz clic en `Run workflow`
5. Selecciona la rama `main`
6. Haz clic en `Run workflow`

## 🔍 Verificar Deployment

### En GitHub Actions
1. Ve a `Actions` tab
2. Selecciona el workflow más reciente
3. Revisa cada paso para ver si pasó o falló

### En el Servidor VPS
```bash
# Verificar PM2
pm2 status
pm2 logs aegg-backend --lines 50

# Verificar permisos
ls -la /var/www/vhosts/creapolis.mx/aegg-api
ls -la /var/www/vhosts/creapolis.mx/aegg/httpdocs

# Verificar logs de backend
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-error.log
tail -f /var/www/vhosts/creapolis.mx/aegg-api/logs/backend-out.log
```

## ⚠️ Solución de Problemas Comunes

### Error: "Permission denied (publickey)"
- Asegúrate de que `VPS_SSH_KEY` esté correctamente configurada
- Verifica que la llave privada corresponda a la pública en el servidor

### Error: "No such file or directory"
- Verifica que las rutas en el workflow coincidan con tu servidor
- Crea los directorios manualmente si es necesario:
  ```bash
  mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/backend
  mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/logs
  mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs
  chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg
  chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg/httpdocs
  ```

### Error: "Database connection failed"
- Verifica que las credenciales en `DB_*` secrets sean correctas
- Asegúrate de que PostgreSQL esté corriendo:
  ```bash
  # Si está en Docker
  docker ps | grep postgres
  docker exec aegg-postgres pg_isready -U postgres -d appdb
  ```

### Error: "PM2 command not found"
- Instala PM2 globalmente en el servidor:
  ```bash
  npm install -g pm2
  pm2 startup
  ```

### Las migraciones no se ejecutan
- Verifica que el comando `npm run migration:run` exista en package.json
- Si falla, ejecuta manualmente:
  ```bash
  cd /var/www/vhosts/creapolis.mx/aegg-api/backend
  npm run migration:run
  ```

## 📊 Monitoreo

### PM2 Dashboard
```bash
pm2 monit
```

### Logs en tiempo real
```bash
pm2 logs aegg-backend
```

### Verificar URLs
- Backend API: https://aegg-api.creapolis.mx
- Frontend: https://aegg.creapolis.mx

## 🔐 Seguridad

### Recomendaciones
1. **Nunca commitear**:
   - Llaves privadas
   - Contraseñas
   - Tokens
   - Credenciales de base de datos

2. **Rotar credenciales regularmente**:
   - JWT_SECRET cada 6 meses
   - Contraseñas de BD cada 3 meses

3. **Limitar acceso SSH**:
   - Usa llaves SSH en lugar de passwords
   - Configura fail2ban para prevenir ataques de fuerza bruta
   - Deshabilita login como root si es posible

4. **HTTPS obligatorio**:
   - Asegúrate de que HTTPS esté habilitado en producción
   - Configura redirección HTTP → HTTPS

## 🎯 Checklist Antes del Primer Deployment

- [ ] Todos los secrets están configurados en GitHub
- [ ] Las rutas en el workflow coinciden con el servidor
- [ ] PM2 está instalado en el servidor
- [ ] PostgreSQL está corriendo en el servidor
- [ ] Los permisos de directorios están correctos
- [ ] El firewall permite conexiones necesarias (puerto 3000, 22, 443, 80)
- [ ] Los tests locales pasan (`npm test` en backend y frontend)
- [ ] El build local funciona (`npm run build` en backend y frontend)

## 📚 Recursos

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [NestJS Production Guide](https://docs.nestjs.com/faq/production)
- [TypeORM Migrations](https://typeorm.io/#/migrations)

---

**Última actualización**: 27/12/2025
**Estado**: ✅ Configurado y listo para usar
