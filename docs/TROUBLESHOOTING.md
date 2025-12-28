# 🛠️ Solución de Problemas

**Última actualización**: 27/12/2025

## 📋 Índice

1. [🖥️ Setup Inicial](#setup-inicial)
2. [💾 Database](#database)
3. [🔌 Backend](#backend)
4. [💻 Frontend](#frontend)
5. [🚀 Deployment](#deployment)
6. [🔐 Seguridad](#seguridad)
7. [📦 Dependencias](#dependencias)

---

## 🖥️ Setup Inicial

### El Docker no inicia

**Síntoma**:
```bash
$ docker-compose up -d
ERROR: for postgres  Cannot start service postgres
```

**Soluciones**:

```bash
# 1. Verificar si el puerto está en uso
lsof -i :5440

# Si está en uso, matar el proceso
fuser -k 5440/tcp

# 2. Verificar permisos
docker-compose ps
# Si ves "permission denied"
sudo chown -R $USER:$USER /var/run/docker.sock

# 3. Re-crear contenedores
docker-compose down -v  # -v borra volúmenes
docker-compose up -d

# 4. Verificar Docker está corriendo
docker info
```

### Error: "Cannot find module" al iniciar

**Síntoma**:
```bash
Error: Cannot find module 'typeorm'
```

**Solución**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install

# O reinstalar todo
cd ../frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 💾 Database

### Error: "Connection refused"

**Síntoma**:
```typescript
Error: connect ECONNREFUSED 127.0.0.1:5440
```

**Soluciones**:

```bash
# 1. Verificar que PostgreSQL esté corriendo
docker ps | grep postgres

# Si no está:
docker-compose up -d postgres

# 2. Verificar health check
docker exec aegg-postgres pg_isready -U postgres -d appdb

# 3. Verificar puerto
lsof -i :5440

# 4. Verificar .env
cat backend/.env
# DATABASE_HOST debe ser "localhost:5440" (si Docker)
# o "localhost" (si directo)
```

### Error: "database does not exist"

**Síntoma**:
```typescript
Error: database "appdb" does not exist
```

**Solución**:
```bash
# 1. Inicializar la BD
docker exec -it aegg-postgres psql -U postgres

# 2. Crear BD
CREATE DATABASE appdb;

# 3. Verificar
\l  # Listar BDs
\q  # Salir

# 4. O usar script de init
docker-compose down
docker-compose up -d
# El script init-scripts/01-init.sql se ejecuta automáticamente
```

### Error: "relation does not exist"

**Síntoma**:
```typescript
Error: relation "trabajos" does not exist
```

**Solución**:
```bash
cd backend

# 1. Ejecutar migraciones
npm run migration:run

# 2. Verificar migraciones ejecutadas
npm run migration:show

# 3. Si hay migraciones pendientes, forzar
npm run migration:run -- -d src/data-source.ts
```

### Las migraciones no se crean

**Síntoma**:
```bash
$ npm run migration:generate
No changes in database schema were found
```

**Solución**:
```bash
cd backend

# 1. Verificar que TypeORM esté configurado en modo synchronize
# En data-source.ts: synchronize: true solo en development

# 2. Asegúrate de que las entidades estén importadas
# En app.module.ts, todas las entidades deben estar en TypeOrmModule.forFeature()

# 3. Borrar caché de migraciones
rm -rf src/migrations/
npm run migration:generate -- -d src/data-source.ts
```

---

## 🔌 Backend

### Error: "JWT_SECRET is required"

**Síntoma**:
```typescript
Error: JWT_SECRET environment variable is required
```

**Solución**:
```bash
cd backend

# 1. Crear .env si no existe
cp .env.example .env

# 2. Generar JWT_SECRET seguro
openssl rand -base64 48

# 3. Agregar al .env
echo "JWT_SECRET=tu_jwt_secret_aqui" >> .env

# 4. Reiniciar el servidor
npm run start:dev
```

### Error: "Cannot find module '@nestjs/typeorm'"

**Síntoma**:
```typescript
Error: Cannot find module '@nestjs/typeorm'
```

**Solución**:
```bash
cd backend
npm install @nestjs/typeorm

# Si el problema persiste, reinstalar todo
rm -rf node_modules package-lock.json
npm install
```

### Error: "Repository not found" al hacer queries

**Síntoma**:
```typescript
Repository metadata for "User"#name was not found
```

**Solución**:
```typescript
// Asegúrate de que la entidad esté registrada en el módulo

// En tu entity
@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;
}

// En tu módulo
TypeOrmModule.forFeature([
    { name: 'users', entity: User }
])
```

### PM2: "Application not found"

**Síntoma**:
```bash
$ pm2 start ecosystem.config.js
[PM2][ERROR] Process file not found
```

**Solución**:
```bash
# 1. Verificar ruta en ecosystem.config.js
cat ecosystem.config.js
# cwd debe ser: "./backend"

# 2. Verificar que main.js existe
ls backend/dist/main.js

# 3. Si no existe, hacer build
cd backend
npm run build

# 4. Usar ruta absoluta en PM2
pm2 start ecosystem.config.js
# O especificar ruta absoluta:
pm2 start /var/www/vhosts/creapolis.mx/aegg-api/ecosystem.config.js
```

### Error: "Port already in use"

**Síntoma**:
```bash
Error: listen EADDRINUSE :3000
```

**Solución**:
```bash
# 1. Ver qué está usando el puerto
lsof -i :3000

# 2. Matar el proceso
kill -9 $(lsof -t -i:3000)

# 3. O cambiar puerto en .env
echo "PORT=3001" >> backend/.env
```

---

## 💻 Frontend

### Error: "Module not found: Can't resolve 'react'"

**Síntoma**:
```bash
ERROR: Can't resolve 'react'
```

**Solución**:
```bash
cd frontend

# 1. Instalar dependencias
npm install

# 2. Si no funciona, limpiar caché
rm -rf node_modules package-lock.json
npm install
```

### Error: "useLocation() may be used only in the context of a <Router>"

**Síntoma** (en tests):
```
Error: useLocation() may be used only in the context of a <Router> component.
```

**Solución**:
```typescript
// En tus tests, envolver el componente con MemoryRouter
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

render(
    <MemoryRouter>
        <YourComponent />
    </MemoryRouter>
);
```

### Error: "No QueryClient set"

**Síntoma** (en tests):
```
Error: No QueryClient set
```

**Solución**:
```typescript
// En tus tests, envolver con QueryClientProvider
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: { retry: false },
    },
});

render(
    <QueryClientProvider client={queryClient}>
        <MemoryRouter>
            <YourComponent />
        </MemoryRouter>
    </QueryClientProvider>
);
```

### Vite dev server no actualiza

**Síntoma**:
- Cambias código pero el navegador no muestra cambios

**Solución**:
```bash
# 1. Reiniciar el dev server
# Ctrl + C
npm run dev

# 2. Limpiar caché del navegador
# F12 > Network tab > Disable cache

# 3. Verificar que Vite watch funcione
# En vite.config.ts, verificar que server.watch esté habilitado
```

---

## 🚀 Deployment

### GitHub Actions: "Permission denied (publickey)"

**Síntoma**:
```
Error: Permission denied (publickey)
```

**Solución**:
```bash
# 1. Verificar que VPS_SSH_KEY está correcto en GitHub
# Debe incluir todo el contenido de la llave privada
# Incluyendo:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ...
# -----END OPENSSH PRIVATE KEY-----

# 2. Verificar que la llave privada corresponde a la pública en el servidor
# En el servidor:
cat ~/.ssh/authorized_keys

# 3. Verificar que la llave privada no tenga contraseña
# Si tiene contraseña, GitHub Actions no puede usarla
# Genera una sin passphrase:
ssh-keygen -t ed25519 -N "" -f ~/.ssh/deploy_key
```

### Error: "No such file or directory" en el servidor

**Síntoma**:
```
Error: /var/www/vhosts/creapolis.mx/aegg-api: No such file or directory
```

**Solución**:
```bash
ssh root@74.208.234.244

# Crear directorios manualmente
mkdir -p /var/www/vhosts/creapolis.mx/aegg-api/{backend,logs}
mkdir -p /var/www/vhosts/creapolis.mx/aegg/httpdocs

# Configurar permisos
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg/httpdocs
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg/httpdocs
```

### PM2: "Application error" después del deploy

**Síntoma**:
```
[PM2][ERROR] App [aegg-backend] exited with code [1] and signal [null]
```

**Solución**:
```bash
ssh root@74.208.234.244

# 1. Ver logs
pm2 logs aegg-backend --lines 50

# 2. Verificar que node_modules existe
ls /var/www/vhosts/creapolis.mx/aegg-api/backend/node_modules

# 3. Verificar que .env existe
ls /var/www/vhosts/creapolis.mx/aegg-api/backend/.env

# 4. Verificar JWT_SECRET
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env | grep JWT_SECRET
# Debe tener al menos 32 caracteres

# 5. Reiniciar manualmente
cd /var/www/vhosts/creapolis.mx/aegg-api
pm2 restart aegg-backend
```

### Error: "Database connection failed" en producción

**Síntoma**:
```
Error: Connection refused
```

**Solución**:
```bash
ssh root@74.208.234.244

# 1. Verificar configuración de DB
cat /var/www/vhosts/creapolis.mx/aegg-api/backend/.env

# DATABASE_HOST:
# Si PostgreSQL está en Docker: "localhost:5440"
# Si es directo: "localhost" o "127.0.0.1"

# 2. Verificar que PostgreSQL corra
docker ps | grep postgres

# 3. Verificar puerto
lsof -i :5440

# 4. Verificar que la BD exista
docker exec aegg-postgres psql -U postgres -d appdb -c "\l"
```

---

## 🔐 Seguridad

### Warning: "Dependencies have vulnerabilities"

**Síntoma**:
```bash
$ npm audit
found 3 high severity vulnerabilities
```

**Solución**:
```bash
# 1. Ver vulnerabilidades
npm audit

# 2. Actualizar paquetes vulnerables
npm update

# 3. Si es crítico, forzar actualización
npm audit fix

# 4. Para este proyecto, las vulnerabilidades ya están arregladas:
# - xlsx → exceljs (3 vulnerabilidades HIGH)
# - vite 5.x → vite 7.x (2 vulnerabilidades)
# - glob 10.x → glob 10.5.0
```

### Error: "JWT_SECRET too short"

**Síntoma**:
```typescript
Error: JWT_SECRET environment variable is required and must be at least 32 characters long
```

**Solución**:
```bash
# Generar JWT_SECRET con suficiente longitud
openssl rand -base64 48

# Resultado es más de 32 caracteres
# Agregar al .env
echo "JWT_SECRET=tu_jwt_secret_muy_largo_aqui" >> .env
```

---

## 📦 Dependencias

### Error: "npm install fails"

**Síntoma**:
```bash
Error: EACCES: permission denied
```

**Solución**:
```bash
# 1. Limpiar caché de npm
npm cache clean --force

# 2. Verificar permisos
# En Unix/Mac:
sudo chown -R $USER ~/.npm
sudo chown -R $USER /usr/local/lib/node_modules

# 3. Usar --legacy-peer-deps
npm install --legacy-peer-deps
```

### Error: "lockfile conflict"

**Síntoma**:
```bash
error: An unexpected conflict occurred in package-lock.json
```

**Solución**:
```bash
# Borrar package-lock.json y reinstalar
rm package-lock.json
npm install
```

---

## 🔍 Debugging General

### Habilitar logs detallados

**Backend**:
```bash
cd backend

# En .env:
LOG_LEVEL=debug

# O en data-source.ts:
logging: true
```

**Frontend**:
```bash
# Abre DevTools del navegador (F12)
# Ve a la consola
# Ver logs de axios
```

### Verificar conexiones

```bash
# Verificar backend
curl http://localhost:3000/health

# Verificar frontend
curl http://localhost:5173

# Verificar BD
docker exec aegg-postgres pg_isready -U postgres -d appdb
```

### Verificar PM2 en producción

```bash
# Estado de todos los procesos
pm2 status

# Ver logs recientes
pm2 logs aegg-backend --lines 50 --nostream

# Monitorear en tiempo real
pm2 monit

# Ver información de proceso
pm2 show aegg-backend
```

---

## 📞 Conseguir Ayuda

### Logs Importantes

**Backend**:
```
/var/www/vhosts/creapolis.mx/aegg-api/logs/
├── backend-error.log
└── backend-out.log
```

**Frontend**:
```
# Console del navegador (F12)
# PM2 logs no aplica (solo static files)
```

**Database**:
```
docker logs aegg-postgres
```

### Contacto

Si ningún problema se resuelve:

1. **Revisar este documento** primero
2. **Verificar logs** del backend/frontend
3. **Buscar en issues** de GitHub
4. **Crear un nuevo issue** con:
   - Descripción detallada del problema
   - Pasos para reproducir
   - Logs del backend/frontend
   - Mensaje de error completo

---

**Última actualización**: 27/12/2025
**Versión**: 2.0.0
**Estado**: ✅ Completado
