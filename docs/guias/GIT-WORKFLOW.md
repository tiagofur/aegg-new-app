# 🔄 Git Workflow - Guía de Commits y Push

## 📋 Filosofía de Commits

**Regla de Oro:** Hacer commit después de cada funcionalidad completada o cambio significativo.

---

## ✅ Cuándo Hacer Commit

### ✅ HACER COMMIT cuando:

1. **Completas una funcionalidad**

   ```bash
   # Ejemplo: Terminaste de crear el componente ReporteViewer
   git add frontend/src/components/trabajos/ReporteViewer.tsx
   git commit -m "feat: agregar componente ReporteViewer para visualizar reportes"
   ```

2. **Implementas un endpoint**

   ```bash
   git add backend/src/trabajos/controllers/trabajos.controller.ts
   git commit -m "feat: agregar endpoint POST /trabajos/:id/reporte-base/importar"
   ```

3. **Corriges un bug**

   ```bash
   git add backend/src/trabajos/services/reportes-mensuales.service.ts
   git commit -m "fix: corregir cálculo de IVA en consolidación de reportes"
   ```

4. **Actualizas documentación**

   ```bash
   git add docs/
   git commit -m "docs: actualizar FASE-4-VISUALIZACION-REPORTES.md con ejemplos"
   ```

5. **Cambios en configuración**
   ```bash
   git add backend/package.json
   git commit -m "chore: agregar dependencia XLSX para procesamiento de Excel"
   ```

### ❌ NO hacer commit cuando:

- Código a mitad de implementación (no compila)
- Archivos temporales o de prueba
- Código comentado o debugging
- node_modules/ o archivos generados

---

## 📝 Formato de Commits (Conventional Commits)

### Estructura:

```
<tipo>(<scope>): <descripción>

[body opcional]

[footer opcional]
```

### Tipos de Commit:

| Tipo       | Descripción                                         | Ejemplo                                         |
| ---------- | --------------------------------------------------- | ----------------------------------------------- |
| `feat`     | Nueva funcionalidad                                 | `feat: agregar visualización de reportes`       |
| `fix`      | Corrección de bug                                   | `fix: solucionar error en cálculo de totales`   |
| `docs`     | Documentación                                       | `docs: actualizar README con nueva fase`        |
| `style`    | Formato, espacios (no afecta lógica)                | `style: formatear código con prettier`          |
| `refactor` | Refactorización (no añade features ni arregla bugs) | `refactor: extraer lógica de cálculo a service` |
| `test`     | Agregar o modificar tests                           | `test: agregar tests para consolidación`        |
| `chore`    | Mantenimiento, dependencias                         | `chore: actualizar dependencias`                |
| `perf`     | Mejora de performance                               | `perf: optimizar query de reportes`             |

### Ejemplos Reales del Proyecto:

```bash
# Nueva funcionalidad completa
git commit -m "feat(frontend): agregar componente ReporteViewer con tabs y paginación"

# Corrección de bug
git commit -m "fix(backend): corregir estructura JSONB en reporte base anual"

# Mejora de código
git commit -m "refactor(backend): cambiar cálculo de totales de objetos a arrays"

# Documentación
git commit -m "docs: agregar MEJORA-CONSOLIDACION-AUTOMATICA.md"

# Configuración
git commit -m "chore(backend): agregar XLSX a dependencias"
```

---

## 🎯 Workflow Recomendado

### Opción 1: Commit por Feature + Push al Final del Día ⭐ RECOMENDADO

```bash
# Mañana: Empiezas a trabajar
git pull origin main

# 10:00 AM - Completaste ReporteViewer
git add frontend/src/components/trabajos/ReporteViewer.tsx
git commit -m "feat: agregar componente ReporteViewer"

# 11:30 AM - Completaste ImportReporteBaseDialog
git add frontend/src/components/trabajos/ImportReporteBaseDialog.tsx
git commit -m "feat: agregar diálogo de importación de reporte base"

# 1:00 PM - Completaste endpoint backend
git add backend/src/trabajos/controllers/trabajos.controller.ts backend/src/trabajos/services/trabajos.service.ts
git commit -m "feat: agregar endpoint de importación de reporte base"

# 2:30 PM - Integraste todo
git add frontend/src/components/trabajos/TrabajoDetail.tsx
git commit -m "feat: integrar visualización e importación en TrabajoDetail"

# 4:00 PM - Actualizaste docs
git add docs/
git commit -m "docs: agregar documentación de Fase 4"

# 5:00 PM - Fin del día: PUSH de todo
git push origin main
```

**Ventajas:**

- ✅ Historial detallado localmente
- ✅ Un solo push al final (menos ruido en GitHub)
- ✅ Puedes hacer rollback local si algo falla
- ✅ Trabajo offline sin problemas

---

### Opción 2: Commit + Push Inmediato

```bash
# Completaste feature
git add .
git commit -m "feat: agregar visualización de reportes"
git push origin main

# Ventaja: Backup inmediato en GitHub
# Desventaja: Muchos pushes, más lento
```

**Ventajas:**

- ✅ Backup inmediato en la nube
- ✅ Otros pueden ver tu progreso en tiempo real

**Desventajas:**

- ❌ Más lento (esperas push cada vez)
- ❌ Más ruido en el historial de GitHub

---

### Opción 3: Commit por Fase + Push al Completar Fase ⭐ MEJOR PARA ESTE PROYECTO

```bash
# Durante Fase 4: Haces múltiples commits locales
git commit -m "feat: agregar ReporteViewer"
git commit -m "feat: agregar ImportReporteBaseDialog"
git commit -m "feat: agregar endpoint de importación"
git commit -m "docs: documentar Fase 4"

# Al completar TODA la Fase 4:
git push origin main

# Ventaja: Un push por fase completada
```

---

## 🔀 Comandos Git Útiles

### Ver estado actual

```bash
git status
```

### Ver commits recientes

```bash
git log --oneline -10
```

### Ver cambios antes de commit

```bash
git diff
```

### Agregar todos los archivos modificados

```bash
git add .
```

### Agregar archivos específicos

```bash
git add backend/src/trabajos/
git add docs/FASE-4*.md
```

### Ver historial con gráfico

```bash
git log --graph --oneline --all
```

### Deshacer último commit (mantener cambios)

```bash
git reset --soft HEAD~1
```

### Deshacer cambios en archivo (antes de commit)

```bash
git checkout -- archivo.ts
```

### Ver diferencias entre commits

```bash
git diff HEAD~1 HEAD
```

---

## 📦 Estructura de Commits por Fase

### Ejemplo: Fase 4 (Visualización de Reportes)

```bash
# Commit 1: Componente base
git add frontend/src/components/trabajos/ReporteViewer.tsx
git commit -m "feat(frontend): agregar componente ReporteViewer

- Visualización de datos en tabla
- Navegación entre hojas (tabs)
- Responsive design"

# Commit 2: Importación
git add frontend/src/components/trabajos/ImportReporteBaseDialog.tsx frontend/src/services/trabajos.service.ts
git commit -m "feat(frontend): agregar importación de reporte base

- Diálogo de upload de Excel
- Validación de archivos .xlsx/.xls
- Integración con API"

# Commit 3: Backend
git add backend/src/trabajos/controllers/trabajos.controller.ts backend/src/trabajos/services/trabajos.service.ts
git commit -m "feat(backend): agregar endpoint de importación

- POST /trabajos/:id/reporte-base/importar
- Procesamiento de Excel con XLSX
- Almacenamiento en JSONB"

# Commit 4: Integración
git add frontend/src/components/trabajos/TrabajoDetail.tsx frontend/src/components/trabajos/ReporteCard.tsx frontend/src/pages/TrabajosPage.tsx
git commit -m "feat(frontend): integrar visualización en trabajo detail

- Toggle ver/ocultar reportes
- Reload automático después de importar
- Estados de loading y error"

# Commit 5: Documentación
git add docs/FASE-4-VISUALIZACION-REPORTES.md docs/RESUMEN-FASE-4.md docs/INDICE-DOCUMENTACION.md
git commit -m "docs: documentar Fase 4 completa

- Guía técnica detallada
- Resumen ejecutivo
- Actualización de índice"

# PUSH final
git push origin main
```

---

## 🎓 Mejores Prácticas

### ✅ DO (Hacer):

1. **Commits atómicos:** Un commit = un cambio lógico
2. **Mensajes descriptivos:** Explica QUÉ y POR QUÉ
3. **Commits frecuentes:** Mejor muchos pequeños que uno gigante
4. **Pull antes de push:** `git pull origin main` antes de `git push`
5. **Revisar cambios:** `git diff` antes de commit
6. **Test antes de push:** Asegúrate que compile y funcione

### ❌ DON'T (Evitar):

1. **No commits de código roto:** Siempre debe compilar
2. **No commits gigantes:** Difícil de revisar y revertir
3. **No mensajes vagos:** "fix", "update", "changes" NO son útiles
4. **No commitear secretos:** API keys, passwords en .env
5. **No commitear node_modules:** Usar .gitignore
6. **No push sin pull:** Puede causar conflictos

---

## 📊 Ejemplo de Historial Limpio

```bash
git log --oneline

abc1234 docs: actualizar FASE-4-VISUALIZACION-REPORTES.md con ejemplos
def5678 feat(frontend): integrar visualización en trabajo detail
ghi9012 feat(backend): agregar endpoint de importación de reporte base
jkl3456 feat(frontend): agregar diálogo de importación de reporte base
mno7890 feat(frontend): agregar componente ReporteViewer
pqr1234 feat(backend): implementar cálculos reales en consolidación
stu5678 refactor(backend): cambiar estructura de datos a arrays
vwx9012 fix(backend): corregir cálculo de IVA en reportes
yza3456 docs: crear MEJORA-CONSOLIDACION-AUTOMATICA.md
```

**Ventajas de este historial:**

- ✅ Cada commit tiene sentido por sí solo
- ✅ Fácil de entender qué se hizo
- ✅ Fácil de hacer rollback si algo falla
- ✅ Fácil de generar CHANGELOG

---

## 🚀 Workflow para Nueva Funcionalidad

### Paso a Paso:

```bash
# 1. Asegurarte que estás actualizado
git pull origin main

# 2. Crear feature (opcional, si quieres rama)
git checkout -b feature/visualizacion-reportes

# 3. Trabajar en la funcionalidad
# ... editar archivos ...

# 4. Revisar cambios
git status
git diff

# 5. Agregar archivos
git add frontend/src/components/trabajos/ReporteViewer.tsx

# 6. Commit
git commit -m "feat: agregar componente ReporteViewer"

# 7. Más cambios si es necesario
# ... repetir pasos 3-6 ...

# 8. Cuando termines la feature completa
git checkout main
git merge feature/visualizacion-reportes

# 9. Push al remoto
git push origin main

# 10. Eliminar rama feature (opcional)
git branch -d feature/visualizacion-reportes
```

---

## 🔧 Configuración Inicial de Git

### Primera vez:

```bash
# Configurar nombre
git config --global user.name "Tu Nombre"

# Configurar email
git config --global user.email "tu@email.com"

# Editor por defecto
git config --global core.editor "code --wait"

# Ver configuración
git config --list
```

### .gitignore (Ya configurado)

```gitignore
# Dependencias
node_modules/
package-lock.json

# Builds
dist/
build/

# Env
.env
.env.local

# IDEs
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
```

---

## 📋 Checklist Antes de Push

```bash
□ Código compila sin errores
□ Removí console.logs de debug
□ Removí código comentado
□ Actualicé documentación si es necesario
□ Archivos .env no incluidos
□ node_modules/ no incluido
□ Tests pasan (si existen)
□ Mensaje de commit descriptivo
□ Pull antes de push
```

---

## 🎯 Resumen - Workflow Recomendado

### Para este proyecto específico:

```bash
# Opción RECOMENDADA: Commit por feature + Push al final del día

1. git pull origin main                    # Al inicio del día
2. Trabajas en features
3. git add <archivos>                      # Después de cada feature
4. git commit -m "tipo: descripción"       # Mensaje descriptivo
5. Repites 2-4 varias veces
6. git push origin main                    # Al final del día o al completar fase

# Frecuencia de commits: Cada 1-2 horas de trabajo
# Frecuencia de push: 1 vez al día o al completar fase completa
```

---

## 💡 Tips Finales

1. **Commit temprano y frecuentemente:** Es gratis hacer commits locales
2. **Push 1 vez al día:** Backup en GitHub sin ruido
3. **Mensajes claros:** Tu yo del futuro te lo agradecerá
4. **Pull antes de push:** Evita conflictos
5. **Un commit = un cambio lógico:** Más fácil de revertir si es necesario

---

**Última actualización:** 7 de octubre de 2025  
**Recomendación:** Commit por feature, Push al final del día 🎯
