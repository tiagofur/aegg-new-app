#!/bin/bash
# Script para RESETEAR COMPLETAMENTE PostgreSQL y recrear todo desde cero
# ADVERTENCIA: Esto eliminará TODOS los datos existentes

echo "🚨 RESET COMPLETO DE POSTGRESQL - ELIMINARÁ TODOS LOS DATOS"
echo "════════════════════════════════════════════════════════════"
echo ""
read -p "¿Estás seguro? Escribe 'SI' para continuar: " confirm

if [ "$confirm" != "SI" ]; then
    echo "❌ Operación cancelada"
    exit 1
fi

echo ""
echo "🔄 Iniciando reset completo de PostgreSQL..."
echo ""

# 1. Detener el backend
echo "⏸️ Deteniendo backend..."
pm2 stop aegg-backend 2>/dev/null || echo "Backend ya estaba detenido"
pm2 delete aegg-backend 2>/dev/null || echo "Configuración PM2 eliminada"

# 2. Detener PostgreSQL
echo "⏸️ Deteniendo PostgreSQL..."
sudo systemctl stop postgresql

# 3. Eliminar datos de PostgreSQL (PELIGROSO - elimina todo)
echo "🗑️ Eliminando datos de PostgreSQL..."
sudo rm -rf /var/lib/postgresql/*/main
sudo rm -rf /etc/postgresql/*/main

# 4. Purgar y reinstalar PostgreSQL
echo "📦 Reinstalando PostgreSQL..."
sudo apt-get purge -y postgresql postgresql-*
sudo apt-get autoremove -y
sudo apt-get autoclean

# Reinstalar
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib

# 5. Inicializar PostgreSQL
echo "🔧 Inicializando PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Esperar a que PostgreSQL esté listo
sleep 5

# 6. Crear usuario y base de datos
echo "👤 Creando usuario y base de datos..."
sudo -u postgres psql -c "CREATE USER aegg_user WITH PASSWORD 'PMXUGyatADHSevnFOoKkCQuh';"
sudo -u postgres psql -c "CREATE DATABASE aegg_db OWNER aegg_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE aegg_db TO aegg_user;"

# 7. Configurar autenticación
echo "🔐 Configurando autenticación..."
PG_VERSION=$(sudo -u postgres psql -t -c "SELECT version();" | grep -oP '\d+\.\d+' | head -1)
PG_CONFIG="/etc/postgresql/$PG_VERSION/main"

# Backup de configuración original
sudo cp "$PG_CONFIG/pg_hba.conf" "$PG_CONFIG/pg_hba.conf.backup.$(date +%Y%m%d_%H%M%S)"

# Configurar pg_hba.conf para permitir conexiones locales con password
sudo sed -i 's/local   all             all                                     peer/local   all             all                                     md5/' "$PG_CONFIG/pg_hba.conf"
sudo sed -i 's/host    all             all             127.0.0.1\/32            ident/host    all             all             127.0.0.1\/32            md5/' "$PG_CONFIG/pg_hba.conf"

# 8. Reiniciar PostgreSQL
echo "🔄 Reiniciando PostgreSQL..."
sudo systemctl restart postgresql
sleep 3

# 9. Verificar conexión
echo "✅ Verificando conexión..."
PGPASSWORD='PMXUGyatADHSevnFOoKkCQuh' psql -h localhost -U aegg_user -d aegg_db -c "SELECT 'Conexión exitosa' as status;"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ PostgreSQL configurado correctamente!"
    echo ""
    echo "📋 Configuración:"
    echo "   Usuario: aegg_user"
    echo "   Password: PMXUGyatADHSevnFOoKkCQuh"
    echo "   Base de datos: aegg_db"
    echo "   Host: localhost"
    echo "   Puerto: 5432"
    echo ""
    echo "🚀 Ahora puedes:"
    echo "   1. Subir el nuevo backend"
    echo "   2. Instalar dependencias: npm install --production"
    echo "   3. Ejecutar migraciones si las tienes"
    echo "   4. Iniciar con PM2: pm2 start dist/main.js --name aegg-backend"
    echo ""
else
    echo ""
    echo "❌ Error en la configuración. Revisa los logs:"
    echo "   sudo tail -f /var/log/postgresql/postgresql-$PG_VERSION-main.log"
    echo ""
fi

echo "══════════════════════════════════════════════════════════════"
echo "🏁 Reset completo finalizado"
echo "══════════════════════════════════════════════════════════════"