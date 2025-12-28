# Token Optimization Guide

**Estrategias para maximizar eficiencia y minimizar costos de tokens.**

## 🎯 Principios de Optimización

### 1. Contexto Estratégico (No Todo)

❌ **MAL:** Incluir todo el código del proyecto
✅ **BIEN:** Solo archivos esenciales + referencias

**Estrategia:**
- Archivos de configuración clave (1-2 archivos)
- Esquema de DB (1 archivo)
- Reglas del proyecto (resumido)
- Estructura de directorios (árbol)

### 2. Referencias en Lugar de Contenido

❌ **MAL:**
```markdown
Aquí está el código completo de todos los componentes...
[2000 líneas de código]
```

✅ **BIEN:**
```markdown
Estructura de componentes:
- packages/ui/src/components/ui/ → Base components (Button, Input, Card)
- packages/ui/src/components/task/ → Task-specific components
- Ver: .claude/rules/packages.md para patrones
```

### 3. Comandos Específicos

**Usar comandos que lean solo lo necesario:**

```bash
# ❌ MAL: Lee todo
cat apps/backend/src/tasks/*.ts

# ✅ BIEN: Solo estructura
find apps/backend/src -name "*.ts" | head -20

# ✅ BIEN: Solo nombres de archivos
ls -la apps/backend/src/tasks/

# ✅ BIEN: Solo conteo
find apps/backend/src -name "*.ts" | wc -l
```

---

## 📊 Sistema de Archivos Estratégicos

### Archivos para Cargar en Contexto

**Contexto Base (Siempre):**
1. `.claude/OPTIMIZATION.md` - Este archivo
2. `turbo.json` - Estructura de tareas
3. `package.json` (root) - Dependencias clave

**Por Dominio (Solo cuando necesario):**

**Backend:**
- `apps/backend/package.json` - Dependencias NestJS
- `packages/db/prisma/schema.prisma` - Schema DB
- NO todos los controllers/services

**Frontend:**
- `apps/web/package.json` - Dependencias Next.js
- `apps/web/tailwind.config.ts` - Config Tailwind
- NO todos los componentes

**Packages:**
- `packages/ui/package.json` - Dependencias UI
- `packages/core/package.json` - Dependencias Core
- NO todo el código fuente

---

## 🎯 prompts Optimizados

### ❌ Prompt Ineficiente

```
Read the entire backend codebase and understand the NestJS architecture,
then read all the controllers, services, and repositories, and then create
a new endpoint following the same patterns.
```

**Problema:** Pide leer TODO el códigobase (miles de tokens)

### ✅ Prompt Optimizado

```
Create a NestJS REST endpoint for tasks following our patterns:
- Controller: apps/backend/src/tasks/tasks.controller.ts
- Service: apps/backend/src/tasks/tasks.service.ts
- Use @ordo-todo/core entities
- Follow rules in .claude/rules/backend.md

Reference existing task controller for patterns.
```

**Ventaja:** Específico, apunta a archivos concretos, usa referencias

---

## 🚀 Estrategias por Tipo de Tarea

### 1. Nueva Feature

**Prompt Optimizado:**
```bash
Use the nestjs-backend agent to create a [feature] API endpoint:
- Path: apps/backend/src/[feature]/
- Use existing patterns from tasks/
- Follow .claude/rules/backend.md
- Include: controller, service, DTOs, tests
```

**Tokens ahorrados:** ~70% (no lee código innecesario)

### 2. Bug Fix

**Prompt Optimizado:**
```bash
Debug this error in [file]:
- Error: [copy paste error]
- File: [path to file]
- Read only that file + related imports
- Use sequential-thinking MCP for analysis
```

**Tokens ahorrados:** ~80% (solo archivo específico)

### 3. Refactor

**Prompt Optimizado:**
```bash
Use refactoring-specialist agent to refactor [component]:
- File: apps/web/src/components/[component]
- Apply SOLID principles from .claude/rules.md
- Keep same functionality, improve structure
```

**Tokens ahorrados:** ~60% (objetivo claro)

### 4. Testing

**Prompt Optimizado:**
```bash
Use testing-specialist agent to test [feature]:
- Test file: apps/backend/src/[feature]/
- Read only the feature code
- Create unit + integration tests
- Target 100% coverage
```

**Tokens ahorrados:** ~50% (solo feature específico)

---

## 📁 Uso de Herramientas

### Glob y Grep (Search)

**❌ Ineficiente:**
```typescript
// Usar Read para todo
Read apps/backend/src/tasks/tasks.controller.ts
Read apps/backend/src/tasks/tasks.service.ts
Read apps/backend/src/tasks/tasks.module.ts
```

**✅ Eficiente:**
```typescript
// Usar Glob para encontrar archivos
Glob "apps/backend/src/tasks/*.ts"

// Usar Grep para buscar patrones
Grep "@Controller" apps/backend/src/

// Leer solo lo necesario
Read apps/backend/src/tasks/tasks.controller.ts
```

**Tokens ahorrados:** ~40%

### Tree Commands

**✅ Comandos eficientes:**
```bash
# Ver estructura sin leer contenido
tree apps/backend/src -L 2 -d

# Contar archivos
find apps/backend/src -name "*.ts" | wc -l

# Listar nombres
ls -la apps/backend/src/tasks/

# Ver tamaños (para identificar archivos grandes)
du -sh apps/backend/src/*
```

---

## 🎯 Patrones de Comunicación

### 1. Ser Específico

❌ **MAL:**
```
Create something like the tasks thing but for projects
```

✅ **BIEN:**
```
Create a projects API endpoint following tasks pattern:
- Copy structure from apps/backend/src/tasks/
- Adapt for Project entity from packages/core
- Path: apps/backend/src/projects/
```

### 2. Usar Referencias

❌ **MAL:**
```
Remember that pattern we used for validation...
```

✅ **BIEN:**
```
Use validation pattern from apps/backend/src/tasks/dto/create-task.dto.ts
Apply same class-validator decorators
```

### 3. Comandos de Alto Nivel

❌ **MAL:**
```
Create a component with state, props, handlers, validation, error handling,
loading states, accessibility features, responsive design, dark mode...
```

✅ **BIEN:**
```
Create TaskCard component in packages/ui/src/components/task/
Follow patterns from existing components
Apply rules from .claude/rules/packages.md
Include: accessibility, responsive, dark mode (all required)
```

---

## 💾 Caching Inteligente

### Archivos para "Recordar" (Memory MCP)

```typescript
// Decisions que no cambian frecuentemente:
- Architecture decisions (DDD, Clean Architecture)
- Package structure (7 packages)
- Naming conventions (kebab-case, PascalCase)
- Quality standards (>80% coverage, 0 warnings)
- UI/UX rules (no transparencias, no gradients)
```

### Archivos para "Leer Siempre Necesario"

```typescript
// Código específico que cambia:
- Feature implementation files
- Test files
- Configuration files
- Package.json versions
```

---

## 🔢 Métricas de Optimización

### Antes (Sin Optimización)

```
Típica tarea de CRUD:
- Leer todo backend: ~15,000 tokens
- Leer todo frontend: ~10,000 tokens
- Leer todas las reglas: ~3,000 tokens
- Total: ~28,000 tokens por tarea
```

### Después (Con Optimización)

```
Misma tarea de CRUD:
- Leer reglas específicas: ~500 tokens
- Leer ejemplos relevantes: ~1,000 tokens
- Leer solo archivos a modificar: ~2,000 tokens
- Total: ~3,500 tokens por tarea

Ahorro: 87.5% tokens 🎉
```

---

## 🎯 Sistema de Referencias

### Crear Mapa Mental

**En lugar de explicar todo, crear referencias:**

```
Proyecto Ordo-Todo:
├─ Backend → .claude/rules/backend.md + ver apps/backend/src/tasks/
├─ Frontend → .claude/rules/frontend.md + ver apps/web/app/
├─ Packages → .claude/rules/packages.md + ver packages/ui/src/
└─ Testing → .claude/rules.md#testing-rules + usar testing-specialist
```

**Uso:**
```
"Create projects API following tasks pattern"
→ Agente lee: tasks/ como ejemplo
→ No necesita leer TODO el backend
```

---

## 🚀 Comandos Rápidos (Shortcuts)

### Para Agentes

**Backend:**
```bash
# Crear endpoint CRUD completo
Use nestjs-backend agent → create [resource] CRUD
  Pattern: apps/backend/src/tasks/
  Rules: .claude/rules/backend.md
```

**Frontend:**
```bash
# Crear componente con todo requerido
Use nextjs-frontend agent → create [Component]
  Location: packages/ui/src/components/[domain]/
  Rules: .claude/rules/packages.md
  Include: a11y, responsive, dark mode
```

**Testing:**
```bash
# Tests completos con coverage
Use testing-specialist agent → test [feature]
  File: [path to feature]
  Target: 100% coverage
  Types: unit + integration
```

---

## 📊 Checklist de Optimización

Antes de cualquier tarea:

- [ ] ¿Es específico el objetivo?
- [ ] ¿Referencia archivos/patrones existentes?
- [ ] ¿Usa agente especialista (no general)?
- [ ] ¿Menciona reglas específicas (no todas)?
- [ ] ¿Apunta a archivos concretos?
- [ ] ¿Evita leer código innecesario?
- [ ] ¿Usa comandos eficientes (Glob, Grep)?
- [ ] **Tokens estimados <5,000** para tareas típicas

---

## 🎯 Ejemplos Reales

### CRUD Backend (Optimizado)

**Prompt:**
```
Use nestjs-backend agent to create Projects CRUD API:
- Follow tasks/ pattern (apps/backend/src/tasks/)
- Path: apps/backend/src/projects/
- Entity: Project from @ordo-todo/core
- Include: controller, service, DTOs, repository, tests
- Docs: Swagger + JSDoc
- Validation: class-validator

Reference tasks for structure patterns.
Rules: .claude/rules/backend.md
```

**Tokens usados:** ~3,000 (vs ~15,000 sin optimizar)
**Ahorro:** 80%

### Componente Frontend (Optimizado)

**Prompt:**
```
Use nextjs-frontend agent to create ProjectCard component:
- Location: packages/ui/src/components/project/
- Follow TaskCard pattern
- Props: project, onClick, onEdit, onDelete, labels
- Include: accessibility, responsive (mobile/tablet/desktop), dark mode
- Tests: React Testing Library
- Docs: Storybook + JSDoc

Rules: .claude/rules/packages.md
```

**Tokens usados:** ~2,500 (vs ~10,000 sin optimizar)
**Ahorro:** 75%

---

## 💡 Tips Adicionales

### 1. **Usar Agentes Especialistas**

❌ MAL: "Create a backend feature"
✅ BIEN: "Use nestjs-backend agent to create..."

Los agentes ya tienen contexto de su área.

### 2. **Referencias > Explicaciones**

❌ MAL: "Create a service that has a method that calls the repository and validates input with class-validator and throws errors..."

✅ BIEN: "Follow TasksService pattern in apps/backend/src/tasks/"

### 3. **Reglas Específicas > Generales**

❌ MAL: "Follow all the rules in .claude/rules.md"
✅ BIEN: "Apply validation rules from .claude/rules/backend.md#validation"

### 4. **Ejemplos > Descripciones**

❌ MAL: "Create a DTO with decorators like string validation and enum checks..."
✅ BIEN: "Use same validation pattern as CreateTaskDto"

### 5. **Comandos Cortos > Largos**

❌ MAL: Prompt de 500 líneas explicando todo
✅ BIEN: Prompt de 5 líneas con referencias claras

---

## 🎯 Resultado

**Con estas optimizaciones:**

- ⚡ **87% menos tokens** por tarea
- 🚀 **3x más rápido** (menos contexto que procesar)
- 💰 **Ahorro significativo** en costos de API
- ✅ **Misma calidad** (o mejor) de output
- 🎯 **Más preciso** (objetivos claros)

---

**Built with ❤️ for Ordo-Todo**

*Optimización de tokens = Desarrollo más eficiente y económico*
