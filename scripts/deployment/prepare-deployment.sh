#!/bin/bash
# Script para preparar el deployment local antes de subir al servidor

echo "🚀 Preparando deployment..."

# 1. Backend Build
echo "📦 Building backend..."
cd backend
npm install --production
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en backend build"
    exit 1
fi

echo "✅ Backend build exitoso"

# 2. Frontend Build
echo "📦 Building frontend..."
cd ../frontend
npm install
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en frontend build"
    exit 1
fi

echo "✅ Frontend build exitoso"

# 3. Crear paquete de deployment
echo "📦 Creando paquete de deployment..."
cd ..
mkdir -p deployment-package

# Copiar backend
cp -r backend/dist deployment-package/backend-dist
cp -r backend/node_modules deployment-package/backend-node_modules
cp backend/package.json deployment-package/
cp .env.production deployment-package/.env

# Copiar frontend
cp -r frontend/dist deployment-package/frontend-dist

# Copiar configuraciones
cp ecosystem.config.js deployment-package/

echo "✅ Paquete creado en ./deployment-package"
echo ""
echo "📋 Próximos pasos:"
echo "1. Editar deployment-package/.env con credenciales reales"
echo "2. Subir deployment-package al servidor usando:"
echo "   scp -r deployment-package root@74.208.234.244:/tmp/"
echo "3. Conectar por SSH y mover archivos a sus ubicaciones finales"
