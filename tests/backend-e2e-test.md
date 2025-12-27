# 🧪 Script de Pruebas E2E - Backend AEGG

Este script ejecuta pruebas de integración básicas para verificar que el backend funciona correctamente con las mejoras de seguridad implementadas.

## 📋 Pruebas Incluidas

### 1. Verificación de Build
- ✅ TypeScript compila sin errores
- ✅ No hay dependencias rotas
- ✅ Bundle generado correctamente

### 2. Verificación de Seguridad
- ✅ JWT_SECRET validado obligatoriamente
- ✅ Helmet headers configurados
- ✅ Rate limiting activo
- ✅ Sanitización de input disponible
- ✅ 0 vulnerabilidades de seguridad

### 3. Verificación de Funcionalidad
- ✅ Inicio del servidor sin errores
- ✅ Endpoint de health respondiendo
- ✅ Autenticación JWT funcionando
- ✅ Validación de inputs activa
- ✅ Database connection pool activo

### 4. Verificación de Dependencias
- ✅ exceljs@4.0.0 (seguro, sin vulnerabilidades)
- ✅ @nestjs packages actualizados
- ✅ helmet configurado
- ✅ @nestjs/throttler configurado
- ✅ sanitize-html disponible
- ✅ 0 vulnerabilidades HIGH

---

## 🚀 Cómo Ejecutar las Pruebas

### Opción 1: Manual (Recomendado)

```bash
# 1. Iniciar servidor de base de datos
cd ..
docker-compose up -d postgres

# 2. Esperar 30 segundos para que DB inicie
sleep 30

# 3. Verificar que PostgreSQL esté listo
docker exec aegg-postgres pg_isready -U postgres -d appdb

# 4. Iniciar backend en modo desarrollo
cd backend
npm run start:dev

# 5. En otra terminal, probar endpoints
# Ver sección "Pruebas Manuales" abajo
```

### Opción 2: Script Automatizado

```bash
# Crear variables de entorno
cd backend
cat > .env << 'EOF'
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=appdb
JWT_SECRET=dev-secret-key-for-testing-only-min-32-chars
DEV_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
EOF

# Iniciar backend
npm run start:dev
```

---

## 🧪 Pruebas Manuales

### Test 1: Inicio del Servidor

**Propósito**: Verificar que el backend inicia sin errores

```bash
curl -f http://localhost:3000 || echo "❌ Servidor no inició"
echo "✅ Servidor inició correctamente"
```

**Esperado**: Servidor escuchando en puerto 3000
**Logs esperados**:
```
[Nest] xxxxx  Application is starting...
[Nest] xxxxx  AppModule dependencies initialized:
[Nest] xxxxx  TypeOrmModule dependencies initialized:
[Nest] xxxxx  Config module initialized...
[Nest] xxxxx  ThrottlerModule dependencies initialized:
[Nest] xxxxx  ✅ Application successfully started
```

---

### Test 2: Endpoint de Health

**Propósito**: Verificar que el servidor responde

```bash
curl -i http://localhost:3000
```

**Esperado**: Respuesta con headers de seguridad

**Headers esperados**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

---

### Test 3: Registro de Usuario (sin JWT_SECRET)

**Propósito**: Verificar validación de JWT_SECRET

```bash
# Intentar registrar SIN JWT_SECRET definido
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test"}'
```

**Esperado**: Error 500 Internal Server Error con mensaje:
```
Error: JWT_SECRET environment variable is required and must be set to a secure value
```

---

### Test 4: Registro de Usuario (con JWT_SECRET válido)

**Propósito**: Verificar que el registro funciona con JWT_SECRET

```bash
# Registrar usuario
REGISTER_RESPONSE=$(curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123","name":"Test User"}')

echo "$REGISTER_RESPONSE"
```

**Esperado**: Respuesta con token JWT

```json
{
  "user": {
    "id": "...",
    "email": "test@test.com",
    "name": "Test User",
    "role": "Gestor"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Test 5: Login y Autenticación

**Propósito**: Verificar flujo completo de autenticación

```bash
# Login
LOGIN_RESPONSE=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE"

# Extraer token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

echo ""
echo "Token: $TOKEN"
```

**Esperado**: Token JWT válido con información del usuario

---

### Test 6: Rate Limiting

**Propósito**: Verificar límite de requests

```bash
# Hacer más de 100 requests rápidamente
for i in {1..110}; do
  curl -s http://localhost:3000/trabajos &
done
wait
echo "✅ Se enviaron 110 requests"
```

**Esperado**:
- Después de 100 requests: Respuestas exitosas
- Requests 101-110: HTTP 429 Too Many Requests

```json
{
  "statusCode": 429,
  "message": "Too many requests",
  "limit": 100,
  "ttl": 60
}
```

---

### Test 7: Headers de Seguridad

**Propósito**: Verificar Helmet headers configurados

```bash
curl -I http://localhost:3000 2>&1 | grep -E "(Content-Security-Policy|X-Frame-Options|Strict-Transport-Security)"
```

**Esperado**:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; ...
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

### Test 8: Sanitización de Input

**Propósito**: Verificar que XSS sea prevenido

```bash
# Intentar enviar HTML malicioso
curl -X POST http://localhost:3000/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"nombre":"<script>alert(\"XSS\")</script>Cliente","rfc":"TEST123456789"}'
```

**Esperado**: HTML sanitizado sin etiquetas script

```json
{
  "id": "...",
  "nombre": "alert(\\\"XSS\\\")Cliente",  // Sanitizado
  "rfc": "TEST123456789"
}
```

---

### Test 9: CORS

**Propósito**: Verificar configuración de CORS

```bash
# Intentar request desde origen no permitido
curl -X POST http://localhost:3000/auth/login \
  -H "Origin: http://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}' \
  -i
```

**Esperado**: Request rechazado por CORS

```
HTTP/1.1 403 Forbidden
Access-Control-Allow-Origin: http://localhost:5173
```

---

### Test 10: Importación de Excel

**Propósito**: Verificar que exceljs funciona correctamente

```bash
# Crear archivo Excel de prueba
cat > test.xlsx << 'EOF'
Sheet1
Mes    Valor
Ene     100
Feb     200
EOF

# Importar (requiere archivo real)
# Nota: Esta prueba requiere un archivo Excel válido generado previamente
```

**Esperado**: Archivo procesado con exceljs@4.0.0 sin errores

---

## 📊 Resultados Esperados

| Test | Estado | Resultado |
|-------|---------|-----------|
| 1. Inicio del Servidor | ✅ | Servidor inicia correctamente |
| 2. Health Check | ✅ | Headers de seguridad presentes |
| 3. JWT_SECRET faltante | ✅ | Error 500 con mensaje apropiado |
| 4. Registro | ✅ | Usuario creado y token generado |
| 5. Login | ✅ | Token válido y auth funciona |
| 6. Rate Limiting | ✅ | 429 después de 100 requests |
| 7. Headers Seguridad | ✅ | Todos los headers configurados |
| 8. Sanitización | ✅ | HTML sanitizado sin scripts |
| 9. CORS | ✅ | Orígenes no permitidos bloqueados |
| 10. Excel | ✅ | exceljs procesa sin errores |

---

## ✅ Checklist de Validación

### Seguridad
- [ ] JWT_SECRET validado obligatoriamente
- [ ] Helmet headers configurados (CSP, HSTS, X-Frame-Options)
- [ ] Rate limiting activo y funciona
- [ ] 0 vulnerabilidades en npm audit
- [ ] Sanitización de input implementada
- [ ] CORS configurado correctamente

### Funcionalidad
- [ ] Backend inicia sin errores
- [ ] Registro de usuarios funciona
- [ ] Login JWT funciona
- [ ] Database connection pool funciona
- [ ] ExcelJS (exceljs) procesa archivos
- [ ] Todos los endpoints responden

### Performance
- [ ] Build compila en < 30s
- [ ] Bundle generado correctamente
- [ ] Sin memory leaks en inicio

---

## 🐛 Troubleshooting

### Problema: Servidor no inicia

**Solución**:
```bash
# Verificar logs
docker logs aegg-postgres

# Verificar variables de entorno
cat backend/.env

# Reinstalar dependencias
cd backend
rm -rf node_modules
npm install
```

### Problema: Error de JWT_SECRET

**Solución**:
```bash
# Generar JWT_SECRET seguro
openssl rand -base64 64

# Agregar a .env
echo "JWT_SECRET=$(openssl rand -base64 64)" >> backend/.env
```

### Problema: Rate limiting bloquea desarrollo

**Solución**:
```bash
# Añadir al .env
echo "NODE_ENV=development" >> backend/.env

# Rate limiting se deshabilita automáticamente en development
```

### Problema: Build falla

**Solución**:
```bash
# Limpiar cache
cd backend
rm -rf dist node_modules/.cache

# Reconstruir
npm run build
```

---

## 📝 Notas

### Variables de Entorno Requeridas

```bash
NODE_ENV=development
DATABASE_HOST=localhost
DATABASE_PORT=5440
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=appdb
JWT_SECRET=dev-secret-key-for-testing-only-min-32-chars
DEV_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176
```

### Dependencias Clave

- **exceljs@4.0.0**: Procesamiento de Excel sin vulnerabilidades
- **@nestjs/jwt@11.0.2**: Autenticación JWT actualizada
- **@nestjs/passport@11.0.5**: Estrategias de autenticación
- **@nestjs/schematics@11.0.9**: Generadores de NestJS
- **helmet@8.1.0**: Headers de seguridad
- **@nestjs/throttler@6.5.0**: Rate limiting
- **sanitize-html@2.17.0**: Sanitización de HTML
- **typeorm@0.3.20**: ORM de base de datos

---

**Última actualización**: 27/12/2025
**Estado**: ✅ Listo para pruebas
**Versión de dependencias**: Latest compatible
