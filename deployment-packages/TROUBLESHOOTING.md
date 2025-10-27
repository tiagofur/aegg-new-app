# 🔍 Checklist de Problemas Comunes

## ❗ Problema: Frontend no carga datos

### Posibles causas:

## 1️⃣ Archivo .env no copiado al servidor

**Síntoma**: Backend arranca pero no puede conectarse a la base de datos

**Solución**:

```bash
# Conectar al servidor
ssh root@74.208.234.244

# Verificar si existe .env
ls -la /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env

# Si NO existe, crearlo:
nano /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env
```

Pega este contenido:

```
NODE_ENV=production
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=aegg_user
DB_PASSWORD=PMXUGyatADHSevnFOoKkCQuh
DB_NAME=aegg_db

JWT_SECRET=GMB2qR65YZusTdkAbrc4hPyH0jvNelFa
JWT_EXPIRATION=7d

CORS_ORIGIN=https://aegg.creapolis.mx
```

Guardar (Ctrl+O, Enter, Ctrl+X) y reiniciar:

```bash
pm2 restart aegg-backend
pm2 logs aegg-backend --lines 20
```

---

## 2️⃣ Backend compilado incorrectamente

**Síntoma**: PM2 muestra "online" pero no responde

**Solución**:

```bash
# Verificar que main.js existe
ls -la /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/dist/main.js

# Si NO existe, hay que recompilar en local y subir de nuevo
```

---

## 3️⃣ PostgreSQL no está corriendo

**Síntoma**: Error de conexión a base de datos en logs

**Solución**:

```bash
# Verificar PostgreSQL
systemctl status postgresql

# Si está detenido, iniciar:
systemctl start postgresql
systemctl enable postgresql

# Reiniciar backend
pm2 restart aegg-backend
```

---

## 4️⃣ CORS bloqueando peticiones

**Síntoma**: Frontend carga pero aparece error CORS en consola del navegador

**Solución**:

```bash
# Verificar .env tiene el dominio correcto
# Verificar .env tiene el dominio correcto
cat /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env | grep CORS

# Debe mostrar:
# CORS_ORIGIN=https://aegg.creapolis.mx

# Si está mal, editar:
# Si está mal, editar:
nano /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend/.env
# Cambiar la línea CORS_ORIGIN
# Guardar y reiniciar:
pm2 restart aegg-backend
```

---

## 5️⃣ Permisos incorrectos

**Síntoma**: Backend no puede leer archivos

**Solución**:

```bash
# Ajustar permisos
chown -R www-data:www-data /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend
chmod -R 755 /var/www/vhosts/creapolis.mx/aegg-api.creapolis.mx/backend

pm2 restart aegg-backend
```

---

## 🔍 Comando de Diagnóstico Rápido

Copia y ejecuta esto en el servidor:

```bash
bash /tmp/diagnostico-backend.sh
```

Si no tienes ese archivo, créalo:

```bash
nano /tmp/diagnostico-backend.sh
```

Pega el contenido del archivo `diagnostico-backend.sh` y ejecuta:

```bash
chmod +x /tmp/diagnostico-backend.sh
bash /tmp/diagnostico-backend.sh
```

---

## 🌐 Verificar Frontend en el Navegador

1. Abre: https://aegg.creapolis.mx
2. Abre DevTools (F12) → Pestaña **Console**
3. ¿Hay errores? Cópialos

4. Abre DevTools → Pestaña **Network**
5. Recarga la página (F5)
6. ¿Hay peticiones a `aegg-api.creapolis.mx` en rojo?
7. Click en una petición fallida → Ver el error

---

## 📋 Información a Compartir

Si sigues con problemas, comparte:

1. **Output completo del script de diagnóstico**
2. **Errores en Console del navegador (F12)**
3. **Errores en Network del navegador (F12)**
4. **Screenshot del PM2 status**

Con esa información puedo ayudarte mejor 🔍
