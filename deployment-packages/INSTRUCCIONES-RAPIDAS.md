# 🚀 Deployment Súper Rápido - 3 Pasos

## 📦 Archivo a subir

**`full-deploy-20251026-214040.zip`** (28.18 MB)

---

## ⚡ PASOS RÁPIDOS

### 1️⃣ Subir ZIP a Plesk (2 minutos)

1. Abre Plesk: https://74.208.234.244:8443
2. **File Manager** → Navega a `/tmp/`
3. Click **Upload**
4. Selecciona `full-deploy-20251026-214040.zip`
5. Espera a que termine de subir
6. Click derecho en el ZIP → **Extract here**
7. Confirmar extracción

### 2️⃣ Ejecutar Script (1 comando SSH)

```bash
ssh root@74.208.234.244
bash /tmp/deployment-package/deploy-update.sh
```

**¡Eso es todo!** El script hace automáticamente:

- ✅ Backup del backend actual
- ✅ Backup del frontend actual
- ✅ Actualiza backend
- ✅ Actualiza frontend
- ✅ Ajusta permisos
- ✅ Reinicia PM2
- ✅ Muestra estado y logs

### 3️⃣ Verificar (1 minuto)

1. Visita: https://aegg.creapolis.mx
2. Login como **Miembro**
3. Ve a un trabajo → Mes → Reporte MI Admin
4. Scroll abajo → Click **"Guardar en Base"**
5. **NO debe dar error 403** ✅
6. Debe aparecer diálogo de confirmación
7. Confirma y verifica que guarda correctamente

---

## 📋 Resumen Visual

```
┌─────────────────────────────────────────┐
│ 1. Subir ZIP a Plesk                   │
│    /tmp/ → Upload → Extract             │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 2. SSH → Ejecutar 1 comando             │
│    bash /tmp/deployment-package/        │
│         deploy-update.sh                │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│ 3. Verificar en navegador               │
│    ✅ "Guardar en Base" funciona         │
└─────────────────────────────────────────┘
```

---

## 🎯 ¿Qué se corrigió?

**Error 403** al hacer click en "Guardar en Base" como Miembro.

**Causa**: Validación extra en el backend que bloqueaba a Miembros.

**Solución**: Removida validación `assertCanManage()` en el servicio.

---

## 🆘 Si algo sale mal

### Rollback Backend

```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend
rm -rf dist
# Busca el backup más reciente
ls -lt | grep dist.backup
# Restaura (reemplaza con tu fecha)
mv dist.backup.20251026-214040 dist
pm2 restart aegg-backend
```

### Rollback Frontend

```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg/httpdocs
# Busca el backup más reciente
ls -lt /tmp/ | grep frontend-backup
# Restaura (reemplaza con tu fecha)
tar -xzf /tmp/frontend-backup-20251026-214040.tar.gz
```

### Ver logs si hay errores

```bash
pm2 logs aegg-backend --lines 50
```

---

## ✅ Checklist Final

- [ ] ZIP subido a `/tmp/` en Plesk
- [ ] ZIP extraído correctamente
- [ ] Script ejecutado sin errores
- [ ] PM2 muestra "online"
- [ ] Frontend carga correctamente
- [ ] "Guardar en Base" funciona sin error 403

---

**Tiempo total estimado**: 4-5 minutos ⏱️

**Nivel de dificultad**: ⭐ Muy Fácil

**Archivos modificados**: Backend + Frontend
