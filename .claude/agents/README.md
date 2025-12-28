# Agent System - Sistema de Gestión de Trabajos Contables V2

**Sistema de agentes especializados para desarrollo de backend NestJS y frontend React.**

## 🤖 Available Agents (4 Specialists)

### 1. NestJS Backend Agent

**File:** [nestjs-backend.md](nestjs-backend.md)

**Specializes in:**
- REST API development with NestJS 10.3
- TypeORM entities and repositories
- JWT authentication & authorization
- Excel import/processing with ExcelJS
- Service layer business logic
- DTO validation with class-validator
- Swagger/OpenAPI documentation

**Use for:**
- Creating new CRUD endpoints
- Adding authentication/authorization
- Implementing business logic
- Database schema changes
- Excel file processing
- API documentation

**Example prompt:**
```
Use the nestjs-backend agent to create a new endpoint for managing monthly reports.
Include authentication, validation, comprehensive tests, and Swagger documentation.
```

---

### 2. React Frontend Agent

**File:** [react-frontend.md](react-frontend.md)

**Specializes in:**
- React 18.2 components with hooks
- TanStack Query for data fetching
- React Router DOM 6.21 routing
- Tailwind CSS styling
- Form validation and error handling
- Responsive design (mobile, tablet, desktop)
- Accessibility (WCAG AA)

**Use for:**
- Building new pages/components
- Implementing forms with validation
- Creating responsive layouts
- Managing application state
- Error handling and loading states
- Accessible UI components

**Example prompt:**
```
Use the react-frontend agent to build a trabajo detail page with editable fields,
responsive design, accessibility features, and comprehensive tests.
```

---

### 3. PostgreSQL Specialist Agent

**File:** [postgres-specialist.md](postgres-specialist.md)

**Specializes in:**
- TypeORM entity design
- Database migrations
- Index optimization
- Relationship modeling
- Query performance
- Database constraints

**Use for:**
- Designing new entities
- Creating migrations
- Optimizing queries
- Adding indexes
- Modeling relationships
- Database troubleshooting

**Example prompt:**
```
Use the postgres-specialist agent to design a TypeORM entity for storing
monthly reports with proper relationships, indexes, and constraints.
```

---

### 4. Testing Specialist Agent

**File:** [testing-specialist.md](testing-specialist.md)

**Specializes in:**
- Unit tests (Jest for backend, Vitest for frontend)
- Integration tests
- E2E tests (Playwright)
- Test coverage (>80% target)
- Mock strategies
- Test quality and determinism

**Use for:**
- Writing comprehensive tests
- Increasing test coverage
- Fixing flaky tests
- Setting up test infrastructure
- Mock design
- E2E test scenarios

**Example prompt:**
```
Use the testing-specialist agent to write comprehensive tests for the
trabajos module with >80% coverage and 100% for critical paths.
```

---

## 🎯 When to Use Each Agent

| Task | Agent |
|------|-------|
| Create REST API endpoint | NestJS Backend |
| Add authentication/authorization | NestJS Backend |
| Implement Excel import | NestJS Backend |
| Build React component/page | React Frontend |
| Add form validation | React Frontend |
| Create responsive layout | React Frontend |
| Design TypeORM entity | PostgreSQL |
| Create database migration | PostgreSQL |
| Optimize database query | PostgreSQL |
| Write unit tests | Testing Specialist |
| Write integration tests | Testing Specialist |
| Increase test coverage | Testing Specialist |

---

## 🔄 Agent Workflow

All agents follow this autonomous workflow:

```
1. RESEARCH
   ├─ Search for latest package versions
   ├─ Check for breaking changes
   └─ Review best practices

2. PLAN
   ├─ Design solution architecture
   ├─ Define file structure
   └─ Plan testing strategy

3. IMPLEMENT
   ├─ Write clean, typed code
   ├─ Follow project rules
   └─ Use existing patterns

4. TEST
   ├─ Write unit tests
   ├─ Write integration tests
   └─ Write E2E tests (critical flows)

5. VALIDATE
   ├─ Run lint (must pass)
   ├─ Run type check (must pass)
   ├─ Run tests (100% pass)
   └─ Run build (must succeed)

6. REFACTOR
   ├─ Improve code quality
   ├─ Optimize performance
   └─ Fix any issues

7. DOCUMENT
   ├─ Add JSDoc comments
   ├─ Update README
   └─ Add usage examples

8. REPEAT
   └─ Until all quality gates pass
```

---

## 🎯 Quality Gates

**Agents MUST NOT consider a task complete until:**

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

**Additional requirements:**
- Code coverage >80% (100% for critical paths)
- Zero TypeScript errors
- Zero ESLint warnings
- All code documented with JSDoc
- Responsive design (mobile, tablet, desktop)
- Accessibility: WCAG AA compliant
- No transparencies or gradients

---

## 📋 Agent Characteristics

**All agents share these traits:**

1. **Autonomous**: Work independently through the full development cycle
2. **Latest Tech**: Always use latest stable versions and best practices
3. **Test-First**: Comprehensive testing is non-negotiable
4. **Quality Obsessed**: Don't stop until everything is perfect
5. **Well Documented**: Generate docs, examples, and comments

---

## 💡 Usage Tips

### Be Specific with Requirements

**❌ Vague:**
```
Create a trabajos page
```

**✅ Specific:**
```
Use the react-frontend agent to create a trabajos page that:
- Lists trabajos in a responsive table (mobile: cards, desktop: table)
- Filters by cliente, año, and estado
- Has create/edit/delete actions (authorized by role)
- Shows loading states and error messages
- Is accessible with keyboard navigation
- Includes comprehensive unit and integration tests
```

### Provide Context

**Include:**
- Business requirements
- User roles involved
- Data structures
- Related endpoints
- Edge cases to handle

### Let the Agent Work

- Agents work through the full autonomous cycle
- They will research, plan, implement, test, validate, refactor, and document
- Trust the process and review the complete result

---

## 🚫 What Agents Won't Do

Agents will NOT:
- ❌ Skip tests ("not enough time")
- ❌ Use `any` type ("too complicated")
- ❌ Ignore warnings ("just warnings")
- ❌ Skip documentation ("code is self-explanatory")
- ❌ Use transparencies ("looks cool")
- ❌ Use gradients ("makes it pop")
- ❌ Ignore mobile ("nobody uses mobile")
- ❌ Mark task complete with failing tests

---

## 🎯 Success Criteria

**A task is complete ONLY when:**
- ✅ All tests pass (100% success rate)
- ✅ Zero type errors
- ✅ Zero linting warnings
- ✅ Coverage >80% (100% critical paths)
- ✅ All apps build successfully
- ✅ All code documented (JSDoc)
- ✅ Perfect responsiveness (mobile, tablet, desktop)
- ✅ Accessibility: WCAG AA compliant
- ✅ No transparencies or gradients

---

## 🔗 Related Documentation

- [../rules.md](../rules.md) - Main project rules
- [../rules/backend.md](../rules/backend.md) - Backend-specific rules
- [../rules/frontend.md](../rules/frontend.md) - Frontend-specific rules
- [../CLAUDE.md](../CLAUDE.md) - Project documentation

---

**Built with ❤️ for Sistema de Gestión de Trabajos Contables V2**

*Elite agents building production-grade NestJS + React applications*
