#!/bin/bash
# Diagnóstico completo - Copiar y pegar en el servidor

echo "========================================"
echo "🔍 DIAGNÓSTICO COMPLETO DEL BACKEND"
echo "========================================"
echo ""

echo "1️⃣ Estado de PM2:"
echo "===================="
pm2 status
echo ""

echo "2️⃣ Verificar archivo .env:"
echo "===================="
if [ -f "/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env" ]; then
    echo "✅ .env existe"
    echo "Contenido:"
    cat /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env
else
    echo "❌ .env NO existe"
fi
echo ""

echo "3️⃣ Verificar main.js:"
echo "===================="
if [ -f "/var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist/main.js" ]; then
    echo "✅ main.js existe"
    echo "Primeras líneas:"
    head -20 /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist/main.js
else
    echo "❌ main.js NO existe"
fi
echo ""

echo "4️⃣ Puerto 3000:"
echo "===================="
netstat -tlnp | grep :3000
if [ $? -ne 0 ]; then
    echo "⚠️ Puerto 3000 NO está escuchando"
fi
echo ""

echo "5️⃣ Test conexión local:"
echo "===================="
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3000
echo ""

echo "6️⃣ PostgreSQL:"
echo "===================="
systemctl status postgresql --no-pager | grep "Active"
echo ""
echo "Test conexión a BD:"
psql -U aegg_user -d aegg_db -h localhost -c "SELECT 1;" 2>&1 | head -5
echo ""

echo "7️⃣ LOGS DE ERRORES (últimas 50 líneas):"
echo "===================="
pm2 logs aegg-backend --err --lines 50 --nostream
echo ""

echo "8️⃣ LOGS NORMALES (últimas 50 líneas):"
echo "===================="
pm2 logs aegg-backend --lines 50 --nostream
echo ""

echo "9️⃣ Información de PM2:"
echo "===================="
pm2 info aegg-backend
echo ""

echo "🔟 Archivos en el directorio dist:"
echo "===================="
ls -lah /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist/ | head -20
echo ""

echo "========================================"
echo "✅ DIAGNÓSTICO COMPLETADO"
echo "========================================"
