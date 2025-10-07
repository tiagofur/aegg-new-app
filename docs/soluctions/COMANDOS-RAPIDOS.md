# 🚀 Comandos Rápidos - Guía de Referencia

## 📋 Comandos Docker Compose

### Iniciar la aplicación

```bash
docker-compose up -d
```

### Detener la aplicación

```bash
docker-compose down
```

### Ver logs en tiempo real

```bash
docker-compose logs -f
```

### Ver logs de un servicio específico

```bash
# Backend
docker-compose logs -f backend

# Frontend
docker-compose logs -f frontend

# Base de datos
docker-compose logs -f postgres
```

### Ver estado de los servicios

```bash
docker-compose ps
```

### Reiniciar un servicio

```bash
# Todos
docker-compose restart

# Solo backend
docker-compose restart backend

# Solo frontend
docker-compose restart frontend
```

### Reconstruir imágenes

```bash
docker-compose up --build -d
```

### Detener y eliminar volúmenes (reinicio completo)

```bash
docker-compose down -v
docker-compose up -d
```

## 🔍 Comandos de Diagnóstico

### Ver contenedores corriendo

```bash
docker ps
```

### Ver todas las imágenes

```bash
docker images
```

### Ver volúmenes

```bash
docker volume ls
```

### Acceder a un contenedor

```bash
# Backend
docker exec -it nestjs_backend sh

# Frontend
docker exec -it react_frontend sh

# PostgreSQL
docker exec -it postgres_db psql -U postgres -d appdb
```

### Ver uso de recursos

```bash
docker stats
```

## 📦 Comandos NPM (Desarrollo Local)

### Backend

```bash
cd backend
npm install
npm run start:dev        # Desarrollo
npm run build           # Compilar
npm run start:prod      # Producción
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # Desarrollo
npm run build           # Compilar
npm run preview         # Preview build
```

## 🗄️ Comandos PostgreSQL

### Conectarse a la base de datos

```bash
docker exec -it postgres_db psql -U postgres -d appdb
```

### Dentro de PostgreSQL:

```sql
-- Ver tablas
\dt

-- Ver estructura de tabla users
\d users

-- Ver todos los usuarios
SELECT * FROM users;

-- Contar usuarios
SELECT COUNT(*) FROM users;

-- Salir
\q
```

## 🧹 Limpieza

### Limpiar contenedores detenidos

```bash
docker container prune
```

### Limpiar imágenes no usadas

```bash
docker image prune
```

### Limpiar volúmenes no usados

```bash
docker volume prune
```

### Limpiar todo

```bash
docker system prune -a --volumes
```

**⚠️ Cuidado: Esto elimina TODO**

## 🔄 Comandos de Actualización

### Actualizar dependencias del backend

```bash
cd backend
npm update
```

### Actualizar dependencias del frontend

```bash
cd frontend
npm update
```

### Verificar dependencias desactualizadas

```bash
npm outdated
```

## 📝 Comandos Git

### Inicializar repositorio

```bash
git init
git add .
git commit -m "Initial commit - Full Stack App"
```

### Crear .gitignore (ya existe)

```bash
# Ya está configurado, incluye:
# - node_modules/
# - .env
# - dist/
```

## 🐛 Troubleshooting

### Puerto ocupado

```bash
# Ver qué usa el puerto 3001
netstat -ano | findstr :3001

# Ver qué usa el puerto 5173
netstat -ano | findstr :5173

# Matar proceso (usar PID del comando anterior)
taskkill /PID <numero> /F
```

### Docker no responde

```bash
# Reiniciar Docker Desktop
# o en PowerShell como admin:
Restart-Service docker
```

### Limpiar caché de Docker Build

```bash
docker builder prune
```

## 📊 URLs de la Aplicación

```
Frontend:    http://localhost:5173
Backend:     http://localhost:3001
PostgreSQL:  localhost:5432
```

## 🔐 Credenciales por Defecto

### PostgreSQL

```
Host:     localhost
Port:     5432
User:     postgres
Password: postgres
Database: appdb
```

### JWT Secret

```
Secret: your-super-secret-jwt-key-change-in-production
⚠️ CAMBIAR EN PRODUCCIÓN
```

## 📱 Comandos PowerShell Personalizados

### Iniciar app

```powershell
./start.ps1
```

### Detener app

```powershell
./stop.ps1
```

## 🎨 Comandos de Desarrollo

### Ver cambios en tiempo real

Los volúmenes de Docker ya están configurados para hot reload automático.

### Forzar rebuild del frontend

```bash
docker-compose restart frontend
```

### Forzar rebuild del backend

```bash
docker-compose restart backend
```

## 📦 Backup de Base de Datos

### Crear backup

```bash
docker exec postgres_db pg_dump -U postgres appdb > backup.sql
```

### Restaurar backup

```bash
docker exec -i postgres_db psql -U postgres appdb < backup.sql
```

## 🔍 Ver Variables de Entorno

### Ver env del backend

```bash
docker exec nestjs_backend env
```

### Ver env del frontend

```bash
docker exec react_frontend env
```

## 📈 Monitoreo

### Ver uso de CPU/RAM en tiempo real

```bash
docker stats
```

### Ver logs de errores

```bash
docker-compose logs --tail=100 | grep -i error
```

## 🚀 Deploy a Producción (Checklist)

- [ ] Cambiar JWT_SECRET
- [ ] Cambiar credenciales de PostgreSQL
- [ ] Configurar CORS con dominio real
- [ ] Cambiar synchronize a false en TypeORM
- [ ] Usar variables de entorno seguras
- [ ] Configurar HTTPS
- [ ] Configurar rate limiting
- [ ] Habilitar logging
- [ ] Configurar backups automáticos

## 💡 Tips

1. Usa `docker-compose logs -f` para debugging
2. `docker-compose restart` es tu amigo
3. Los volúmenes persisten datos entre reinicios
4. Hot reload ya está configurado
5. Usa `docker-compose down -v` para reinicio limpio

---

**Guarda esta referencia para consulta rápida! 📌**
