# Cambio de RUT a RFC (Opcional) - Resumen

**Fecha:** 7 de Octubre, 2025  
**Tipo de cambio:** Modificación de campo y constraint

---

## 🎯 Cambio Realizado

Se cambió el campo **"RUT del Cliente"** (obligatorio) a **"RFC del Cliente"** (opcional) en el sistema de trabajos.

### Razón del Cambio

El RUT es específico de Chile, pero el sistema puede ser usado en otros países (como México con RFC). Al hacerlo opcional, se amplía el alcance geográfico del sistema.

---

## 📝 Cambios en Base de Datos

### Migración SQL Ejecutada:

```sql
-- 1. Eliminar índice único anterior
DROP INDEX IF EXISTS "IDX_165096a68be634ca21347c5651";

-- 2. Renombrar columna
ALTER TABLE trabajos RENAME COLUMN "clienteRut" TO "clienteRfc";

-- 3. Hacer columna nullable
ALTER TABLE trabajos ALTER COLUMN "clienteRfc" DROP NOT NULL;

-- 4. Nuevo índice único por clienteNombre + anio
CREATE UNIQUE INDEX "IDX_165096a68be634ca21347c5651"
ON trabajos ("clienteNombre", "anio");
```

### Resultado:

- ✅ Columna renombrada: `clienteRut` → `clienteRfc`
- ✅ Columna ahora es nullable (`YES`)
- ✅ Índice único ahora en `(clienteNombre, anio)`
- ✅ Ya no se puede tener dos trabajos con el mismo nombre de cliente y año

---

## 🔧 Cambios en Backend

### Entidad `Trabajo` (`trabajo.entity.ts`):

```typescript
// ANTES
@Column({ length: 50 })
clienteRut: string;

@Index(['clienteRut', 'anio'], { unique: true })

// DESPUÉS
@Column({ length: 50, nullable: true })
clienteRfc: string;

@Index(['clienteNombre', 'anio'], { unique: true })
```

### DTO `CreateTrabajoDto`:

```typescript
// ANTES
@IsString()
@IsNotEmpty()
clienteRut: string;

// DESPUÉS
@IsString()
@IsOptional()
clienteRfc?: string;
```

### Service `TrabajosService`:

```typescript
// ANTES
where: {
    clienteRut: createTrabajoDto.clienteRut,
    anio: createTrabajoDto.anio,
}

// DESPUÉS
where: {
    clienteNombre: createTrabajoDto.clienteNombre,
    anio: createTrabajoDto.anio,
}
```

---

## 🎨 Cambios en Frontend

### Interfaces TypeScript (`trabajo.ts`):

```typescript
// ANTES
export interface Trabajo {
  clienteRut: string;
}

// DESPUÉS
export interface Trabajo {
  clienteRfc?: string; // Opcional
}
```

### Componente `TrabajosList.tsx`:

```tsx
{
  /* ANTES */
}
<p className="text-sm text-gray-600 mb-1">RUT: {trabajo.clienteRut}</p>;

{
  /* DESPUÉS */
}
{
  trabajo.clienteRfc && (
    <p className="text-sm text-gray-600 mb-1">RFC: {trabajo.clienteRfc}</p>
  );
}
```

### Componente `CreateTrabajoDialog.tsx`:

```tsx
{/* ANTES */}
<label>RUT del Cliente *</label>
<input required value={formData.clienteRut} />

{/* DESPUÉS */}
<label>RFC del Cliente (Opcional)</label>
<input value={formData.clienteRfc} />  {/* Sin required */}
```

---

## 🧪 Casos de Prueba

### Crear Trabajo SIN RFC:

```json
{
  "clienteNombre": "Empresa Test",
  "clienteRfc": "",
  "anio": 2025,
  "usuarioAsignadoId": "uuid-valido"
}
```

✅ **Resultado:** Se crea exitosamente

### Crear Trabajo CON RFC:

```json
{
  "clienteNombre": "Empresa ABC",
  "clienteRfc": "ABC123456XYZ",
  "anio": 2025,
  "usuarioAsignadoId": "uuid-valido"
}
```

✅ **Resultado:** Se crea exitosamente con RFC guardado

### Crear Trabajo Duplicado (mismo nombre y año):

```json
{
  "clienteNombre": "Empresa Test",
  "anio": 2025
}
```

❌ **Resultado:** Error - "Ya existe un trabajo para el cliente Empresa Test en el año 2025"

---

## ✅ Validaciones

### Constraint Único:

- **Antes:** `(clienteRut, anio)` - Un RUT podía tener múltiples trabajos por año
- **Después:** `(clienteNombre, anio)` - Un cliente (por nombre) solo puede tener UN trabajo por año

### Ventajas:

1. ✅ No requiere RFC para crear un trabajo
2. ✅ Funciona en cualquier país (México: RFC, Chile: RUT, etc.)
3. ✅ Previene duplicados por nombre de cliente
4. ✅ Más flexible para uso internacional

### Desventajas:

1. ⚠️ Dos clientes con el mismo nombre pero diferente RFC podrían causar confusión
2. ⚠️ Requiere nombres de cliente únicos por año

---

## 📦 Archivos Modificados

### Backend:

- ✅ `backend/src/trabajos/entities/trabajo.entity.ts`
- ✅ `backend/src/trabajos/dto/create-trabajo.dto.ts`
- ✅ `backend/src/trabajos/services/trabajos.service.ts`

### Frontend:

- ✅ `frontend/src/types/trabajo.ts`
- ✅ `frontend/src/components/trabajos/TrabajosList.tsx`
- ✅ `frontend/src/components/trabajos/TrabajoDetail.tsx`
- ✅ `frontend/src/components/trabajos/CreateTrabajoDialog.tsx`

### Base de Datos:

- ✅ Columna renombrada y hecha nullable
- ✅ Índice único actualizado

---

## 🚀 Estado Actual

- ✅ Backend compilado sin errores
- ✅ Base de datos migrada correctamente
- ✅ Frontend actualizado
- ✅ Servidor corriendo en http://localhost:3000

### Próximo Paso:

Prueba crear un trabajo SIN RFC desde el frontend para validar el cambio.
