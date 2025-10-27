# 🚀 Deployment Completo - 26 Oct 2025

## 📋 Cambios en este Deployment

### ✅ Frontend (Ya desplegado anteriormente)
- Miembros pueden gestionar reportes mensuales
- Miembros pueden enviar meses a revisión

### 🔧 Backend (NUEVO - Crítico)
- **FIX: Permitir a Miembros guardar en Reporte Base Anual**
- Se removió validación que bloqueaba a Miembros de usar "Guardar en Base"
- Ahora Miembros pueden guardar ventas mensuales en el Excel

## ⚠️ IMPORTANTE

Este deployment **DEBE incluir el backend** para corregir el error 403 al guardar en base.

## 📦 Archivos

- `full-deploy-20251026-211536.zip` - Paquete completo backend + frontend

## 🚀 Instrucciones de Deployment

### Opción 1: Actualización Rápida via SSH (Recomendado)

```bash
# 1. Subir el ZIP al servidor
scp deployment-packages/full-deploy-20251026-211536.zip root@74.208.234.244:/tmp/

# 2. Conectar por SSH
ssh root@74.208.234.244

# 3. Extraer
cd /tmp
unzip -o full-deploy-20251026-211536.zip

# 4. Backup del backend actual (opcional pero recomendado)
cp -r /var/www/vhosts/creapolis.mx/aegg-api/backend/dist \
      /var/www/vhosts/creapolis.mx/aegg-api/backend/dist.backup.$(date +%Y%m%d-%H%M)

# 5. Actualizar backend
rm -rf /var/www/vhosts/creapolis.mx/aegg-api/backend/dist
cp -r deployment-package/backend-dist /var/www/vhosts/creapolis.mx/aegg-api/backend/dist

# 6. Actualizar frontend
rm -rf /var/www/vhosts/creapolis.mx/aegg/httpdocs/*
cp -r deployment-package/frontend-dist/* /var/www/vhosts/creapolis.mx/aegg/httpdocs/

# 7. Reiniciar backend
pm2 restart aegg-backend

# 8. Verificar logs
pm2 logs aegg-backend --lines 20
```

### Opción 2: Via Plesk File Manager

1. **Backend**:
   - Subir `full-deploy-20251026-211536.zip` a Plesk File Manager
   - Extraer en `/tmp/`
   - Hacer backup de `/var/www/vhosts/creapolis.mx/aegg-api/backend/dist`
   - Reemplazar con el nuevo `deployment-package/backend-dist`
   - Conectar por SSH y ejecutar: `pm2 restart aegg-backend`

2. **Frontend**:
   - Copiar contenido de `deployment-package/frontend-dist`
   - Pegar en `/var/www/vhosts/creapolis.mx/aegg/httpdocs/`

## ✅ Verificación

### 1. Backend
```bash
pm2 status
# Debe mostrar "online"

pm2 logs aegg-backend --lines 20
# No debe haber errores
```

### 2. Frontend + Backend
- Visita: https://aegg.creapolis.mx
- Login como Miembro
- Ve a un trabajo → Mes → Reporte MI Admin o Auxiliar
- Haz scroll hasta abajo
- Click en "Guardar en Base"
- **NO debe mostrar error 403**
- Debe mostrar diálogo de confirmación
- Después de confirmar, debe guardar exitosamente

## 🐛 Solución de Problemas

### Error 403 persiste
```bash
# Verificar que el backend se actualizó
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
grep -A 5 "actualizarVentasMensualesEnExcel" dist/trabajos/services/trabajos.service.js

# Debe mostrar el código sin "assertCanManage"
```

### Backend no reinicia
```bash
pm2 logs aegg-backend --lines 50
# Revisar errores

pm2 restart aegg-backend
```

### Rollback si algo falla
```bash
# Restaurar backend
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
rm -rf dist
mv dist.backup.YYYYMMDD-HHMM dist
pm2 restart aegg-backend
```

## 📊 Resumen de Cambios Técnicos

### Backend
**Archivo**: `backend/src/trabajos/services/trabajos.service.ts`
**Método**: `actualizarVentasMensualesEnExcel`

**Antes**:
```typescript
async actualizarVentasMensualesEnExcel(...) {
    this.assertCanManage(currentUser); // ❌ Bloqueaba a Miembros
    ...
}
```

**Después**:
```typescript
async actualizarVentasMensualesEnExcel(...) {
    // ✅ Miembros, Gestores y Admins pueden actualizar
    // Validación se hace en controlador con @Roles
    ...
}
```

### Controlador
**Archivo**: `backend/src/trabajos/controllers/trabajos.controller.ts`

El decorador `@Roles(UserRole.ADMIN, UserRole.GESTOR, UserRole.MIEMBRO)` ya estaba correcto, pero el servicio tenía una validación extra que bloqueaba.

## 🎯 Resultado Final

Después de este deployment:
- ✅ Miembros pueden importar/editar reportes mensuales
- ✅ Miembros pueden enviar meses a revisión
- ✅ Miembros pueden usar "Guardar en Base" sin error 403
- ✅ Sistema de permisos consistente entre controlador y servicio

---

**Fecha**: 26 de octubre de 2025  
**Commits**: 
- `73d4b8e` - feat: Permitir a Miembros gestionar reportes mensuales
- `46dfd64` - Update frontend (fix tests)
- `1811c19` - fix: Permitir a Miembros guardar ventas en Base Anual
