#!/bin/bash
# Manual Deployment Script for AEGG
# Run this directly on the VPS when GitHub Actions fails due to network issues

set -e

echo "🚀 Manual Deployment AEGG"
echo "========================"
echo ""

# Variables
DEPLOY_DIR="/opt/aegg"
BACKUP_DIR="/opt/aegg-backups"
GITHUB_REPO="tiagofur/aegg-new-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_step() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar que estamos en el VPS
if [ ! -d "$DEPLOY_DIR" ]; then
    print_error "Directorio $DEPLOY_DIR no encontrado. ¿Estás en el VPS correcto?"
    exit 1
fi

# Crear directorio de backup
mkdir -p $BACKUP_DIR

cd $DEPLOY_DIR
print_step "Directorio de deployment: $DEPLOY_DIR"

# Paso 1: Login a GHCR
echo ""
echo "🔐 Paso 1: Login a GitHub Container Registry"
echo "============================================"
echo "Necesitas un GitHub Personal Access Token con permitos 'read:packages'"
echo "Genera uno en: https://github.com/settings/tokens"
echo ""
docker login ghcr.io -u $GITHUB_REPO --password-stdin
if [ $? -eq 0 ]; then
    print_step "Login exitoso"
else
    print_error "Login falló"
    exit 1
fi

# Paso 2: Backup de base de datos
echo ""
echo "💾 Paso 2: Backup de base de datos"
echo "=================================="
docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U aegg_user eaggdb > $BACKUP_DIR/backup_$TIMESTAMP.sql 2>/dev/null || print_warning "No se pudo hacer backup (puede ser que postgres no esté corriendo)"
if [ -f "$BACKUP_DIR/backup_$TIMESTAMP.sql" ]; then
    print_step "Backup guardado en: $BACKUP_DIR/backup_$TIMESTAMP.sql"
    ls -lh $BACKUP_DIR/backup_$TIMESTAMP.sql
fi

# Paso 3: Descargar nuevas imágenes con reintentos
echo ""
echo "📦 Paso 3: Descargar imágenes Docker"
echo "===================================="

pull_with_retry() {
    local image=$1
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "📥 Intento $attempt/$max_attempts: Descargando $image..."
        if timeout 600 docker pull $image; then
            print_step "Imagen descargada: $image"
            return 0
        else
            print_warning "Fallo al descargar $image (intento $attempt/$max_attempts)"
            if [ $attempt -lt $max_attempts ]; then
                echo "⏳ Esperando 15 segundos antes de reintentar..."
                sleep 15
            fi
        fi
        attempt=$((attempt + 1))
    done

    print_error "No se pudo descargar $image después de $max_attempts intentos"
    return 1
}

pull_with_retry ghcr.io/$GITHUB_REPO/aegg-backend:latest
pull_with_retry ghcr.io/$GITHUB_REPO/aegg-frontend:latest

# Paso 4: Detener servicios actuales
echo ""
echo "🛑 Paso 4: Detener servicios actuales"
echo "===================================="
docker-compose -f docker-compose.prod.yml stop backend frontend
print_step "Servicios detenidos"

# Paso 5: Iniciar nuevos servicios
echo ""
echo "🔄 Paso 5: Iniciar nuevos servicios"
echo "=================================="
docker-compose -f docker-compose.prod.yml up -d backend frontend
print_step "Servicios iniciados"

# Paso 6: Esperar a que los servicios estén saludables
echo ""
echo "⏳ Paso 6: Esperando que servicios estén listos"
echo "=============================================="
sleep 10

# Verificar estado de contenedores
echo ""
echo "📊 Estado de contenedores:"
echo "========================"
docker-compose -f docker-compose.prod.yml ps

# Paso 7: Verificar health checks
echo ""
echo "🏥 Paso 7: Verificar health checks"
echo "================================"

# Verificar backend
echo "Verificando backend..."
BACKEND_HEALTH=false
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec -T backend curl -f http://localhost:3101/health >/dev/null 2>&1; then
        BACKEND_HEALTH=true
        print_step "Backend health check OK"
        break
    fi
    echo "Esperando backend... ($i/30)"
    sleep 2
done

if [ "$BACKEND_HEALTH" = false ]; then
    print_error "Backend no pasó health check"
    echo "Logs del backend:"
    docker-compose -f docker-compose.prod.yml logs --tail=50 backend
fi

# Verificar frontend
echo "Verificando frontend..."
FRONTEND_HEALTH=false
for i in {1..30}; do
    if docker-compose -f docker-compose.prod.yml exec -T frontend curl -f http://localhost:3100/ >/dev/null 2>&1; then
        FRONTEND_HEALTH=true
        print_step "Frontend health check OK"
        break
    fi
    echo "Esperando frontend... ($i/30)"
    sleep 2
done

if [ "$FRONTEND_HEALTH" = false ]; then
    print_error "Frontend no pasó health check"
    echo "Logs del frontend:"
    docker-compose -f docker-compose.prod.yml logs --tail=50 frontend
fi

# Paso 8: Limpiar imágenes antiguas
echo ""
echo "🧹 Paso 8: Limpiar imágenes antiguas"
echo "=================================="
docker image prune -af --filter "until=72h" || true
print_step "Limpieza completada"

# Resumen final
echo ""
echo "========================================"
echo "🎉 Deployment Completado"
echo "========================================"
echo ""
echo "📱 URLs:"
echo "  Frontend: https://aegg.creapolis.mx"
echo "  Backend:  https://aegg-api.creapolis.mx"
echo "  Traefik:  https://traefik.aegg.creapolis.mx"
echo ""
echo "📊 Comandos útiles:"
echo "  Ver logs:          docker-compose -f docker-compose.prod.yml logs -f"
echo "  Ver estado:        docker-compose -f docker-compose.prod.yml ps"
echo "  Restart backend:   docker-compose -f docker-compose.prod.yml restart backend"
echo "  Restart frontend:  docker-compose -f docker-compose.prod.yml restart frontend"
echo ""
echo "💾 Backup guardado en: $BACKUP_DIR/backup_$TIMESTAMP.sql"
echo ""

if [ "$BACKEND_HEALTH" = true ] && [ "$FRONTEND_HEALTH" = true ]; then
    print_step "Todos los servicios están saludables"
    exit 0
else
    print_error "Algunos servicios no están saludables. Revisa los logs arriba."
    exit 1
fi
