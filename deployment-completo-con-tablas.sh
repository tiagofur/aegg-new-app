#!/bin/bash
# ============================================================================
# SCRIPT DE DEPLOYMENT COMPLETO CON TODAS LAS TABLAS
# ============================================================================
# Ejecuta todo el proceso: subir backend + crear todas las tablas + configurar

echo "🚀 DEPLOYMENT COMPLETO DEL SISTEMA AEGG"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Variables
BACKEND_DIR="/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend"
ZIP_FILE="backend-deploy-20251027-091049.zip"
SQL_FILE="crear-todas-tablas.sql"

# 1. Verificar que los archivos existen
echo "📋 Verificando archivos necesarios..."
if [ ! -f "$ZIP_FILE" ]; then
    echo "❌ Error: No se encuentra $ZIP_FILE"
    exit 1
fi

if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: No se encuentra $SQL_FILE" 
    exit 1
fi

echo "✅ Archivos verificados"

# 2. Detener backend actual
echo ""
echo "⏸️ Deteniendo backend actual..."
pm2 stop aegg-backend 2>/dev/null || echo "Backend ya estaba detenido"
pm2 delete aegg-backend 2>/dev/null || echo "Configuración PM2 eliminada"

# 3. Backup del backend actual si existe
if [ -d "$BACKEND_DIR" ]; then
    echo "💾 Creando backup del backend actual..."
    sudo mv "$BACKEND_DIR" "${BACKEND_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 4. Crear directorio backend
echo "📁 Creando directorio backend..."
sudo mkdir -p "$BACKEND_DIR"

# 5. Extraer archivos
echo "📦 Extrayendo archivos del backend..."
sudo unzip -q "$ZIP_FILE" -d "$BACKEND_DIR/"

# 6. Crear archivo .env
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

# 7. Instalar dependencias
echo "📥 Instalando dependencias de Node.js..."
cd "$BACKEND_DIR"
sudo npm install --production

if [ $? -ne 0 ]; then
    echo "❌ Error instalando dependencias"
    exit 1
fi

# 8. CREAR TODAS LAS TABLAS DE LA BASE DE DATOS
echo ""
echo "🗃️ Creando TODAS las tablas de la base de datos..."
echo "════════════════════════════════════════════════════════════════"

# Ir al directorio donde está el SQL
cd /tmp

# Ejecutar el script SQL completo
PGPASSWORD='PMXUGyatADHSevnFOoKkCQuh' psql -h localhost -U aegg_user -d aegg_db -f "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Todas las tablas creadas exitosamente"
else
    echo "❌ Error creando las tablas"
    echo "Revisa los logs de PostgreSQL:"
    echo "sudo tail -f /var/log/postgresql/postgresql-*-main.log"
    exit 1
fi

# 9. Ajustar permisos
echo ""
echo "🔐 Ajustando permisos..."
cd /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/
sudo chown -R www-data:www-data backend
sudo chmod -R 755 backend

# 10. Configurar PM2
echo "🔧 Configurando PM2..."
cd "$BACKEND_DIR"
sudo -u www-data pm2 start dist/main.js --name "aegg-backend" --env production

# 11. Guardar configuración PM2
sudo -u www-data pm2 save

# 12. Esperar que el backend se inicie
echo "⏳ Esperando que el backend se inicie..."
sleep 5

echo ""
echo "✅ DEPLOYMENT COMPLETADO!"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Estado del backend:"
sudo -u www-data pm2 status

echo ""
echo "📋 Últimos logs:"
sudo -u www-data pm2 logs aegg-backend --lines 15 --nostream

echo ""
echo "🗃️ Tablas creadas en la base de datos:"
PGPASSWORD='PMXUGyatADHSevnFOoKkCQuh' psql -h localhost -U aegg_user -d aegg_db -c "\dt"

echo ""
echo "🌐 URLs para verificar:"
echo "   Backend: https://aegg-api.creapolis.mx"
echo "   Frontend: https://aegg.creapolis.mx"
echo ""
echo "👤 Usuario administrador creado:"
echo "   Email: admin@aegg.mx"
echo "   Password: admin123 (¡CAMBIAR INMEDIATAMENTE!)"
echo ""
echo "📝 Comandos útiles:"
echo "   Ver logs: pm2 logs aegg-backend"
echo "   Reiniciar: pm2 restart aegg-backend"
echo "   Estado: pm2 status"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎉 SISTEMA AEGG LISTO PARA USAR"
echo "════════════════════════════════════════════════════════════════"