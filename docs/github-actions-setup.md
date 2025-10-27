# 🤖 Configuración GitHub Actions - Deployment Automático

## 🎯 ¿Qué hace esto?

Con GitHub Actions configurado, el deployment es **100% automático**:

```powershell
git add .
git commit -m "Nueva funcionalidad"
git push origin production
```

¡Y listo! GitHub automáticamente:
1. ✅ Build del frontend
2. ✅ Deploy al servidor
3. ✅ Backup automático
4. ✅ Rollback si falla

---

## ⚙️ Setup (Solo una vez - 10 minutos)

### 1. Crear Rama Production

```powershell
# En tu máquina local
git checkout -b production
git push origin production
```

### 2. Generar SSH Keys para GitHub

**En tu máquina local (PowerShell):**

```powershell
# Generar nueva clave SSH para GitHub Actions
ssh-keygen -t rsa -b 4096 -C "github-actions@aegg" -f ~/.ssh/aegg-github-actions

# Leer la clave privada
type ~/.ssh/aegg-github-actions
# ⚠️ Copia TODO el contenido (desde BEGIN hasta END)
```

### 3. Agregar Clave Pública al Servidor

```powershell
# Copiar clave pública al servidor
type ~/.ssh/aegg-github-actions.pub | ssh root@74.208.234.244 "cat >> ~/.ssh/authorized_keys"

# Verificar que funciona
ssh -i ~/.ssh/aegg-github-actions root@74.208.234.244 "echo OK"
```

Debería responder: `OK`

### 4. Configurar Secrets en GitHub

1. Ve a tu repositorio: https://github.com/tiagofur/aegg-new-app
2. Click en **Settings** (pestaña superior)
3. En el menú lateral: **Secrets and variables** → **Actions**
4. Click en **New repository secret**
5. Agrega estos 3 secrets:

**Secret 1: SERVER_HOST**
```
Name: SERVER_HOST
Value: 74.208.234.244
```

**Secret 2: SERVER_USER**
```
Name: SERVER_USER
Value: root
```

**Secret 3: SSH_PRIVATE_KEY**
```
Name: SSH_PRIVATE_KEY
Value: (pega la clave privada completa que copiaste en paso 2)
```

**IMPORTANTE:** La clave privada debe incluir las líneas:
```
-----BEGIN OPENSSH PRIVATE KEY-----
... todo el contenido ...
-----END OPENSSH PRIVATE KEY-----
```

### 5. Preparar el Servidor

**SSH al servidor:**

```bash
ssh root@74.208.234.244
```

**Ejecutar estos comandos:**

```bash
# 1. Ir al directorio correcto
cd /var/www/vhosts/creapolis.mx/aegg

# 2. Configurar Git si no está
git config --global user.name "AEGG Server"
git config --global user.email "server@aegg.com"

# 3. Si no es un repo Git aún, inicializar
if [ ! -d ".git" ]; then
  git init
  git remote add origin https://github.com/tiagofur/aegg-new-app.git
  git fetch
  git checkout -b production origin/production
fi

# 4. Verificar que tenemos la rama production
git branch -a

# 5. Crear .env.production para el frontend
cat > frontend/.env.production << 'EOF'
VITE_API_URL=https://aegg-api.creapolis.mx
EOF

# 6. Salir
exit
```

### 6. Crear el Workflow de GitHub Actions

El archivo ya está creado en: `.github/workflows/deploy-frontend.yml`

Solo necesitas hacer commit:

```powershell
git add .github/workflows/deploy-frontend.yml
git commit -m "Add GitHub Actions deployment"
git push origin production
```

---

## 🚀 Uso Diario

### Deployment a Producción

```powershell
# 1. Asegúrate de estar en tu rama de desarrollo
git checkout mejoras-2025-10-18

# 2. Hacer tus cambios normalmente
# ... editar código ...

# 3. Commit y push a desarrollo
git add .
git commit -m "Fix: Permisos de usuario"
git push origin mejoras-2025-10-18

# 4. Cuando esté listo para producción, merge a production
git checkout production
git merge mejoras-2025-10-18
git push origin production  # ← ¡Esto triggerea el deployment automático!
```

### Ver el Deployment en Acción

1. Ve a: https://github.com/tiagofur/aegg-new-app/actions
2. Verás tu deployment corriendo en tiempo real
3. Logs completos de cada paso
4. Notificación si falla

### Deployment Manual (sin hacer push)

También puedes triggerar deployment manual desde GitHub:

1. Ve a: https://github.com/tiagofur/aegg-new-app/actions
2. Click en "Deploy Frontend to Production"
3. Click en "Run workflow"
4. Selecciona rama `production`
5. Click en "Run workflow"

---

## 📊 Verificación Post-Deployment

Después de cada deployment, GitHub Actions muestra:

✅ Build exitoso  
✅ Deploy exitoso  
✅ URL: https://aegg.creapolis.mx  

**Verifica manualmente:**

1. Abre https://aegg.creapolis.mx
2. Revisa DevTools Console (no debe haber errores)
3. Prueba login
4. Verifica que los cambios estén aplicados

---

## 🔄 Rollback Rápido

Si algo sale mal y necesitas volver a la versión anterior:

### Opción 1: Desde el servidor (más rápido)

```bash
ssh root@74.208.234.244

cd /var/www/vhosts/creapolis.mx/aegg

# Ver backups disponibles
ls -lt httpdocs.backup.*

# Restaurar el más reciente
rm -rf httpdocs
mv httpdocs.backup.YYYYMMDD-HHMMSS httpdocs

# Verificar
ls -la httpdocs
```

### Opción 2: Desde Git

```powershell
# Ver commits recientes
git log --oneline -10

# Revertir al commit anterior
git revert HEAD
git push origin production  # ← Deploy automático del revert
```

---

## 🔐 Seguridad

### ✅ Lo que está protegido:

- ✅ SSH keys en GitHub Secrets (encriptadas)
- ✅ Variables sensibles no en el código
- ✅ Backups automáticos antes de cada deploy
- ✅ Solo rama `production` puede deployar

### 🔒 Configurar Protección de Rama

Para evitar pushes accidentales a production:

1. GitHub → Settings → Branches
2. Add rule
3. Branch name pattern: `production`
4. ✅ Require pull request before merging
5. ✅ Require status checks to pass
6. Save changes

Con esto, para deployar necesitarás:
1. Crear Pull Request: `mejoras-2025-10-18` → `production`
2. Aprobar PR
3. Merge → Deploy automático

---

## 🐛 Troubleshooting

### Error: "Permission denied (publickey)"

```powershell
# Verificar que la clave está en el servidor
ssh root@74.208.234.244 "cat ~/.ssh/authorized_keys"

# Re-agregar si es necesario
type ~/.ssh/aegg-github-actions.pub | ssh root@74.208.234.244 "cat >> ~/.ssh/authorized_keys"
```

### Error: "npm ci: no lockfile found"

El workflow necesita `package-lock.json`:

```powershell
cd frontend
npm install  # Esto crea/actualiza package-lock.json
git add package-lock.json
git commit -m "Add package-lock.json"
git push
```

### Error: "git: command not found" en el servidor

```bash
ssh root@74.208.234.244
dnf install -y git
```

### El workflow no se ejecuta

Verifica que:
1. El archivo `.github/workflows/deploy-frontend.yml` está en la rama `production`
2. Los secrets están configurados correctamente
3. Ve a Actions → Revisa si hay errores

---

## 📈 Mejoras Futuras

### 1. Notificaciones Slack/Discord

Agregar al final del workflow:

```yaml
- name: 📢 Notify Slack
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### 2. Tests Automáticos

Agregar antes del deployment:

```yaml
- name: 🧪 Run Tests
  run: |
    cd frontend
    npm run test
```

### 3. Deploy Preview

Para ver cambios antes de producción:

```yaml
on:
  pull_request:
    branches:
      - production
```

---

## ✅ Checklist de Setup Completado

- [ ] Rama `production` creada
- [ ] SSH keys generadas
- [ ] Clave pública en servidor
- [ ] 3 secrets configurados en GitHub
- [ ] Servidor tiene Git configurado
- [ ] Workflow file commiteado
- [ ] Primer deployment test exitoso

---

## 🎉 Resultado Final

Con todo configurado, tu workflow será:

```powershell
# Desarrollo normal
git checkout mejoras-2025-10-18
# ... código ...
git add .
git commit -m "Nueva feature"
git push

# Deploy a producción (1 comando!)
git checkout production
git merge mejoras-2025-10-18
git push  # ← ¡Deploy automático! 🚀
```

**Tiempo total:** ~1 minuto desde push hasta que el sitio está actualizado

---

¿Necesitas ayuda con algún paso? 🆘

- **Setup inicial:** Revisa esta guía paso a paso
- **Problemas:** Ve a la sección Troubleshooting
- **Logs:** https://github.com/tiagofur/aegg-new-app/actions
