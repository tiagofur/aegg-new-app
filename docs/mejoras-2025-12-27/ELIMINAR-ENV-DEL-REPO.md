# 📝 Instrucciones para Eliminar .env del Repositorio Git

## ⚠️ ADVERTENCIA IMPORTANTE

**ANTES de ejecutar estos comandos:**
1. Asegúrate de que tienes backups de tus archivos `.env`
2. Notifica a todos los desarrolladores que deben actualizar sus repositorios locales
3. Ejecuta esto en una rama separada primero para probar

## 🔄 Paso 1: Hacer Backup

```bash
# Copiar archivos .env a ubicación segura
cp backend/.env backend/.env.backup
cp frontend/.env frontend/.env.backup
```

## 🔍 Paso 2: Verificar Archivos en Git

```bash
# Ver qué archivos .env están rastreados por Git
git ls-files | grep "\.env$"

# Ver historial de commits con archivos .env
git log --all --full-history -- '*env*'
```

## 🗑️ Paso 3: Eliminar .env del Historial de Git

### Opción A: BFG Repo-Cleaner (Recomendado)

```bash
# Instalar BFG (si no lo tienes)
brew install bfg
# o descargar de https://rtyley.github.io/bfg-repo-cleaner/

# Eliminar archivos .env de todo el historial
bfg --delete-files backend/.env frontend/.env

# Limpiar refs
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Opción B: git filter-branch (Alternativa)

```bash
# Eliminar archivos .env del historial completo
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Limpiar refs
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### Opción C: Usar git-filter-repo (Más moderno)

```bash
# Instalar git-filter-repo
pip install git-filter-repo

# Crear archivo con expresiones de archivos a eliminar
cat << 'EOF' > files-to-remove.txt
backend/.env
frontend/.env
EOF

# Ejecutar filtro
git filter-repo --invert-paths --path-from-file files-to-remove.txt
```

## ✅ Paso 4: Verificar Cambios

```bash
# Verificar que los archivos ya no están en el historial
git log --all --full-history -- '*env*'

# Verificar el tamaño del repositorio
du -sh .git
```

## 📤 Paso 5: Forzar Push (Con CUIDADO)

```bash
# Push los cambios a todas las ramas
git push origin --force --all
git push origin --force --tags
```

## 🔒 Paso 6: Agregar .env a .gitignore (Si no está)

```bash
# Verificar que .gitignore incluye .env
cat .gitignore | grep "\.env$"

# Si no está, agregarlo
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.production" >> .gitignore

# Commit el .gitignore actualizado
git add .gitignore
git commit -m "chore: ensure .env files are ignored"
```

## 🌍 Paso 7: Instrucciones para Otros Desarrolladores

Después de hacer force push, todos los desarrolladores deben:

```bash
# 1. Hacer backup de sus cambios locales
git stash
cp backend/.env backend/.env.local.backup
cp frontend/.env frontend/.env.local.backup

# 2. Renombrar rama actual (para evitar conflictos)
git branch -m old-main

# 3. Fetch los cambios del repositorio remoto
git fetch --all --prune

# 4. Recrear rama principal desde el remote
git checkout -b main origin/main

# 5. Restaurar sus cambios locales
git stash pop
cp backend/.env.local.backup backend/.env
cp frontend/.env.local.backup frontend/.env.local

# 6. Eliminar rama vieja
git branch -D old-main
```

## 🔄 Opción Alterna: Solo Evitar Futuros Commits

Si eliminar el historial es muy riesgoso, puedes **solo prevenir futuros commits**:

```bash
# 1. Eliminar archivos del tracking actual
git rm --cached backend/.env frontend/.env

# 2. Crear archivos .env.example con plantillas
cp backend/.env backend/.env.example
cp frontend/.env frontend/.env.example

# 3. Editar .env.example para quitar valores reales

# 4. Commit el cambio
git commit -m "chore: remove .env files from tracking"

# 5. Push normal (sin --force)
git push
```

⚠️ **Esta opción NO elimina los archivos del historial de Git**, solo los remueve del tracking actual.

## ⚡ Checklist de Verificación

- [ ] Backup de archivos .env creado
- [ ] Equipo notificado del cambio
- [ ] Archivos .env eliminados del historial de Git
- [ ] .gitignore verifica que incluye .env
- [ ] Repositorio limpio (verificar con `git log`)
- [ ] Force push exitoso
- [ ] Otros desarrolladores han actualizado sus repositorios
- [ ] El proyecto sigue funcionando después de cambios

## 🆘 Recuperación en Caso de Error

Si algo sale mal durante el proceso:

```bash
# Restaurar desde backup
cp backend/.env.backup backend/.env
cp frontend/.env.backup frontend/.env

# O refrescar desde un punto anterior
git reflog
git reset --hard@{n}  # donde {n} es el número del commit antes del error
```

## 📚 Referencias

- [BFG Repo-Cleaner Documentation](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo Documentation](https://github.com/newren/git-filter-repo)
- [GitHub - Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)

---

**Última actualización**: 27/12/2025
**Autor**: Security Improvement Team
