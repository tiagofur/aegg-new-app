# ⚡ INICIO RÁPIDO - Otra Computadora

**Fecha:** 6 de octubre, 2025  
**Para:** Continuar desarrollo en otra máquina

---

## 🚀 PASOS EXACTOS (5 minutos)

### 1️⃣ **Clonar Repositorio**

```powershell
git clone https://github.com/tiagofur/aegg-new-app.git
cd aegg-new-app
```

### 2️⃣ **Verificar Docker Desktop**

```
- Abrir Docker Desktop
- Esperar a que diga "Engine running"
```

### 3️⃣ **Iniciar Todo**

```powershell
docker-compose up -d
```

### 4️⃣ **Esperar ~30 segundos** ⏱️

### 5️⃣ **Verificar**

```powershell
docker-compose ps
```

**Debes ver:**

```
nestjs_backend    Up
postgres_db       Up
react_frontend    Up
```

### 6️⃣ **Abrir Navegador**

```
http://localhost:5173
```

### 7️⃣ **Crear Usuario**

```
1. Click "Registrarse"
2. Email: test@test.com
3. Password: Test123!
4. Nombre: Test User
5. Click "Registrarse"
```

### 8️⃣ **Probar que Funciona**

```
1. Dashboard → "Mis Trabajos"
2. Click "Nuevo Trabajo"
3. Nombre: "Test"
4. Click "Crear"
5. ✅ Si ves el trabajo → TODO OK
```

---

## 🎯 SIGUIENTE TAREA

Una vez verificado que todo funciona:

```
"Vamos a FASE 4, crear componentes para visualizar los datos importados"
```

---

## 📚 DOCUMENTACIÓN COMPLETA

Para más detalles, ver:

- **`ESTADO-ACTUAL-DEL-PROYECTO.md`** - Documentación completa
- **`docs/FASE-3-FRONTEND-IMPORTACION-COMPLETADA.md`** - Fase actual
- **`docs/GUIA-PRUEBAS-FASE-3.md`** - Cómo probar todo

---

## 🆘 SI ALGO NO FUNCIONA

### **Backend no inicia:**

```powershell
docker-compose logs backend --tail 20
docker-compose restart backend
```

### **Frontend no carga:**

```powershell
docker-compose logs frontend --tail 20
docker-compose restart frontend
```

### **Base de datos error:**

```powershell
docker-compose logs postgres --tail 20
docker-compose restart postgres
```

### **Empezar de cero:**

```powershell
docker-compose down -v
docker-compose up -d --build
```

---

## ✅ CHECKLIST

```
□ Docker Desktop corriendo
□ Repo clonado
□ docker-compose up -d ejecutado
□ 3 containers UP
□ http://localhost:5173 carga
□ Puedo registrarme/login
□ Puedo crear trabajo
```

**Si todo marcado:** ✅ LISTO PARA CONTINUAR

---

## 🔥 COMANDOS ÚTILES

```powershell
# Ver todo
docker-compose ps

# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar todo
docker-compose restart

# Detener todo
docker-compose down

# Iniciar todo
docker-compose up -d
```

---

**Tiempo total:** ~5 minutos  
**Siguiente paso:** FASE 4 - Visualización de Datos  
**Estado:** ✅ FASE 3 completada y funcionando
