# Claude Code Configuration Guide

**Configuración óptima de Claude Code para el proyecto Sistema de Gestión de Trabajos Contables V2.**

## ⚙️ Configuración de VSCode Extension

### Configuración Recomendada

**Archivo: `.vscode/settings.json`**

```json
{
  // Claude Code Settings
  "claudeCode.enabled": true,
  "claudeCode.model": "claude-sonnet-4-5-20250929",
  "claudeCode.temperature": 0.7,
  "claudeCode.maxTokens": 8000,

  // Context Optimization
  "claudeCode.maxContextFiles": 10,
  "claudeCode.maxFileSize": 500000,
  "claudeCode.excludePatterns": [
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/coverage/**",
    "**/*.log",
    "**/.git/**"
  ],

  // UI Preferences
  "claudeCode.showInlineDiffs": true,
  "claudeCode.autoAcceptSuggestions": false,
  "claudeCode.enableStatusIndicator": true,

  // Performance
  "claudeCode.throttleRequests": true,
  "claudeCode.cacheResponses": true
}
```

---

## 📁 Estructura del Proyecto

```
aegg-new-app/
├── backend/                    # NestJS Backend (TypeORM + PostgreSQL)
│   ├── src/
│   │   ├── auth/              # JWT Authentication
│   │   ├── clientes/          # Client CRUD
│   │   ├── trabajos/          # Core: Trabajos, Meses, Reportes
│   │   ├── users/             # User management
│   │   └── knowledge-base/    # KB endpoints
│   └── package.json
│
├── frontend/                   # React + Vite Frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Route pages
│   │   ├── services/         # API client
│   │   └── context/          # Auth context
│   └── package.json
│
├── docs/                       # Documentation
│   ├── ARCHITECTURE.md
│   ├── DEVELOPMENT.md
│   ├── FEATURES.md
│   └── DEPLOYMENT.md
│
└── docker-compose.yml          # PostgreSQL + pgAdmin
```

---

## 🤖 Agent System

### Available Agents (4 Specialists for this project)

| Agent | Specialization | Use For |
|-------|----------------|---------|
| **[NestJS Backend](agents/nestjs-backend.md)** | REST APIs, controllers, services | Backend API development |
| **[React Frontend](agents/react-frontend.md)** | React components, pages, hooks | Web UI development |
| **[PostgreSQL](agents/postgres-specialist.md)** | Database schema, migrations | Database design with TypeORM |
| **[Testing Specialist](agents/testing-specialist.md)** | Unit, integration, E2E tests | Test automation (Vitest + Jest) |

### Agent Workflow

```
1. RESEARCH  → Search for latest versions, best practices
2. PLAN      → Design solution with modern patterns
3. IMPLEMENT → Write clean, typed, validated code
4. TEST      → Create comprehensive tests
5. VALIDATE  → Run tests, fix failures, repeat until 100% passing
6. REFACTOR  → Improve quality, performance
7. DOCUMENT  → Generate docs, write comments
8. REPEAT    → Iterate until perfect
```

---

## 📋 Rule System

### Main Rules ([rules.md](rules.md))

**Core principles:**
1. **Backend**: NestJS modular architecture, TypeORM, JWT auth
2. **Frontend**: React 18, Vite, TanStack Query, Tailwind CSS
3. **Testing**: Vitest (frontend) + Jest (backend), >80% coverage
4. **Quality**: Zero type errors, zero warnings, all tests pass
5. **UI/UX**: Perfect responsiveness, accessibility, solid colors (no transparencies)

**Key rules:**
- 🏗️ [Backend Rules](rules/backend.md) - NestJS patterns, TypeORM, validation
- 🎨 [Frontend Rules](rules/frontend.md) - React patterns, state management, routing
- 📦 [No Shared Packages](rules.md) - Simple backend/frontend structure
- ⚡ [Performance Rules](rules.md) - Web Vitals, optimization
- 🔒 [Security Rules](rules/backend.md) - JWT, validation, sanitization
- 📚 [Documentation Rules](rules.md) - JSDoc, README, API docs

---

## 🎯 Quality Gates

### Mandatory Checks

**All agents MUST ensure these pass before completing tasks:**

```bash
# Backend
cd backend
npm run lint           # ✅ Zero errors, zero warnings
npm run test           # ✅ 100% tests pass
npm run build          # ✅ Zero build errors

# Frontend
cd frontend
npm run lint           # ✅ Zero errors, zero warnings
npm run test           # ✅ 100% tests pass
npm run build          # ✅ Zero build errors
```

### Coverage Requirements

- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%
- **Critical Paths** (auth, trabajos): 100%

---

## 🚀 MCP Servers Configuration

### Essential MCPs for this project

**Archivo: `%APPDATA%\Claude\claude_desktop_config.json` (Windows)**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\Usuario\\source\\repos"],
      "disabled": false
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      },
      "disabled": false
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"],
      "disabled": false
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:postgres@localhost:5440/appdb"
      },
      "disabled": false
    }
  }
}
```

---

## 🎯 Quick Reference

### When to Use Each Agent

| Task | Agent | Command |
|------|-------|---------|
| Create REST API | NestJS Backend | `Use the nestjs-backend agent...` |
| Build React component | React Frontend | `Use the react-frontend agent...` |
| Design TypeORM entity | PostgreSQL | `Use the postgres-specialist agent...` |
| Write tests | Testing Specialist | `Use the testing-specialist agent...` |

### Project-Specific Stack

**Backend:**
- Framework: NestJS 10.3
- ORM: TypeORM 0.3.20
- Database: PostgreSQL 15
- Auth: JWT + Passport
- Excel: ExcelJS 4.0

**Frontend:**
- Framework: React 18.2
- Build: Vite 7.3
- Router: React Router DOM 6.21
- State: TanStack Query 5.90
- Styling: Tailwind CSS 3.4

---

## 🎯 Success Criteria

**A task is complete only when:**
- ✅ All tests pass (100% success rate)
- ✅ Zero type errors
- ✅ Zero linting warnings
- ✅ Coverage meets thresholds (>80%)
- ✅ All apps build successfully
- ✅ All code documented
- ✅ Perfect responsiveness (mobile, tablet, desktop)
- ✅ Accessibility: WCAG AA compliant
- ✅ Performance: Lighthouse >90

---

## 🔗 Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Main project documentation
- [agents/README.md](agents/README.md) - Agent system guide
- [rules.md](rules.md) - Main project rules
- [rules/backend.md](rules/backend.md) - Backend rules
- [rules/frontend.md](rules/frontend.md) - Frontend rules

---

**Built with ❤️ for Sistema de Gestión de Trabajos Contables V2**

*Configuración optimizada para NestJS + React + TypeORM + PostgreSQL*
