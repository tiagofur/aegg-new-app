# 🚀 Deployment Separado - Frontend y Backend

## 📦 Archivos Disponibles

1. **`frontend-only-20251026-214315.zip`** (0.16 MB) - Solo Frontend
2. **`backend-only-20251026-214324.zip`** (27.49 MB) - Solo Backend
3. **`full-deploy-20251026-214040.zip`** (28.18 MB) - Completo (ambos)

---

## ⚡ OPCIÓN 1: Solo Actualizar Frontend

### Cuándo usar:
- Cambios solo en la interfaz (UI/UX)
- Cambios en componentes React
- **NO es suficiente para el error 403** ❌

### Pasos:

1. **Subir a Plesk:**
   - File Manager → `/tmp/`
   - Upload `frontend-only-20251026-214315.zip`
   - Extract here

2. **Ejecutar en SSH:**
   ```bash
   ssh root@74.208.234.244
   bash /tmp/deploy-frontend-only.sh
   ```

3. **Verificar:**
   - https://aegg.creapolis.mx

---

## ⚡ OPCIÓN 2: Solo Actualizar Backend

### Cuándo usar:
- Cambios en lógica del servidor
- Cambios en permisos/validaciones
- **SÍ corrige el error 403** ✅

### Pasos:

1. **Subir a Plesk:**
   - File Manager → `/tmp/`
   - Upload `backend-only-20251026-214324.zip`
   - Extract here

2. **Ejecutar en SSH:**
   ```bash
   ssh root@74.208.234.244
   bash /tmp/deploy-backend-only.sh
   ```

3. **Verificar:**
   - PM2 debe mostrar "online"
   - https://aegg-api.creapolis.mx

---

## ⚡ OPCIÓN 3: Actualizar Ambos (Recomendado)

### Cuándo usar:
- Primera vez desplegando estos cambios
- Cuando hay cambios en frontend Y backend
- **Para corregir el error 403 completo** ✅✅

### Pasos:

1. **Subir a Plesk:**
   - File Manager → `/tmp/`
   - Upload `full-deploy-20251026-214040.zip`
   - Extract here

2. **Ejecutar en SSH:**
   ```bash
   ssh root@74.208.234.244
   bash /tmp/deployment-package/deploy-update.sh
   ```

3. **Verificar:**
   - Frontend: https://aegg.creapolis.mx
   - Backend: https://aegg-api.creapolis.mx
   - "Guardar en Base" funciona sin error 403

---

## 🎯 Para Corregir el Error 403

### ⚠️ IMPORTANTE
El error 403 al hacer "Guardar en Base" requiere actualizar el **BACKEND**.

### Opciones:

#### Opción A: Solo Backend (Más rápido)
```bash
# 1. Subir backend-only-20251026-214324.zip a /tmp/
# 2. Extraer en /tmp/
# 3. Ejecutar:
bash /tmp/deploy-backend-only.sh
```

#### Opción B: Completo (Recomendado)
```bash
# 1. Subir full-deploy-20251026-214040.zip a /tmp/
# 2. Extraer en /tmp/
# 3. Ejecutar:
bash /tmp/deployment-package/deploy-update.sh
```

---

## 📊 Comparación de Opciones

| Opción | Tamaño | Tiempo | Corrige 403 | Actualiza Frontend |
|--------|--------|--------|-------------|-------------------|
| **Frontend Only** | 0.16 MB | 1 min | ❌ No | ✅ Sí |
| **Backend Only** | 27.49 MB | 2 min | ✅ Sí | ❌ No |
| **Full Deploy** | 28.18 MB | 3 min | ✅ Sí | ✅ Sí |

---

## 🔄 Rollback

### Deshacer Backend
```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg-api/backend
rm -rf dist
# Busca el backup más reciente
ls -lt | grep dist.backup
# Restaura (reemplaza con tu fecha)
mv dist.backup.20251026-XXXXXX dist
pm2 restart aegg-backend
```

### Deshacer Frontend
```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg/httpdocs
# Busca el backup más reciente
ls -lt /tmp/ | grep frontend-backup
# Restaura (reemplaza con tu fecha)
tar -xzf /tmp/frontend-backup-20251026-XXXXXX.tar.gz
```

---

## 📋 Scripts Disponibles

| Script | Ubicación | Qué hace |
|--------|-----------|----------|
| `deploy-backend-only.sh` | `/tmp/deploy-backend-only.sh` | Actualiza solo backend |
| `deploy-frontend-only.sh` | `/tmp/deploy-frontend-only.sh` | Actualiza solo frontend |
| `deploy-update.sh` | `/tmp/deployment-package/deploy-update.sh` | Actualiza ambos |

---

## ✅ Recomendación

Para **corregir el error 403**, usa:

1. **Si tienes tiempo**: Full Deploy (Opción 3)
2. **Si tienes prisa**: Backend Only (Opción 2)

Ambos corrigen el error 403, pero el Full Deploy también actualiza el frontend con los últimos cambios.

---

**Última actualización**: 26 de octubre de 2025, 21:43
