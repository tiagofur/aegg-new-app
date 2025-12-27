# 🚀 Plan de Mejoras de Seguridad y Configuración - Diciembre 2025

**Fecha**: 27/12/2025
**Estado**: 🟡 En Progreso
**Prioridad**: CRÍTICA - ALTA

---

## 📊 Resumen Ejecutivo

Análisis completo de configuración técnica reveló **problemas críticos de seguridad** que requieren atención inmediata antes de producción.

### Nivel de Riesgo: ⚠️ MEDIO-ALTO

- 🔴 **8 problemas críticos** - Atención inmediata
- 🟡 **6 problemas de alta prioridad** - Esta semana
- 🟠 **6 problemas de prioridad media** - 2 semanas
- 🟢 **6 mejoras recomendadas** - 1 mes

---

## 🔴 PROBLEMAS CRÍTICOS (Prioridad: HOY)

### 1. ❌ Archivos .env Commiteados en el Repositorio

**Severidad**: CRÍTICA
**Estado**: ⏳ Pendiente
**Ubicación**:
- `backend/.env`
- `frontend/.env`

**Riesgos**:
- Credenciales de base de datos comprometidas
- JWT secrets expuestos permanentemente
- Contraseñas visibles en el historial de Git

**Acción**:
```bash
# Eliminar archivos .env del historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Forzar push (CUIDADO: solo si se ha informado al equipo)
git push origin --force --all
```

**Archivos afectados**:
- `backend/.env` (debe existir solo localmente)
- `frontend/.env` (debe existir solo localmente)

**Implementación**: [Ver commit #1](#commit-1)

---

### 2. ❌ JWT Secret con Fallback Inseguro

**Severidad**: CRÍTICA
**Estado**: ⏳ Pendiente
**Ubicación**: `backend/src/auth/auth.module.ts:21`

**Problema**:
```typescript
secret: configService.get<string>('JWT_SECRET', 'your-super-secret-jwt-key-change-in-production'),
```

**Riesgos**:
- Token forgery (falsificación de tokens)
- Escalación de privilegios
- Accesso no autorizado completo

**Solución**:
```typescript
secret: configService.get<string>('JWT_SECRET') || (() => {
  throw new Error('JWT_SECRET environment variable is required in production');
})(),
```

**Implementación**: [Ver commit #2](#commit-2)

---

### 3. ❌ Vulnerabilidades HIGH en Dependencias

**Severidad**: CRÍTICA
**Estado**: ⏳ Pendiente

**Backend**:
- `@nestjs/cli@10.4.9` → `@11.0.14`
- `glob@10.2.0-10.4.5` → Actualizar

**Frontend**:
- `vite@5.4.20` → `@7.3.0`
- `esbuild@<=0.24.2` → Actualizar
- `glob@10.2.0-10.4.5` → Actualizar

**Acción**:
```bash
# Backend
cd backend
npm install @nestjs/cli@11.0.14

# Frontend
cd frontend
npm install vite@7.3.0
```

**Implementación**: [Ver commit #3](#commit-3)

---

### 4. ❌ TypeScript Strict Mode Deshabilitado (Backend)

**Severidad**: CRÍTICA
**Estado**: ⏳ Pendiente
**Ubicación**: `backend/tsconfig.json`

**Problema**:
```json
{
  "strictNullChecks": false,
  "noImplicitAny": false,
  "strictBindCallApply": false,
  "forceConsistentCasingInFileNames": false,
  "noFallthroughCasesInSwitch": false
}
```

**Riesgos**:
- Bugs en producción por tipos indefinidos
- Sin type safety en producción
- Vulnerabilidades por falta de validación

**Solución**:
```json
{
  "strictNullChecks": true,
  "noImplicitAny": true,
  "strictBindCallApply": true,
  "forceConsistentCasingInFileNames": true,
  "noFallthroughCasesInSwitch": true
}
```

**Impacto**: Requerirá corrección de errores de tipo en todo el código

**Implementación**: [Ver commit #4](#commit-4)

---

## 🟡 PROBLEMAS DE ALTA PRIORIDAD (Esta Semana)

### 5. ⚠️ Falta de Rate Limiting

**Severidad**: ALTA
**Estado**: ⏳ Pendiente

**Riesgos**:
- Brute force attacks en login
- DoS attacks por sobrecarga de requests
- API abuse

**Solución**:
```bash
npm install @nestjs/throttler
```

```typescript
// app.module.ts
import { ThrottlerModule } from '@nestjs/throttler';

ThrottlerModule.forRoot([{
  ttl: 60000,        // 60 segundos
  limit: 100,         // máximo 100 requests
}])
```

**Implementación**: [Ver commit #5](#commit-5)

---

### 6. ⚠️ Falta de Helmet (Headers de Seguridad)

**Severidad**: ALTA
**Estado**: ⏳ Pendiente
**Ubicación**: `backend/src/main.ts`

**Headers faltantes**:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`
- `Strict-Transport-Security` (HSTS)
- `Content-Security-Policy`

**Solución**:
```bash
npm install helmet
```

```typescript
// main.ts
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

**Implementación**: [Ver commit #6](#commit-6)

---

### 7. ⚠️ Database Connection Pooling NO Configurado

**Severidad**: ALTA
**Estado**: ⏳ Pendiente
**Ubicación**: `backend/src/app.module.ts`

**Problema**: PostgreSQL crea una conexión nueva por cada request

**Solución**:
```typescript
TypeOrmModule.forRoot({
    // ... configuración existente ...
    extra: {
        max: 20,                       // Máximo de conexiones en pool
        min: 5,                        // Mínimo de conexiones a mantener
        idleTimeoutMillis: 30000,       // Timeout para conexiones idle
        connectionTimeoutMillis: 2000,  // Timeout de conexión
    },
}),
```

**Implementación**: [Ver commit #7](#commit-7)

---

### 8. ⚠️ File Upload Limits Excesivos

**Severidad**: ALTA
**Estado**: ⏳ Pendiente
**Ubicación**: `backend/src/main.ts:9-10`

**Problema**:
```typescript
app.use(json({ limit: '25mb' }));
app.use(urlencoded({ limit: '25mb', extended: true }));
```

**Riesgo**: Permite DoS attacks enviando archivos grandes

**Solución**:
```typescript
app.use(json({ limit: '1mb' }));
app.use(urlencoded({ limit: '1mb', extended: true }));

// Configurar límites específicos para file uploads
const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
});
```

**Implementación**: [Ver commit #8](#commit-8)

---

### 9. ⚠️ Falta de Sanitización de Input

**Severidad**: ALTA
**Estado**: ⏳ Pendiente

**Riesgos**:
- XSS attacks
- SQL injection (aunque TypeORM ayuda)
- Injection attacks

**Solución Backend**:
```bash
npm install sanitize-html
```

```typescript
// Crear helper para sanitización
import sanitizeHtml from 'sanitize-html';

export function sanitizeInput(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
  });
}
```

**Solución Frontend**:
```bash
npm install dompurify @types/dompurify
```

```typescript
import DOMPurify from 'dompurify';

const clean = DOMPurify.sanitize(userInput);
```

**Implementación**: [Ver commit #9](#commit-9)

---

### 10. ⚠️ CORS Configuration - Demasiado Permisiva en Desarrollo

**Severidad**: ALTA
**Estado**: ⏳ Pendiente
**Ubicación**: `backend/src/main.ts:13-15`

**Problema**: 5 orígenes diferentes en desarrollo sin validación

**Solución**:
```typescript
const devOrigins = (process.env.DEV_ORIGINS || 'http://localhost:5173').split(',');
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://aegg.creapolis.mx']
    : devOrigins;
```

**Implementación**: [Ver commit #10](#commit-10)

---

## 🟠 PROBLEMAS DE PRIORIDAD MEDIA (2 Semanas)

### 11. 📝 Dependencias Desactualizadas

**Backend** (16 paquetes desactualizados):
- `@nestjs/common`: 10.4.20 → 11.1.10
- `@nestjs/core`: 10.4.20 → 11.1.10
- `@nestjs/config`: 3.3.0 → 4.0.2 (breaking changes)
- `typeorm`: 0.3.27 → 0.3.28
- `bcrypt`: 5.1.1 → 6.0.0 (breaking changes)

**Frontend** (15 paquetes desactualizados):
- `react`: 18.3.1 → 19.2.3 (breaking changes)
- `react-router-dom`: 6.30.1 → 7.11.0 (breaking changes)
- `tailwindcss`: 3.4.18 → 4.1.18 (breaking changes)
- `vitest`: 3.2.4 → 4.0.16 (breaking changes)

**Plan de actualización**: Gradual, priorizando seguridad

---

### 12. 📝 Frontend - Bundle Size Subóptimo

**Problema**: Bundle principal de 335 KB es grande

**Solución**:
```typescript
// vite.config.ts
build: {
    chunkSizeWarningLimit: 500,
    rollupOptions: {
        output: {
            manualChunks: {
                'react-vendor': ['react', 'react-dom', 'react-router-dom'],
                'query-vendor': ['@tanstack/react-query', '@tanstack/react-table'],
                'axios': ['axios'],
                'ui-vendor': ['lucide-react'],
            },
        },
    },
    minify: 'terser',
    terserOptions: {
        compress: {
            drop_console: true,  // Remover console.log en producción
            drop_debugger: true,
        },
    },
}
```

---

### 13. 📝 Falta de ESLint/Prettier en Frontend

**Impacto**: Inconsistencias en código

**Solución**:
```bash
npm install -D eslint @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser eslint-plugin-react eslint-plugin-react-hooks \
  prettier eslint-config-prettier eslint-plugin-prettier
```

**Configuración mínima**: Ver archivo `.eslintrc.json`

---

### 14. 📝 No hay Optimización de Imágenes

**Solución**:
```bash
npm install vite-plugin-imagemin
```

```typescript
// vite.config.ts
import viteImagemin from 'vite-plugin-imagemin';

plugins: [
    viteImagemin({
        gifsicle: { optimizationLevel: 7 },
        optipng: { optimizationLevel: 7 },
        mozjpeg: { quality: 80 },
        webp: { quality: 80 },
    }),
],
```

---

### 15. 📝 Docker Compose Incompleto

**Problema**: Solo PostgreSQL y pgAdmin definidos

**Solución**: Agregar backend y frontend

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_HOST=postgres
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
  
  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

---

### 16. 📝 Tests Fallando en Frontend

**Problema**: 2/23 tests fallan (Router context)

**Error**: `useLocation() may be used only in the context of a <Router> component.`

**Solución**:
```typescript
import { MemoryRouter } from 'react-router-dom';

render(
  <MemoryRouter>
    <TrabajoDetail {...props} />
  </MemoryRouter>
);
```

---

## 🟢 MEJORAS RECOMENDADAS (1 Mes)

### 17. ✨ Implementar Refresh Tokens

**Estado**: Pendiente

### 18. ✨ Implementar Service Worker/PWA

**Estado**: Pendiente

### 19. ✨ Configurar Logging Estructurado (Winston)

**Estado**: Pendiente

### 20. ✨ Agregar Health Check Endpoint

**Estado**: Pendiente

### 21. ✨ Implementar Monitoring (Sentry/New Relic)

**Estado**: Pendiente

### 22. ✨ Implementar Backup Automático de DB

**Estado**: Pendiente

---

## 📋 REGISTRO DE IMPLEMENTACIÓN

### Commit #1: Eliminar archivos .env del repositorio
- **Estado**: ⏳ Pendiente
- **Archivos**: Eliminar `backend/.env` y `frontend/.env` de Git
- **Fecha**: --

### Commit #2: Remover fallback inseguro de JWT_SECRET
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/src/auth/auth.module.ts`, `backend/src/auth/strategies/jwt.strategy.ts`
- **Fecha**: --

### Commit #3: Actualizar dependencias con vulnerabilidades HIGH
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/package.json`, `frontend/package.json`
- **Fecha**: --

### Commit #4: Habilitar strict mode en backend TypeScript
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/tsconfig.json`
- **Fecha**: --

### Commit #5: Implementar Rate Limiting
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/package.json`, `backend/src/app.module.ts`
- **Fecha**: --

### Commit #6: Implementar Helmet
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/package.json`, `backend/src/main.ts`
- **Fecha**: --

### Commit #7: Configurar Database Connection Pooling
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/src/app.module.ts`
- **Fecha**: --

### Commit #8: Reducir File Upload Limits
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/src/main.ts`
- **Fecha**: --

### Commit #9: Implementar Sanitización de Input
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/package.json`, `frontend/package.json`, nuevos archivos de helpers
- **Fecha**: --

### Commit #10: Mejorar CORS Configuration
- **Estado**: ⏳ Pendiente
- **Archivos**: `backend/src/main.ts`, `backend/.env.production.example`
- **Fecha**: --

---

## 📊 SEGUIMIENTO DE PROGRESO

| ID | Tarea | Severidad | Estado | Progreso |
|----|-------|-----------|--------|----------|
| 1 | Eliminar .env del repo | 🔴 CRÍTICO | ⏳ Pendiente | 0% |
| 2 | Remover fallback JWT_SECRET | 🔴 CRÍTICO | ⏳ Pendiente | 0% |
| 3 | Actualizar dependencias HIGH | 🔴 CRÍTICO | ⏳ Pendiente | 0% |
| 4 | Habilitar strict mode TS | 🔴 CRÍTICO | ⏳ Pendiente | 0% |
| 5 | Implementar rate limiting | 🟡 ALTA | ⏳ Pendiente | 0% |
| 6 | Implementar Helmet | 🟡 ALTA | ⏳ Pendiente | 0% |
| 7 | Database pooling | 🟡 ALTA | ⏳ Pendiente | 0% |
| 8 | Reducir upload limits | 🟡 ALTA | ⏳ Pendiente | 0% |
| 9 | Sanitización de input | 🟡 ALTA | ⏳ Pendiente | 0% |
| 10 | Mejorar CORS config | 🟡 ALTA | ⏳ Pendiente | 0% |

**Progreso General**: 0% (0/22 completadas)

---

## 🎯 MÉTRICAS DE ÉXITO

### Seguridad
- [ ] 0 vulnerabilidades HIGH
- [ ] 0 archivos .env en Git
- [ ] JWT_SECRET validado en producción
- [ ] Todos los headers de seguridad configurados

### Performance
- [ ] Bundle size frontend < 500 KB
- [ ] Database connection pool configurado
- [ ] Rate limiting activo
- [ ] File upload limits apropiados

### Calidad de Código
- [ ] Strict mode habilitado en backend
- [ ] ESLint/Prettier configurado en frontend
- [ ] 100% de tests pasando
- [ ] 0 errores de TypeScript

---

## 🔗 REFERENCIAS

- [Análisis completo de configuración técnica](../tecnica/ANALISIS-COMPLETO-CONFIGURACION.md)
- [Guía de seguridad OWASP](https://owasp.org/www-project-top-ten/)
- [Documentación de NestJS Security](https://docs.nestjs.com/security)
- [Documentación de Helmet](https://helmetjs.github.io/)
- [Documentación de @nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)

---

## 📝 NOTAS

1. **Orden de implementación**: Seguir prioridad (crítico → alto → medio → bajo)
2. **Testing**: Después de cada cambio, ejecutar tests
3. **Deployment**: No deploy a producción hasta completar todos los cambios críticos
4. **Rollback**: Tener plan de rollback para cada cambio
5. **Comunicación**: Notificar al equipo de cambios que afecten el desarrollo

---

**Última actualización**: 27/12/2025
**Próxima revisión**: Después de completar cambios críticos
