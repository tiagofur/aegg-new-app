#!/bin/bash
# Script de actualización SOLO BACKEND
# Ejecutar después de subir y descomprimir backend-only-XXXXXX.zip en /tmp/

echo "🚀 Actualizando SOLO Backend..."

# Directorios
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend"
TEMP_DIR="/tmp"

# Verificar que existe backend-dist
if [ ! -d "$TEMP_DIR/backend-dist" ]; then
    echo "❌ Error: No se encuentra $TEMP_DIR/backend-dist"
    echo "Por favor:"
    echo "1. Sube backend-only-XXXXXX.zip a /tmp/"
    echo "2. Extrae el ZIP en /tmp/"
    echo "3. Ejecuta este script nuevamente"
    exit 1
fi

# 1. Backup del backend actual
echo "💾 Creando backup del backend..."
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
cp -r "$BACKEND_DIR/dist" "$BACKEND_DIR/dist.backup.$BACKUP_DATE"
echo "✅ Backup creado: $BACKEND_DIR/dist.backup.$BACKUP_DATE"

# 2. Actualizar Backend
echo "📦 Actualizando backend..."
rm -rf "$BACKEND_DIR/dist"
cp -r "$TEMP_DIR/backend-dist" "$BACKEND_DIR/dist"
echo "✅ Backend actualizado"

# 3. Ajustar permisos
echo "🔐 Ajustando permisos..."
chown -R www-data:www-data "$BACKEND_DIR"
chmod -R 755 "$BACKEND_DIR"
echo "✅ Permisos ajustados"

# 4. Reiniciar Backend
echo "🔄 Reiniciando backend..."
pm2 restart aegg-backend

# Esperar 2 segundos
sleep 2

# 5. Verificar estado
echo ""
echo "📊 Estado del backend:"
pm2 status | grep aegg-backend

echo ""
echo "📋 Últimos logs:"
pm2 logs aegg-backend --lines 10 --nostream

echo ""
echo "✅ Backend actualizado correctamente!"
echo ""
echo "🌐 Verifica el backend: https://aegg-api.creapolis.mx"
echo ""
echo "💾 Backup guardado en:"
echo "   $BACKEND_DIR/dist.backup.$BACKUP_DATE"
