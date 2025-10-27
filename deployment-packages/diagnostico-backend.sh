#!/bin/bash
# Script de diagnóstico para el backend
# Ejecutar directamente en el servidor

echo "🔍 DIAGNÓSTICO DEL BACKEND"
echo "=========================="
echo ""

# 1. Estado de PM2
echo "📊 Estado de PM2:"
pm2 status
echo ""

# 2. Logs recientes (últimas 30 líneas)
echo "📋 Logs del Backend (últimas 30 líneas):"
pm2 logs aegg-backend --lines 30 --nostream
echo ""

# 3. Verificar puerto 3000
echo "🔌 Puerto 3000:"
netstat -tlnp | grep :3000 || echo "⚠️ Puerto 3000 no está escuchando"
echo ""

# 4. Verificar archivo .env
echo "📄 Archivo .env del backend:"
if [ -f "/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env" ]; then
    echo "✅ Existe .env"
    echo "Contenido (sin secretos):"
    grep -E "^(NODE_ENV|PORT|DB_HOST|DB_NAME|DB_USERNAME|CORS_ORIGIN)" /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env
else
    echo "❌ NO existe .env"
fi
echo ""

# 5. Verificar que existen los archivos compilados
echo "📦 Archivos compilados del backend:"
if [ -d "/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist" ]; then
    echo "✅ Directorio dist existe"
    ls -lh /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist/ | head -5
else
    echo "❌ NO existe directorio dist"
fi
echo ""

# 6. Verificar main.js
echo "🔍 Archivo main.js:"
if [ -f "/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist/main.js" ]; then
    echo "✅ main.js existe"
else
    echo "❌ NO existe main.js"
fi
echo ""

# 7. Test de conexión local
echo "🌐 Test de conexión local:"
curl -s http://localhost:3000 | head -c 100 || echo "⚠️ No responde en localhost:3000"
echo ""
echo ""

# 8. Verificar PostgreSQL
echo "🗄️ PostgreSQL:"
systemctl status postgresql --no-pager | grep "Active:"
echo ""

# 9. Ver errores recientes (solo errores)
echo "❌ Errores recientes (si hay):"
pm2 logs aegg-backend --err --lines 20 --nostream
echo ""

echo "=========================="
echo "✅ Diagnóstico completado"
echo ""
echo "Si ves errores, copia TODO el output y compártelo para ayudarte mejor."
