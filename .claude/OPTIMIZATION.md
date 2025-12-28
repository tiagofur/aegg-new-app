# Project Context for AI Agents

**Este archivo provee contexto esencial sin sobrecargar con detalles.**

## 🎯 Project Overview

**Ordo-Todo**: Task management platform with DDD + Clean Architecture in Turborepo monorepo.

### Tech Stack Summary

```
Backend:
  - NestJS 11, TypeScript 5, Prisma 6, PostgreSQL 16
  - REST API, JWT auth, RBAC

Frontend:
  - Next.js 15, React 19, TypeScript 5, TailwindCSS 4
  - Server Components, React Query, Zustand

Mobile:
  - React Native, Expo 52, React Navigation

Desktop:
  - Electron, Vite, React

Shared Packages:
  - packages/core (domain logic)
  - packages/db (Prisma schema)
  - packages/ui (shared components)
  - packages/hooks (React Query)
  - packages/stores (Zustand)
  - packages/api-client (REST client)
```

## 📁 Critical Files (Read Once)

**Configuration:**
- `turbo.json` - Turborepo tasks
- `package.json` (root) - Dependencies
- `packages/db/prisma/schema.prisma` - Database schema

**Domain:**
- `packages/core/src/` - Entities, use cases
- `packages/db/src/` - Repository interfaces

**Rules:**
- `.claude/rules.md` - General rules
- `.claude/rules/backend.md` - Backend rules
- `.claude/rules/frontend.md` - Frontend rules
- `.claude/rules/packages.md` - Packages rules

## 🚀 Quick Start Commands

```bash
# Development
npm run dev                  # All apps
npm run dev:backend          # Backend only
npm run dev:web              # Web only

# Quality
npm run lint                 # Lint all
npm run check-types          # Type check all
npm run test                 # Test all
npm run build                # Build all

# Database
cd packages/db
npx prisma generate
npx prisma db push
```

## 🎨 Key Patterns

**Backend (NestJS):**
- Feature-based: `apps/backend/src/tasks/`
- Controller → Service → Repository
- DTOs with class-validator
- Swagger documentation required

**Frontend (Next.js):**
- App Router: `apps/web/app/`
- Server Components by default
- Components from `@ordo-todo/ui`
- Hooks from `@ordo-todo/hooks`

**Components (packages/ui):**
- Platform-agnostic (no hooks, no router)
- Accept data/callbacks via props
- Accept i18n labels via props

## 📏 Standards

**Code Quality:**
- TypeScript strict mode
- 0 linting warnings
- >80% test coverage (100% critical)
- All tests pass before commit

**UI/UX:**
- NO transparencies (solid colors only)
- NO gradients (solid colors only)
- Perfect responsiveness (mobile/tablet/desktop)
- Dark mode support
- WCAG AA accessibility

**Performance:**
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Lighthouse >90

## 🔄 Decision Tree

```
Code used by 2+ apps?
├─ YES → packages/
│   ├─ Business logic? → packages/core
│   ├─ UI component? → packages/ui
│   ├─ Data fetching? → packages/hooks
│   ├─ State? → packages/stores
│   ├─ API calls? → packages/api-client
│   └─ Translations? → packages/i18n
└─ NO → Keep local in app/
```

## 🎯 Current Focus

**Latest Versions (2025):**
- NestJS 11.x
- Next.js 15.x
- React 19.x
- Prisma 6.x
- TypeScript 5.x

**Always search for latest versions and breaking changes.**
