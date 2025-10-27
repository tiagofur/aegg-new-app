#!/bin/bash
# Script de actualización SOLO FRONTEND
# Ejecutar después de subir y descomprimir frontend-only-XXXXXX.zip en /tmp/

echo "🚀 Actualizando SOLO Frontend..."

# Directorios
FRONTEND_DIR="/var/www/vhosts/creapolis.mx/aegg/httpdocs"
TEMP_DIR="/tmp"

# Verificar que existe frontend-dist
if [ ! -d "$TEMP_DIR/frontend-dist" ]; then
    echo "❌ Error: No se encuentra $TEMP_DIR/frontend-dist"
    echo "Por favor:"
    echo "1. Sube frontend-only-XXXXXX.zip a /tmp/"
    echo "2. Extrae el ZIP en /tmp/"
    echo "3. Ejecuta este script nuevamente"
    exit 1
fi

# 1. Backup del frontend actual
echo "💾 Creando backup del frontend..."
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
tar -czf "/tmp/frontend-backup-$BACKUP_DATE.tar.gz" -C "$FRONTEND_DIR" . 2>/dev/null
echo "✅ Backup creado: /tmp/frontend-backup-$BACKUP_DATE.tar.gz"

# 2. Actualizar Frontend
echo "📦 Actualizando frontend..."
rm -rf "$FRONTEND_DIR"/*
cp -r "$TEMP_DIR/frontend-dist"/* "$FRONTEND_DIR/"
echo "✅ Frontend actualizado"

# 3. Ajustar permisos
echo "🔐 Ajustando permisos..."
chown -R www-data:www-data "$FRONTEND_DIR"
chmod -R 755 "$FRONTEND_DIR"
echo "✅ Permisos ajustados"

echo ""
echo "✅ Frontend actualizado correctamente!"
echo ""
echo "🌐 Verifica el frontend: https://aegg.creapolis.mx"
echo ""
echo "💾 Backup guardado en:"
echo "   /tmp/frontend-backup-$BACKUP_DATE.tar.gz"
