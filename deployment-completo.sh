#!/bin/bash
# Script completo de deployment después del reset de PostgreSQL
# Ejecutar DESPUÉS de reset-postgresql-completo.sh

echo "🚀 DEPLOYMENT COMPLETO DEL BACKEND"
echo "════════════════════════════════════════════"
echo ""

# Variables
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend"
ZIP_FILE="backend-deploy-20251027-091049.zip"

# 1. Verificar que el ZIP existe
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: No se encuentra $ZIP_FILE"
    echo "   Sube el archivo al directorio actual"
    exit 1
fi

# 2. Crear backup del backend actual si existe
if [ -d "$BACKEND_DIR" ]; then
    echo "💾 Creando backup del backend actual..."
    sudo mv "$BACKEND_DIR" "${BACKEND_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 3. Crear directorio backend
echo "📁 Creando directorio backend..."
sudo mkdir -p "$BACKEND_DIR"

# 4. Extraer archivos
echo "📦 Extrayendo archivos del backend..."
sudo unzip -q "$ZIP_FILE" -d "$BACKEND_DIR/"

# 5. Crear archivo .env
echo "📝 Creando archivo .env..."
sudo tee "$BACKEND_DIR/.env" > /dev/null <<EOF
NODE_ENV=production
PORT=3000

DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=aegg_user
DATABASE_PASSWORD=PMXUGyatADHSevnFOoKkCQuh
DATABASE_NAME=aegg_db

JWT_SECRET=GMB2qR65YZusTdkAbrc4hPyH0jvNelFa
JWT_EXPIRATION=7d

CORS_ORIGIN=https://aegg.creapolis.mx
EOF

# 6. Instalar dependencias
echo "📥 Instalando dependencias de Node.js..."
cd "$BACKEND_DIR"
sudo npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

# 7. Ejecutar migraciones (si existen)
echo "🗃️ Ejecutando migraciones de base de datos..."
sudo npm run typeorm:migration:run 2>/dev/null || echo "ℹ️ No se encontraron migraciones o falló (continuando...)"

# 8. Ajustar permisos
echo "🔐 Ajustando permisos..."
cd /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/
sudo chown -R www-data:www-data backend
sudo chmod -R 755 backend

# 9. Configurar PM2
echo "🔧 Configurando PM2..."
cd "$BACKEND_DIR"
sudo -u www-data pm2 start dist/main.js --name "aegg-backend" --env production

# 10. Guardar configuración PM2
sudo -u www-data pm2 save

# 11. Configurar PM2 para iniciar automáticamente
sudo -u www-data pm2 startup
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www-data --hp /var/www

echo ""
echo "✅ Deployment completado!"
echo ""
echo "📊 Estado del backend:"
sudo -u www-data pm2 status

echo ""
echo "📋 Últimos logs:"
sudo -u www-data pm2 logs aegg-backend --lines 10 --nostream

echo ""
echo "🌐 URLs para verificar:"
echo "   Backend: https://aegg-api.creapolis.mx"
echo "   Health: https://aegg-api.creapolis.mx/health (si existe)"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: pm2 logs aegg-backend"
echo "   Reiniciar: pm2 restart aegg-backend"
echo "   Estado: pm2 status"
echo ""
echo "════════════════════════════════════════════"