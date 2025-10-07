# Troubleshooting - Sistema de Trabajos V2

## 🐛 Problemas Resueltos

### Error 500: "invalid input syntax for type uuid"

**Síntoma:**

```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Error al crear trabajo: AxiosError
```

**Error en Backend:**

```
QueryFailedError: invalid input syntax for type uuid: "1"
```

**Causa:**
El frontend estaba enviando un ID de usuario hardcoded `"1"` (string) en lugar del UUID real del usuario autenticado.

**Solución:**

1. Importar `useAuth` del `AuthContext` en `TrabajosPage.tsx`
2. Obtener el usuario actual: `const { user } = useAuth();`
3. Pasar el ID real al diálogo: `currentUserId={user.id}`
4. Proteger el componente con validación: `{user && <CreateTrabajoDialog ... />}`

**Archivos Modificados:**

- `frontend/src/pages/TrabajosPage.tsx`

**Código Correcto:**

```typescript
import { useAuth } from "../context/AuthContext";

export const TrabajosPage: React.FC = () => {
  const { user } = useAuth();

  // ...

  return (
    <>
      {/* ... otros componentes ... */}

      {user && (
        <CreateTrabajoDialog
          open={createTrabajoOpen}
          onClose={() => setCreateTrabajoOpen(false)}
          onCreated={loadTrabajos}
          currentUserId={user.id} // ✅ UUID real del usuario
        />
      )}
    </>
  );
};
```

---

## 🔍 Cómo Diagnosticar Errores

### 1. Errores 500 del Backend

**Pasos:**

1. Abre la terminal del backend
2. Busca el mensaje de error completo
3. Identifica el tipo de error (QueryFailedError, ValidationError, etc.)
4. Lee el stack trace para ubicar el archivo y línea

**Errores Comunes:**

- `invalid input syntax for type uuid`: ID no válido (debe ser UUID)
- `null value in column violates not-null constraint`: Falta un campo requerido
- `duplicate key value violates unique constraint`: Ya existe un registro con esos valores únicos
- `ForeignKeyViolation`: ID de referencia no existe

### 2. Errores de Validación (400)

**Causa:**
Los DTOs con `class-validator` están rechazando los datos.

**Solución:**

- Verifica que todos los campos requeridos estén presentes
- Revisa los tipos de datos (string, number, boolean)
- Valida los enums (estados, tipos de reporte)
- Verifica rangos numéricos (mes 1-12, año 2020-2100)

### 3. Errores de Autenticación (401)

**Causa:**
Token JWT inválido o expirado.

**Solución:**

- Verifica que el token esté en localStorage
- Revisa que el interceptor de axios lo esté agregando
- Prueba hacer logout y login nuevamente
- Verifica que el backend esté validando correctamente

### 4. Errores CORS

**Síntoma:**

```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solución:**
Verifica la configuración CORS en el backend (`main.ts`):

```typescript
app.enableCors({
  origin: ["http://localhost:5173", "http://localhost:3001"],
  credentials: true,
});
```

---

## 🛠️ Herramientas de Debug

### Backend

**Ver logs en tiempo real:**

```powershell
cd backend
npm run start:dev
```

**Revisar queries SQL:**
Los logs muestran todas las queries ejecutadas por TypeORM.

**Activar logs detallados:**
En `backend/src/app.module.ts`, configura TypeORM:

```typescript
TypeOrmModule.forRoot({
  // ...
  logging: true,  // Muestra todas las queries
  logger: 'advanced-console',
}),
```

### Frontend

**Console del navegador:**

- F12 → Console: Ver errores de JavaScript
- F12 → Network: Ver requests HTTP y respuestas
- F12 → Application → Local Storage: Ver token y user

**React DevTools:**

- Instala la extensión React Developer Tools
- Inspecciona el estado de componentes
- Verifica el contexto de Auth

---

## 📝 Checklist de Problemas Comunes

### Antes de Crear un Trabajo

- [ ] ¿Estás autenticado? (token en localStorage)
- [ ] ¿El usuario existe en la base de datos?
- [ ] ¿El backend está corriendo?
- [ ] ¿Hay conexión a la base de datos?

### Antes de Importar un Reporte

- [ ] ¿El mes existe?
- [ ] ¿El archivo es .xlsx o .xls?
- [ ] ¿El archivo tiene el formato correcto?
- [ ] ¿Multer está configurado en el backend?

### Antes de Procesar un Mes

- [ ] ¿Los 3 reportes están IMPORTADOS?
- [ ] ¿El mes no está ya COMPLETADO?
- [ ] ¿Hay datos en los reportes?

---

## 🚨 Errores Críticos a Evitar

### 1. Usar IDs Hardcoded

❌ **MAL:**

```typescript
const currentUserId = "1"; // Temporal
```

✅ **BIEN:**

```typescript
const { user } = useAuth();
const currentUserId = user?.id;
```

### 2. No Validar el Usuario

❌ **MAL:**

```typescript
<CreateTrabajoDialog currentUserId={currentUserId} />
```

✅ **BIEN:**

```typescript
{
  user && <CreateTrabajoDialog currentUserId={user.id} />;
}
```

### 3. No Manejar Errores

❌ **MAL:**

```typescript
const data = await api.get("/trabajos");
```

✅ **BIEN:**

```typescript
try {
  const data = await api.get("/trabajos");
} catch (error) {
  console.error("Error:", error);
  alert("Error al cargar trabajos");
}
```

### 4. No Recargar Datos

❌ **MAL:**

```typescript
await trabajosService.create(data);
onClose();
```

✅ **BIEN:**

```typescript
await trabajosService.create(data);
onCreated(); // Recarga la lista
onClose();
```

---

## 📞 Cómo Reportar un Bug

Incluye siempre:

1. **Descripción**: ¿Qué estabas haciendo?
2. **Error**: Mensaje completo del error
3. **Logs Backend**: Últimas 20 líneas de la terminal del backend
4. **Console Frontend**: Errores de la consola del navegador
5. **Datos**: Qué datos enviaste (JSON)
6. **Pasos para Reproducir**:
   - Paso 1: ...
   - Paso 2: ...
   - Paso 3: Error ocurre aquí

---

## ✅ Sistema Funcionando

Cuando todo esté bien, deberías ver:

**Backend:**

```
[Nest] LOG Nest application successfully started
🚀 Backend running on http://localhost:3000
```

**Frontend:**

```
VITE v5.x.x ready in XXX ms
➜ Local: http://localhost:5173/
```

**Al crear un trabajo:**

1. Modal se abre
2. Formulario se completa
3. Click en "Crear Trabajo"
4. Alert: "Trabajo creado correctamente"
5. Modal se cierra
6. Lista se actualiza con el nuevo trabajo
