# 🚀 Guía Rápida de Deployment

## ✅ Para actualizar SOLO el Frontend (Tu caso actual)

### Opción 1: La Más Rápida (Recomendada) ⚡

```powershell
.\quick-deploy.ps1
```

**Resultado:**

- ✅ Build automático del frontend
- ✅ Commit y push a GitHub
- ✅ Genera ZIP listo para subir
- ⏱️ Tiempo: ~2 minutos

**Luego:**

1. Ve a Plesk File Manager
2. Sube el ZIP de `deployment-packages/`
3. Extrae en `/var/www/vhosts/creapolis.mx/aegg/httpdocs/`
4. ¡Listo! 🎉

---

### Opción 2: Con Más Control

```powershell
.\deploy-frontend-only.ps1
```

**Incluye:**

- Confirmación antes de proceder
- README con instrucciones
- Verificación de cambios Git

---

### Opción 3: Automático (Requiere SSH configurado)

```powershell
.\deploy-to-production.ps1 -FrontendOnly
```

**Ventaja:** Deploy automático directo al servidor (sin subir ZIP manualmente)

**Requisito:** Tener SSH keys configuradas (ver abajo)

---

## 🔄 Estrategia con Rama Production (Próximo paso)

### 1. Crear rama Production (solo una vez)

```powershell
git checkout -b production
git push origin production
```

### 2. Workflow normal

```powershell
# Desarrollo en mejoras-2025-10-18
git checkout mejoras-2025-10-18
# ... hacer cambios ...
git add .
git commit -m "Nueva funcionalidad"
git push origin mejoras-2025-10-18

# Cuando esté listo para producción
git checkout production
git merge mejoras-2025-10-18
git push origin production  # ← Esto deployea automáticamente con GitHub Actions
```

### 3. Configurar GitHub Actions (opcional pero recomendado)

Ver archivo: `docs/estrategia-deployment-ramas.md` sección "GitHub Actions"

---

## 🔐 Configurar SSH para Deployment Automático (Opcional)

### Si quieres usar `deploy-to-production.ps1`

**En tu máquina:**

```powershell
# Generar SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/aegg-deploy

# Copiar al servidor
type ~/.ssh/aegg-deploy.pub | ssh root@74.208.234.244 "cat >> ~/.ssh/authorized_keys"

# Probar conexión
ssh root@74.208.234.244 "echo OK"
```

**Si funciona, ya puedes usar:**

```powershell
.\deploy-to-production.ps1 -FrontendOnly
```

---

## 📋 Resumen de Comandos

| Lo que necesitas              | Comando                                    | Tiempo |
| ----------------------------- | ------------------------------------------ | ------ |
| Deploy frontend rápido        | `.\quick-deploy.ps1`                       | 2 min  |
| Deploy frontend con control   | `.\deploy-frontend-only.ps1`               | 3 min  |
| Deploy frontend automático    | `.\deploy-to-production.ps1 -FrontendOnly` | 1 min  |
| Deploy completo (back+front)  | `.\deploy-to-production.ps1`               | 5 min  |
| Crear paquete completo manual | `.\prepare-deployment.ps1`                 | 10 min |

---

## 🎯 Recomendación

**AHORA (desarrollo activo):**

```powershell
.\quick-deploy.ps1
```

Es lo más rápido y simple.

**DESPUÉS (cuando estabilices):**

1. Crea rama `production`
2. Configura GitHub Actions
3. Deploy automático con solo: `git push origin production`

---

## 🆘 Si algo falla

### Build Error

```powershell
cd frontend
Remove-Item -Recurse node_modules
npm install
npm run build
cd ..
```

### Git Error

```powershell
git status
git add .
git commit -m "Fix"
git push origin mejoras-2025-10-18
```

### Rollback (en el servidor)

```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg
# Restaurar backup si existe
cp -r httpdocs.backup.* httpdocs/
```

---

## 📚 Documentación Adicional

- **Estrategia completa:** `docs/estrategia-deployment-ramas.md`
- **Deployment manual:** `DEPLOYMENT-CHECKLIST.md`
- **Git alternativo:** `DEPLOYMENT-GIT.md`

---

¿Necesitas ayuda? Revisa los logs:

- Frontend: DevTools → Console
- Backend: `ssh root@74.208.234.244 'pm2 logs aegg-backend'`
