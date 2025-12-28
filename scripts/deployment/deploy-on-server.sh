#!/bin/bash
# Script para ejecutar en el servidor VPS después de subir los archivos

set -e

echo "🚀 Iniciando deployment en servidor..."

# Variables
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api"
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"
TEMP_DIR="/tmp/deployment-package"

# 1. Verificar que el paquete existe
if [ ! -d "$TEMP_DIR" ]; then
    echo "❌ Error: No se encuentra el directorio $TEMP_DIR"
    echo "Por favor, sube primero el paquete de deployment"
    exit 1
fi

# 2. Crear directorios si no existen
echo "📁 Creando directorios..."
mkdir -p $BACKEND_DIR/backend
mkdir -p $FRONTEND_DIR
mkdir -p $BACKEND_DIR/logs

# 3. Desplegar Backend
echo "📦 Desplegando backend..."
cp -r $TEMP_DIR/backend-dist $BACKEND_DIR/backend/dist
cp -r $TEMP_DIR/backend-node_modules $BACKEND_DIR/backend/node_modules
cp $TEMP_DIR/package.json $BACKEND_DIR/backend/
cp $TEMP_DIR/.env $BACKEND_DIR/backend/

# 4. Desplegar Frontend
echo "📦 Desplegando frontend..."
rm -rf $FRONTEND_DIR/*
cp -r $TEMP_DIR/frontend-dist/* $FRONTEND_DIR/

# 5. Desplegar configuración PM2
echo "📦 Configurando PM2..."
cp $TEMP_DIR/ecosystem.config.js $BACKEND_DIR/

# 6. Configurar permisos
echo "🔒 Configurando permisos..."
chown -R www-data:www-data $BACKEND_DIR
chown -R www-data:www-data $FRONTEND_DIR
chmod -R 755 $BACKEND_DIR
chmod -R 755 $FRONTEND_DIR

# 7. Iniciar/Reiniciar PM2
echo "🔄 Reiniciando aplicación..."
cd $BACKEND_DIR

# Verificar si ya existe la app en PM2
if pm2 list | grep -q "aegg-backend"; then
    echo "Reiniciando aplicación existente..."
    pm2 reload ecosystem.config.js
else
    echo "Iniciando aplicación por primera vez..."
    pm2 start ecosystem.config.js
    pm2 save
fi

# 8. Verificar estado
echo "✅ Verificando estado..."
pm2 status
pm2 logs aegg-backend --lines 20

echo ""
echo "🎉 Deployment completado!"
echo "Backend: https://aegg-api.creapolis.mx"
echo "Frontend: https://aegg.creapolis.mx"
echo ""
echo "📊 Monitoreo:"
echo "  pm2 status"
echo "  pm2 logs aegg-backend"
echo "  pm2 monit"
