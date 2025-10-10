# 🔍 Análisis: Tabla Default vs Tablas Específicas

## 📋 Problema Identificado

Existen **2 sistemas de visualización de reportes** en paralelo:

### 1. Sistema Viejo (Tabla Default - NO Editable) ❌

**Componente:** `ReporteViewer.tsx`

- **Ubicación:** `frontend/src/components/trabajos/ReporteViewer.tsx`
- **Tipo de reporte:** `INGRESOS` (tipo genérico viejo)
- **Características:**
  - Solo lectura (read-only)
  - Renderiza tabla HTML básica
  - NO tiene edición de Estado SAT
  - NO tiene dropdown para cambiar valores
  - Solo muestra los datos tal cual vienen del Excel

**Código:**

```tsx
// En ReporteCard.tsx
{reporte.tipo === "INGRESOS_AUXILIAR" ? (
  <AuxiliarIngresosTable ... />
) : reporte.tipo === "INGRESOS_MI_ADMIN" ? (
  <MiAdminIngresosTable ... />
) : (
  <ReporteViewer ... />  // ← Tabla genérica SIN edición
)}
```

### 2. Sistema Nuevo (Tablas Específicas - Editables) ✅

**Componentes:**

1. `AuxiliarIngresosTable.tsx` para tipo `INGRESOS_AUXILIAR`
2. `MiAdminIngresosTable.tsx` para tipo `INGRESOS_MI_ADMIN`

**Características:**

- ✅ Editables con `EditableEstadoSatCell`
- ✅ Dropdown "Vigente" / "Cancelada"
- ✅ Guardado en base de datos
- ✅ Comparación entre reportes
- ✅ Cálculos automáticos
- ✅ Estilos condicionales

---

## 🔍 Tipos de Reportes en el Sistema

### Backend (Enum)

```typescript
export enum TipoReporteMensual {
  INGRESOS = "INGRESOS", // ← Viejo, genérico
  INGRESOS_AUXILIAR = "INGRESOS_AUXILIAR", // ← Nuevo, editable
  INGRESOS_MI_ADMIN = "INGRESOS_MI_ADMIN", // ← Nuevo, editable
}
```

### Frontend (Nombres para UI)

```typescript
export const TIPOS_REPORTE_NOMBRES = {
  INGRESOS: "Reporte Ingresos", // ← ReporteViewer
  INGRESOS_AUXILIAR: "Reporte Ingresos Auxiliar", // ← AuxiliarIngresosTable
  INGRESOS_MI_ADMIN: "Reporte MI Admin", // ← MiAdminIngresosTable
};
```

---

## 🎯 Identificar Qué Sistema Estás Usando

### Opción 1: Revisar en Base de Datos

```sql
SELECT
    m.mes,
    rm.tipo,
    rm.archivo_original,
    rm.estado,
    rm.fecha_importacion
FROM reportes_mensuales rm
JOIN meses m ON m.id = rm.mes_id
WHERE m.trabajo_id = 'TU_TRABAJO_ID'
ORDER BY m.mes, rm.tipo;
```

### Opción 2: Revisar en la UI

Cuando abres un reporte, mira el código de debug:

```tsx
// En ReporteCard.tsx hay este debug log:
console.log("🔍 ReporteCard - Tipo de reporte:", reporte.tipo);
```

Abre la consola del navegador (F12) y verás:

- `INGRESOS` → Usando tabla vieja ❌
- `INGRESOS_AUXILIAR` → Usando tabla nueva ✅
- `INGRESOS_MI_ADMIN` → Usando tabla nueva ✅

### Opción 3: Inspeccionar el Badge Amarillo

Si ves este mensaje en la UI:

```
⚠️ DEBUG: Tipo de reporte "INGRESOS" - Usando ReporteViewer genérico
```

Significa que **estás usando la tabla vieja NO editable**.

---

## 🔧 Soluciones

### Solución A: Migrar Reportes Viejos a Nuevos Tipos ✅ (Recomendado)

Si tienes reportes de tipo `INGRESOS`, necesitas:

1. **Identificar reportes a migrar:**

```sql
SELECT id, mes_id, tipo, archivo_original
FROM reportes_mensuales
WHERE tipo = 'INGRESOS';
```

2. **Actualizar el tipo según corresponda:**

```sql
-- Si el archivo es de Auxiliar de Ingresos
UPDATE reportes_mensuales
SET tipo = 'INGRESOS_AUXILIAR'
WHERE tipo = 'INGRESOS'
  AND archivo_original LIKE '%auxiliar%';

-- Si el archivo es de Mi Admin
UPDATE reportes_mensuales
SET tipo = 'INGRESOS_MI_ADMIN'
WHERE tipo = 'INGRESOS'
  AND archivo_original LIKE '%admin%';
```

3. **Refrescar la página web** - Ahora verás las tablas editables

### Solución B: Agregar Edición a ReporteViewer ⚠️ (No Recomendado)

Podrías agregar edición al `ReporteViewer.tsx`, pero:

- ❌ No es específico para cada tipo de reporte
- ❌ No tiene columnas especializadas (TC Sugerido, Comparación, etc.)
- ❌ Duplicarías lógica ya existente en las tablas específicas
- ❌ Más difícil de mantener

### Solución C: Eliminar Tipo INGRESOS del Enum ✅ (Limpieza)

Si ya no usas el tipo genérico `INGRESOS`:

1. **Verificar que no haya reportes usando ese tipo:**

```sql
SELECT COUNT(*) FROM reportes_mensuales WHERE tipo = 'INGRESOS';
```

2. **Si el count es 0, remover del código:**

**Backend:**

```typescript
// backend/src/trabajos/entities/reporte-mensual.entity.ts
export enum TipoReporteMensual {
  // INGRESOS = 'INGRESOS',  // ← REMOVER
  INGRESOS_AUXILIAR = "INGRESOS_AUXILIAR",
  INGRESOS_MI_ADMIN = "INGRESOS_MI_ADMIN",
}
```

**Frontend:**

```typescript
// frontend/src/types/trabajo.ts
export interface ReporteMensual {
  tipo: "INGRESOS_AUXILIAR" | "INGRESOS_MI_ADMIN"; // ← Solo 2 tipos
}

export const TIPOS_REPORTE_NOMBRES = {
  // INGRESOS: 'Reporte Ingresos',  // ← REMOVER
  INGRESOS_AUXILIAR: "Reporte Ingresos Auxiliar",
  INGRESOS_MI_ADMIN: "Reporte MI Admin",
};
```

3. **Actualizar ReporteCard.tsx** para remover el fallback:

```tsx
// Remover el else con ReporteViewer
{reporte.tipo === "INGRESOS_AUXILIAR" ? (
  <AuxiliarIngresosTable ... />
) : reporte.tipo === "INGRESOS_MI_ADMIN" ? (
  <MiAdminIngresosTable ... />
) : (
  <div className="bg-red-50 border border-red-200 rounded p-4">
    <p className="text-red-800">
      ⚠️ Tipo de reporte desconocido: {reporte.tipo}
    </p>
  </div>
)}
```

---

## 🧪 Script de Diagnóstico

Crea este script para verificar qué reportes tienes:

### PowerShell: `diagnosticar-reportes.ps1`

```powershell
# Script para diagnosticar tipos de reportes en uso

param(
    [string]$trabajoId = ""
)

# Conexión a PostgreSQL (ajusta según tu config)
$pgHost = "localhost"
$pgPort = "5432"
$pgDb = "aegg_db"
$pgUser = "postgres"

if (-not $trabajoId) {
    Write-Host "❌ Debes proporcionar el trabajoId" -ForegroundColor Red
    Write-Host "Uso: .\diagnosticar-reportes.ps1 -trabajoId 'TU_TRABAJO_ID'" -ForegroundColor Yellow
    exit 1
}

# Query SQL
$query = @"
SELECT
    t.cliente_nombre,
    t.anio,
    m.mes,
    rm.tipo,
    rm.archivo_original,
    rm.estado,
    rm.fecha_importacion
FROM reportes_mensuales rm
JOIN meses m ON m.id = rm.mes_id
JOIN trabajos t ON t.id = m.trabajo_id
WHERE m.trabajo_id = '$trabajoId'
ORDER BY m.mes, rm.tipo;
"@

Write-Host "`n📊 Diagnóstico de Reportes`n" -ForegroundColor Cyan

# Ejecutar query (requiere psql instalado)
try {
    $env:PGPASSWORD = "tu_password"
    $result = psql -h $pgHost -p $pgPort -U $pgUser -d $pgDb -t -A -F "|" -c $query

    if ($LASTEXITCODE -eq 0) {
        $lines = $result -split "`n" | Where-Object { $_ }

        $tiposCount = @{}
        $vigentesCount = 0
        $canceladasCount = 0

        foreach ($line in $lines) {
            $parts = $line -split "\|"
            if ($parts.Length -ge 4) {
                $mes = $parts[2]
                $tipo = $parts[3]
                $archivo = $parts[4]
                $estado = $parts[5]

                # Contar tipos
                if ($tiposCount.ContainsKey($tipo)) {
                    $tiposCount[$tipo]++
                } else {
                    $tiposCount[$tipo] = 1
                }

                # Determinar si usa tabla editable
                $esEditable = $tipo -eq "INGRESOS_AUXILIAR" -or $tipo -eq "INGRESOS_MI_ADMIN"
                $icono = if ($esEditable) { "✅" } else { "❌" }

                Write-Host "$icono Mes $mes - Tipo: $tipo" -ForegroundColor $(if ($esEditable) { "Green" } else { "Red" })
                Write-Host "   Archivo: $archivo" -ForegroundColor Gray
                Write-Host "   Estado: $estado`n" -ForegroundColor Gray
            }
        }

        Write-Host "`n📈 Resumen de Tipos:" -ForegroundColor Cyan
        foreach ($tipo in $tiposCount.Keys) {
            $count = $tiposCount[$tipo]
            $esEditable = $tipo -eq "INGRESOS_AUXILIAR" -or $tipo -eq "INGRESOS_MI_ADMIN"
            $status = if ($esEditable) { "✅ EDITABLE" } else { "❌ NO EDITABLE (Tabla vieja)" }

            Write-Host "   $tipo : $count reportes - $status" -ForegroundColor $(if ($esEditable) { "Green" } else { "Red" })
        }

        if ($tiposCount.ContainsKey("INGRESOS")) {
            Write-Host "`n⚠️  ADVERTENCIA:" -ForegroundColor Yellow
            Write-Host "   Tienes $($tiposCount['INGRESOS']) reportes usando el tipo 'INGRESOS' viejo." -ForegroundColor Yellow
            Write-Host "   Estos reportes NO son editables y usan ReporteViewer." -ForegroundColor Yellow
            Write-Host "   Considera migrarlos a INGRESOS_AUXILIAR o INGRESOS_MI_ADMIN.`n" -ForegroundColor Yellow
        } else {
            Write-Host "`n✅ Todos los reportes usan tipos nuevos (editables)`n" -ForegroundColor Green
        }

    } else {
        Write-Host "❌ Error al ejecutar query" -ForegroundColor Red
    }

} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
}
```

---

## 📊 Tabla Comparativa

| Característica                 | ReporteViewer (Viejo) | Tablas Específicas (Nuevas)                             |
| ------------------------------ | --------------------- | ------------------------------------------------------- |
| **Tipo de reporte**            | `INGRESOS`            | `INGRESOS_AUXILIAR`, `INGRESOS_MI_ADMIN`                |
| **Componente**                 | `ReporteViewer.tsx`   | `AuxiliarIngresosTable.tsx`, `MiAdminIngresosTable.tsx` |
| **Estado SAT editable**        | ❌ No                 | ✅ Sí (dropdown)                                        |
| **Tipo Cambio editable**       | ❌ No                 | ✅ Sí (input)                                           |
| **Comparación entre reportes** | ❌ No                 | ✅ Sí                                                   |
| **TC Sugerido**                | ❌ No                 | ✅ Sí                                                   |
| **Cancelar Folios Únicos**     | ❌ No                 | ✅ Sí                                                   |
| **Guardar cambios**            | ❌ No                 | ✅ Sí                                                   |
| **Cálculos automáticos**       | ❌ No                 | ✅ Sí                                                   |
| **Estilos condicionales**      | ❌ No                 | ✅ Sí                                                   |
| **TanStack Table**             | ❌ No (HTML básico)   | ✅ Sí (sorting, filtering)                              |
| **Mantener en producción**     | ❌ No recomendado     | ✅ Sí                                                   |

---

## 🎯 Recomendación Final

### Si tienes reportes tipo `INGRESOS`:

1. **Hacer backup** de la base de datos
2. **Ejecutar script de diagnóstico** para ver qué reportes tienes
3. **Migrar reportes** a los tipos nuevos:
   - Auxiliar → `INGRESOS_AUXILIAR`
   - Mi Admin → `INGRESOS_MI_ADMIN`
4. **Verificar en la UI** que ahora ves las tablas editables
5. **Probar edición** de Estado SAT
6. **Eliminar tipo `INGRESOS`** del código si ya no lo usas

### Si NO tienes reportes tipo `INGRESOS`:

1. **Remover código viejo** (`ReporteViewer` fallback en `ReporteCard.tsx`)
2. **Remover tipo `INGRESOS`** del enum
3. **Simplificar tipos** a solo 2 opciones

---

## 🔍 Cómo Verificar Cuál Estás Usando

### Método Rápido en la UI:

1. Abre DevTools (F12)
2. Ve a la pestaña Console
3. Abre un reporte
4. Busca este log:

   ```
   🔍 ReporteCard - Tipo de reporte: INGRESOS_AUXILIAR
   ```

5. **Resultado:**
   - `INGRESOS` → ❌ Tabla vieja NO editable
   - `INGRESOS_AUXILIAR` → ✅ Tabla nueva editable
   - `INGRESOS_MI_ADMIN` → ✅ Tabla nueva editable

---

**Fecha:** 9 de octubre de 2025  
**Autor:** GitHub Copilot  
**Estado:** Análisis Completo
