# 📚 Guías de Deployment - AEGG en Plesk Obsidian

## 🎯 Índice de Documentación

Este directorio contiene toda la documentación necesaria para hacer deployment de la aplicación AEGG en tu VPS con Plesk Obsidian.

---

## 📖 Guías Disponibles

### 1. 🚀 [PLESK-QUICK-START.md](./PLESK-QUICK-START.md)

**Empieza aquí si eres nuevo**

- Resumen de las 3 opciones de deployment
- Guía rápida paso a paso
- Comandos esenciales
- Troubleshooting común

**Ideal para:** Primera vez deployando en Plesk  
**Tiempo estimado:** 15 minutos de lectura, 45 minutos de implementación

---

### 2. 📋 [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

**Checklist interactivo completo**

- Lista de verificación paso a paso
- Dividido en 8 fases
- Incluye todos los comandos necesarios
- Verificación final

**Ideal para:** Seguir durante el deployment  
**Tiempo estimado:** 90 minutos completar todo

---

### 3. 📘 [DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)

**Guía detallada completa**

- Explicación profunda de cada paso
- Configuración de PostgreSQL
- Configuración de Plesk (Apache/Nginx)
- Seguridad y monitoreo
- Actualizaciones futuras

**Ideal para:** Referencia completa y troubleshooting  
**Tiempo estimado:** 30 minutos de lectura

---

### 4. 🔧 [DEPLOYMENT-UTILS.md](./DEPLOYMENT-UTILS.md)

**Scripts y utilidades**

- Generadores de secretos seguros
- Scripts de actualización
- Comandos de monitoreo
- Solución de problemas
- Backups automáticos

**Ideal para:** Mantener la aplicación después del deployment  
**Tiempo estimado:** Referencia continua

---

### 5. 🔄 [DEPLOYMENT-GIT.md](./DEPLOYMENT-GIT.md)

**Deployment con Git (Avanzado)**

- Git pull manual
- GitHub Actions (CI/CD)
- Git hooks
- Migración desde deployment manual

**Ideal para:** Después de validar el deployment inicial  
**Tiempo estimado:** 2-3 horas setup inicial

---

## 🎯 ¿Qué guía usar?

### Si es tu primera vez:

```
1. Lee PLESK-QUICK-START.md (15 min)
2. Sigue DEPLOYMENT-CHECKLIST.md (90 min)
3. Ten DEPLOYMENT-GUIDE.md a mano para referencias
```

### Si ya conoces el proceso:

```
1. Usa DEPLOYMENT-CHECKLIST.md como guía rápida
2. Consulta DEPLOYMENT-UTILS.md para comandos específicos
```

### Si quieres automatizar:

```
1. Completa el deployment manual primero
2. Lee DEPLOYMENT-GIT.md
3. Implementa GitHub Actions
```

---

## 📦 Archivos Generados

### Configuración

- `.env.production` - Variables de entorno del backend
- `frontend/.env.production` - Variables de entorno del frontend
- `ecosystem.config.js` - Configuración de PM2

### Scripts

- `prepare-deployment.ps1` - Preparar paquete de deployment (Windows)
- `prepare-deployment.sh` - Preparar paquete de deployment (Linux)
- `deploy-on-server.sh` - Ejecutar deployment en servidor

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Preparar Variables de Entorno

```powershell
# Generar JWT Secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | % {[char]$_})

# Generar Password de BD
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | % {[char]$_})

# Editar .env.production con estos valores
notepad .env.production
```

### 2. Preparar Paquete

```powershell
# Ejecutar script de preparación
.\prepare-deployment.ps1

# Comprimir
Compress-Archive -Path deployment-package -DestinationPath deployment-package.zip -Force
```

### 3. Subir al Servidor

```powershell
# Via SCP
scp deployment-package.zip root@74.208.234.244:/tmp/

# O usar WinSCP/FileZilla con GUI
```

### 4. Configurar PostgreSQL en Plesk

1. Login: https://74.208.234.244:8443
2. Databases → Add Database
3. Nombre: `aegg_db`, Usuario: `aegg_user`

### 5. Deployment en Servidor

```bash
# SSH
ssh root@74.208.234.244

# Instalar PM2
npm install -g pm2

# Descomprimir y desplegar
cd /tmp
unzip deployment-package.zip
chmod +x deploy-on-server.sh
./deploy-on-server.sh
```

### 6. Configurar Plesk

1. Crear subdominios: `aegg-api.creapolis.mx` y `aegg.creapolis.mx`
2. Configurar proxy reverso para backend (ver guías)
3. Configurar rewrite rules para frontend SPA
4. Habilitar SSL (Let's Encrypt)

### 7. Verificar

- Frontend: https://aegg.creapolis.mx
- Backend: https://aegg-api.creapolis.mx

---

## 🆘 Problemas Comunes

### Backend no responde

```bash
pm2 logs aegg-backend --lines 50
pm2 restart aegg-backend
```

### Error de conexión a BD

```bash
# Verificar credenciales
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env

# Test conexión
psql -U aegg_user -d aegg_db
```

### CORS Errors

- Verificar dominio en `backend/src/main.ts`
- Rebuild: `npm run build && pm2 restart aegg-backend`

### Frontend página en blanco

- Verificar archivos en `/var/www/vhosts/creapolis.mx/aegg/httpdocs/`
- Verificar console del navegador (F12)
- Verificar que `.env.production` tenga URL correcta

---

## 📊 Stack Tecnológico

### Backend

- **Framework:** NestJS (Node.js)
- **Base de Datos:** PostgreSQL 15
- **Process Manager:** PM2
- **Web Server:** Nginx (proxy reverso)

### Frontend

- **Framework:** React + TypeScript
- **Build Tool:** Vite
- **Web Server:** Apache
- **Routing:** React Router (SPA)

### Infraestructura

- **VPS:** 74.208.234.244
- **Panel:** Plesk Obsidian
- **OS:** Probablemente AlmaLinux/Rocky Linux
- **SSL:** Let's Encrypt

---

## 🔒 Seguridad

### Antes del Deployment

- [ ] Generar JWT_SECRET único (32+ caracteres)
- [ ] Generar DB_PASSWORD seguro
- [ ] Verificar que `.env` no esté en Git
- [ ] Actualizar CORS_ORIGIN con dominio real

### Después del Deployment

- [ ] Habilitar SSL en ambos dominios
- [ ] Configurar firewall (solo puertos 80, 443, 22)
- [ ] Configurar backups automáticos de BD
- [ ] Configurar PM2 para auto-restart
- [ ] Configurar log rotation

---

## 📈 Próximos Pasos

### Después del primer deployment exitoso:

1. **Monitoreo:**

   - Configurar PM2 Plus (opcional)
   - Configurar alertas de errores
   - Configurar health checks

2. **Backups:**

   - Automatizar backups de BD (ver DEPLOYMENT-UTILS.md)
   - Configurar backup de archivos subidos
   - Probar restauración de backups

3. **Performance:**

   - Configurar cacheo de assets estáticos
   - Escalar instancias de PM2 si necesario
   - Optimizar queries de BD

4. **CI/CD:**
   - Implementar GitHub Actions (ver DEPLOYMENT-GIT.md)
   - Configurar deployment automático
   - Agregar tests antes de deploy

---

## 📞 Información del Servidor

### Acceso

- **IP:** 74.208.234.244
- **Plesk:** https://74.208.234.244:8443
- **SSH:** `ssh root@74.208.234.244`

### Dominios

- **Frontend:** aegg.creapolis.mx → `/var/www/vhosts/creapolis.mx/aegg/httpdocs`
- **Backend API:** aegg-api.creapolis.mx → `/var/www/vhosts/creapolis.mx/aegg-api`

### Servicios

- **Backend:** Puerto 3000 (interno)
- **PostgreSQL:** Puerto 5432 (interno)
- **Nginx:** Puerto 80/443 (público)

---

## 🎓 Recursos de Aprendizaje

### Documentación Oficial

- [Plesk Docs](https://docs.plesk.com/)
- [PM2 Docs](https://pm2.keymetrics.io/docs/)
- [NestJS Deployment](https://docs.nestjs.com/faq/deployment)
- [Vite Build](https://vitejs.dev/guide/build.html)

### Tutoriales Útiles

- [Nginx Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [PM2 Production Best Practices](https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/auth-pg-hba-conf.html)

---

## 📝 Notas Importantes

### Variables de Entorno

⚠️ **NUNCA** commitear archivos `.env` a Git  
⚠️ **SIEMPRE** generar secretos únicos para producción  
⚠️ **NUNCA** usar valores por defecto en producción

### Backups

💾 **Backup de BD:** Diario (2 AM)  
💾 **Backup de archivos:** Semanal  
💾 **Retención:** 7 días para BD, 30 días para archivos

### Actualizaciones

🔄 **Backend:** Rebuild + PM2 restart  
🔄 **Frontend:** Rebuild + Copiar dist  
🔄 **BD:** Migrations con TypeORM

---

## ✅ Checklist Pre-Deployment

Antes de empezar, asegurar que tienes:

- [ ] Acceso SSH al servidor
- [ ] Acceso a Plesk
- [ ] Node.js 18+ en el servidor
- [ ] PostgreSQL configurado
- [ ] Dominios apuntando a la IP
- [ ] Variables de entorno configuradas
- [ ] Backup del código actual (si aplica)

---

## 🎉 Deployment Exitoso

Si llegaste hasta aquí y todo funciona:

✅ Frontend cargando en HTTPS  
✅ Backend respondiendo en HTTPS  
✅ Login funcionando  
✅ PM2 corriendo estable  
✅ SSL activo  
✅ Sin errores en logs

**¡Felicidades! 🎊**

Ahora puedes:

1. Probar todas las funcionalidades
2. Configurar monitoreo
3. Agregar a favoritos
4. Compartir con usuarios de prueba

---

## 📧 Soporte

Si encuentras problemas:

1. **Revisar logs:** `pm2 logs aegg-backend`
2. **Consultar guías:** Especialmente DEPLOYMENT-UTILS.md
3. **Troubleshooting:** DEPLOYMENT-GUIDE.md tiene sección completa
4. **Verificar checklist:** DEPLOYMENT-CHECKLIST.md

---

**Última actualización:** Octubre 2025  
**Versión:** 1.0  
**Autor:** Desarrollo AEGG

---

¡Buena suerte con tu deployment! 🚀
