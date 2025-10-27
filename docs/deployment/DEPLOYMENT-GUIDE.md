# 🚀 Guía de Deployment en Plesk Obsidian

## 📋 Requisitos Previos

- VPS con Plesk Obsidian
- Acceso SSH al servidor
- Node.js 18+ instalado
- PostgreSQL configurado
- Dominios configurados:
  - `aegg-api.creapolis.mx` → Backend
  - `aegg.creapolis.mx` → Frontend

---

## 🎯 MÉTODO RECOMENDADO: Deployment Nativo con PM2

### **PASO 1: Configurar PostgreSQL**

#### Opción A: Usar PostgreSQL de Plesk

1. En Plesk, ir a **Databases** → **Add Database**
2. Crear base de datos:
   - Nombre: `aegg_db`
   - Usuario: `aegg_user`
   - Password: Generar contraseña segura
3. Anotar las credenciales

#### Opción B: Instalar PostgreSQL manualmente (si no está disponible)

```bash
# SSH al servidor
ssh root@74.208.234.244

# Instalar PostgreSQL 15
sudo dnf install -y postgresql15-server postgresql15
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Crear usuario y base de datos
sudo -u postgres psql
CREATE DATABASE aegg_db;
CREATE USER aegg_user WITH ENCRYPTED PASSWORD 'TU_PASSWORD_SEGURA';
GRANT ALL PRIVILEGES ON DATABASE aegg_db TO aegg_user;
\q
```

---

### **PASO 2: Preparar el Backend**

#### En tu máquina local:

```powershell
# 1. Actualizar configuración de CORS
cd backend\src
# Editar main.ts para incluir el dominio de producción
```

```powershell
# 2. Build del backend
cd backend
npm install
npm run build

# 3. Crear archivo .env de producción
# Editar .env.production con tus credenciales reales
```

#### En el servidor (SSH):

```bash
# Conectar al servidor
ssh root@74.208.234.244

# Navegar al directorio del dominio backend
cd /var/www/vhosts/creapolis.mx/aegg-api

# Clonar o subir tu código (opción Git)
git clone https://github.com/tiagofur/aegg-new-app.git .
# O usar FileZilla/WinSCP para subir los archivos

# Instalar dependencias del backend
cd backend
npm install --production

# Copiar y configurar variables de entorno
cp ../.env.production .env
nano .env  # Editar con credenciales reales

# Ejecutar migraciones
npm run build
node -r ts-node/register node_modules/typeorm/cli.js migration:run -d src/data-source.ts
```

---

### **PASO 3: Configurar PM2**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Desde el directorio raíz del proyecto
cd /var/www/vhosts/creapolis.mx/aegg-api

# Iniciar la aplicación
pm2 start ecosystem.config.js

# Configurar PM2 para iniciar en boot
pm2 startup
pm2 save

# Ver logs
pm2 logs aegg-backend
pm2 status
```

---

### **PASO 4: Configurar Dominio Backend en Plesk**

1. **Crear Subdominio** en Plesk:

   - Dominio: `aegg-api.creapolis.mx`
   - Document root: `/var/www/vhosts/creapolis.mx/aegg-api`

2. **Configurar Apache/Nginx como Proxy Reverso**:

   En Plesk → `aegg-api.creapolis.mx` → **Apache & nginx Settings**

   **Nginx Directives:**

   ```nginx
   location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_set_header X-Real-IP $remote_addr;
       proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       proxy_set_header X-Forwarded-Proto $scheme;
       proxy_cache_bypass $http_upgrade;
   }
   ```

3. **Habilitar SSL** (Let's Encrypt):
   - Plesk → SSL/TLS Certificates → Let's Encrypt → Issue

---

### **PASO 5: Preparar el Frontend**

#### En tu máquina local:

```powershell
# 1. Configurar variables de entorno de producción
cd frontend
# Verificar que .env.production tenga VITE_API_URL=https://aegg-api.creapolis.mx

# 2. Build del frontend
npm install
npm run build
# Esto genera la carpeta 'dist'
```

#### En el servidor (SSH):

```bash
# Navegar al directorio del dominio frontend
cd /var/www/vhosts/creapolis.mx/aegg/httpdocs

# Subir los archivos de 'dist' aquí
# Usar FileZilla/WinSCP o rsync

# O si usas Git:
git clone https://github.com/tiagofur/aegg-new-app.git temp
mv temp/frontend/dist/* .
rm -rf temp
```

---

### **PASO 6: Configurar Dominio Frontend en Plesk**

1. **Crear Subdominio** en Plesk:

   - Dominio: `aegg.creapolis.mx`
   - Document root: `/var/www/vhosts/creapolis.mx/aegg/httpdocs`

2. **Configurar para SPA (React Router)**:

   En Plesk → `aegg.creapolis.mx` → **Apache & nginx Settings**

   **Apache Directives:**

   ```apache
   <IfModule mod_rewrite.c>
       RewriteEngine On
       RewriteBase /
       RewriteRule ^index\.html$ - [L]
       RewriteCond %{REQUEST_FILENAME} !-f
       RewriteCond %{REQUEST_FILENAME} !-d
       RewriteRule . /index.html [L]
   </IfModule>
   ```

3. **Habilitar SSL** (Let's Encrypt):
   - Plesk → SSL/TLS Certificates → Let's Encrypt → Issue

---

## ✅ VERIFICACIÓN

### Backend:

```bash
curl https://aegg-api.creapolis.mx/health
# O visitar en navegador
```

### Frontend:

- Visitar: https://aegg.creapolis.mx
- Verificar que cargue y pueda hacer login

### PM2:

```bash
pm2 status
pm2 logs aegg-backend --lines 50
```

---

## 🔄 ACTUALIZACIÓN DE LA APLICACIÓN

### Backend:

```bash
ssh root@74.208.234.244
cd /var/www/vhosts/creapolis.mx/aegg-api

# Pull cambios
git pull origin mejoras-2025-10-18

# Rebuild
cd backend
npm install --production
npm run build

# Restart PM2
pm2 restart aegg-backend
pm2 logs
```

### Frontend:

```powershell
# Local
cd frontend
npm run build

# Subir 'dist' al servidor
scp -r dist/* root@74.208.234.244:/var/www/vhosts/creapolis.mx/aegg/httpdocs/
```

---

## 🐛 TROUBLESHOOTING

### Backend no inicia:

```bash
pm2 logs aegg-backend --lines 100
# Revisar errores de conexión a BD o variables de entorno
```

### Error de conexión a BD:

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql
# Verificar credenciales en .env
cat backend/.env
```

### CORS errors:

- Verificar que `CORS_ORIGIN` en `.env.production` sea correcto
- Verificar que el dominio frontend esté en `main.ts`

### Frontend muestra página en blanco:

- Verificar rutas de assets en `index.html`
- Verificar que `.env.production` tenga la URL correcta del backend
- Revisar console del navegador (F12)

---

## 🔐 SEGURIDAD

1. **Cambiar todos los secretos**:

   - JWT_SECRET (mínimo 32 caracteres)
   - DB_PASSWORD (contraseña fuerte)

2. **Configurar firewall**:

   ```bash
   # Solo permitir puertos necesarios
   sudo firewall-cmd --permanent --add-service=http
   sudo firewall-cmd --permanent --add-service=https
   sudo firewall-cmd --permanent --add-port=3000/tcp
   sudo firewall-cmd --reload
   ```

3. **Configurar límites de rate-limiting** en el backend

4. **Backup de base de datos**:
   ```bash
   pg_dump -U aegg_user aegg_db > backup-$(date +%Y%m%d).sql
   ```

---

## 📊 MONITOREO

### PM2 Monitoring:

```bash
pm2 monit
```

### Logs:

```bash
# Backend logs
pm2 logs aegg-backend

# System logs
journalctl -u postgresql -n 50
```

---

## 🎉 ¡LISTO!

Tu aplicación debería estar funcionando en:

- **Frontend**: https://aegg.creapolis.mx
- **Backend API**: https://aegg-api.creapolis.mx
