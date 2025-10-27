#!/bin/bash
# Script de actualización completa - Backend + Frontend
# Ejecutar después de subir y descomprimir el ZIP en /tmp/

echo "🚀 Iniciando actualización completa..."

# Directorios
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend"
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"
TEMP_DIR="/tmp/deployment-package"

# Verificar que existe el paquete
if [ ! -d "$TEMP_DIR" ]; then
    echo "❌ Error: No se encuentra $TEMP_DIR"
    echo "Por favor, sube el ZIP y descomprímelo en /tmp/"
    exit 1
fi

# 1. Backup del backend actual
echo "💾 Creando backup del backend..."
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
cp -r "$BACKEND_DIR/dist" "$BACKEND_DIR/dist.backup.$BACKUP_DATE"
echo "✅ Backup creado: $BACKEND_DIR/dist.backup.$BACKUP_DATE"

# 2. Backup del frontend actual
echo "💾 Creando backup del frontend..."
tar -czf "/tmp/frontend-backup-$BACKUP_DATE.tar.gz" -C "$FRONTEND_DIR" . 2>/dev/null
echo "✅ Backup creado: /tmp/frontend-backup-$BACKUP_DATE.tar.gz"

# 3. Actualizar Backend
echo "📦 Actualizando backend..."
rm -rf "$BACKEND_DIR/dist"
cp -r "$TEMP_DIR/backend-dist" "$BACKEND_DIR/dist"
echo "✅ Backend actualizado"

# 4. Actualizar Frontend
echo "📦 Actualizando frontend..."
rm -rf "$FRONTEND_DIR"/*
cp -r "$TEMP_DIR/frontend-dist"/* "$FRONTEND_DIR/"
echo "✅ Frontend actualizado"

# 5. Ajustar permisos
echo "🔐 Ajustando permisos..."
chown -R www-data:www-data "$BACKEND_DIR"
chown -R www-data:www-data "$FRONTEND_DIR"
chmod -R 755 "$BACKEND_DIR"
chmod -R 755 "$FRONTEND_DIR"
echo "✅ Permisos ajustados"

# 6. Reiniciar Backend
echo "🔄 Reiniciando backend..."
pm2 restart aegg-backend

# Esperar 2 segundos
sleep 2

# 7. Verificar estado
echo ""
echo "📊 Estado del backend:"
pm2 status | grep aegg-backend

echo ""
echo "📋 Últimos logs:"
pm2 logs aegg-backend --lines 10 --nostream

echo ""
echo "✅ Actualización completada!"
echo ""
echo "🌐 Verifica:"
echo "   Frontend: https://aegg.creapolis.mx"
echo "   Backend:  https://aegg-api.creapolis.mx"
echo ""
echo "💾 Backups guardados en:"
echo "   Backend:  $BACKEND_DIR/dist.backup.$BACKUP_DATE"
echo "   Frontend: /tmp/frontend-backup-$BACKUP_DATE.tar.gz"
