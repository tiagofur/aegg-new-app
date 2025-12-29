# 📊 Análisis: Botón "Guardar en Base" - MI Admin

**Fecha:** 23 de Octubre, 2025  
**Estado:** ⚠️ NO IMPLEMENTADO CORRECTAMENTE

---

## 🎯 Requisito del Usuario

Cuando el usuario está en un trabajo en **"Reporte MI Admin"** y presiona el botón **"Guardar en Base"**, el sistema debe:

1. ✅ Tomar el **Subtotal MXN** del Reporte MI Admin
2. ❌ Guardarlo en el **Reporte Base Anual** (Excel en JSONB)
3. ❌ Específicamente en:
   - **Fila:** `( = ) Ventas`
   - **Columna:** El mes que se está importando/editando (ENERO, FEBRERO, MARZO, etc.)

---

## 🔍 Análisis del Sistema Actual

### 1️⃣ **¿Qué hace el botón actualmente?**

El botón "Guardar en Base" se encuentra en:

```
frontend/src/features/trabajos/reportes/reporte-anual/components/GuardarEnBaseButton.tsx
```

**Flujo actual:**

```typescript
// 1. Frontend: GuardarEnBaseButton.tsx
actualizarVentas({
  anio,
  mes,
  ventas: totalMiAdmin,        // Subtotal MXN de Mi Admin
  ventasAuxiliar: totalAuxiliar // Subtotal MXN del Auxiliar
});

// 2. Service: reporte-anual.service.ts
POST /trabajos/:trabajoId/reporte-anual/actualizar-ventas
Body: { anio, mes, ventas, ventasAuxiliar }

// 3. Backend: reporte-anual.service.ts
async actualizarVentas(dto: ActualizarVentasDto): Promise<ReporteAnual> {
  const diferencia = Math.abs(ventas - ventasAuxiliar);
  const confirmado = diferencia < 0.1;

  // Guarda o actualiza en tabla 'reportes_anuales'
  reporte = {
    trabajoId,
    anio,
    mes,
    ventas,
    ventasAuxiliar,
    diferencia,
    confirmado
  };

  return this.reporteAnualRepository.save(reporte);
}
```

**Tabla de destino:** `reportes_anuales`

### 2️⃣ **¿Dónde guarda los datos?**

#### ❌ **NO guarda en:** `reportes_base_anual`

```sql
-- Tabla donde DEBERÍA guardar
CREATE TABLE reportes_base_anual (
    id UUID PRIMARY KEY,
    trabajo_id UUID NOT NULL UNIQUE,
    archivo_url TEXT,
    meses_completados INTEGER[],
    hojas JSONB,  -- <-- Aquí está el Excel con las hojas
    fecha_creacion TIMESTAMP,
    ultima_actualizacion TIMESTAMP
);
```

#### ✅ **SÍ guarda en:** `reportes_anuales`

```sql
-- Tabla donde REALMENTE guarda
CREATE TABLE reportes_anuales (
    id UUID PRIMARY KEY,
    trabajo_id UUID NOT NULL,
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    ventas DECIMAL(15,2),           -- Subtotal Mi Admin
    ventas_auxiliar DECIMAL(15,2),  -- Subtotal Auxiliar
    diferencia DECIMAL(15,2),       -- |ventas - ventasAuxiliar|
    confirmado BOOLEAN,             -- diferencia < 0.10
    fecha_creacion TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    CONSTRAINT unique_trabajo_anio_mes UNIQUE (trabajo_id, anio, mes)
);
```

**Propósito de esta tabla:**

- Vista de resumen anual (comparación Mi Admin vs Auxiliar)
- 12 registros por año (uno por mes)
- Se muestra en el componente `ReporteAnualTable.tsx`

---

## 🚨 Problema Identificado

### ❌ **El botón NO hace lo que el usuario necesita**

**Situación actual:**

- El botón guarda en una tabla de **resumen/comparación** (`reportes_anuales`)
- **NO modifica** el Excel del Reporte Base Anual (`reportes_base_anual.hojas`)

**Lo que el usuario necesita:**

- Modificar directamente el **Excel importado** (en el campo JSONB `hojas`)
- Buscar la fila `( = ) Ventas`
- Buscar la columna del mes correspondiente (ENERO, FEBRERO, etc.)
- Actualizar la celda en esa intersección con el Subtotal MXN

---

## 🔧 Sistema Antiguo (frontend-old)

En el código antiguo (`frontend-old`), **SÍ existía** esta funcionalidad:

```typescript
// frontend-old/src/features/reporte/context/ReportComparisonContext.tsx
const saveToPlantillaBase = useCallback(
  async (subtotalMXN: number, selectedMonth: number): Promise<boolean> => {
    try {
      // 1. Obtener la Plantilla Base (hoja 0)
      const plantillaData = workbookService.getAllData()[0];

      // 2. Buscar la fila "Ventas"
      const ventasRowIndex = plantillaData.findIndex(
        (row) => normalize(row[1]) === "ventas" // Columna "CONCEPTO"
      );

      // 3. Buscar la columna del mes
      const monthColumnIndex = headerRow.findIndex(
        (cell) => normalize(cell) === normalize(monthNames[selectedMonth])
      );

      // 4. Actualizar la celda
      plantillaData[ventasRowIndex][monthColumnIndex] = subtotalMXN;

      // 5. Guardar cambios en workbookService
      workbookService.updateSheet(0, plantillaData);

      return true;
    } catch (error) {
      console.error("Error al guardar en Plantilla Base:", error);
      return false;
    }
  },
  [selectedMonth]
);
```

**Este código:**

- ✅ Modificaba directamente el Excel en memoria
- ✅ Buscaba la fila "Ventas"
- ✅ Buscaba la columna del mes
- ✅ Actualizaba la celda
- ❌ **NO persistía en base de datos** (solo en memoria del navegador)

---

## 📋 Plan de Implementación (NO EJECUTAR AÚN)

Para implementar correctamente la funcionalidad:

### Backend (Nuevo endpoint)

```typescript
// backend/src/trabajos/services/reporte-base-anual.service.ts

async actualizarVentasMensuales(
  trabajoId: string,
  mes: number,
  ventas: number
): Promise<ReporteBaseAnual> {

  // 1. Obtener el Reporte Base Anual
  const reporte = await this.reporteBaseAnualRepository.findOne({
    where: { trabajoId }
  });

  if (!reporte) {
    throw new NotFoundException('Reporte Base Anual no encontrado');
  }

  // 2. Buscar la hoja 0 (Plantilla Base)
  const hojas = reporte.hojas;
  const hoja0 = hojas[0];

  if (!hoja0 || !hoja0.datos) {
    throw new BadRequestException('Hoja 0 no encontrada');
  }

  // 3. Buscar la fila "Ventas"
  const ventasRowIndex = hoja0.datos.findIndex((row: any[]) => {
    const concepto = row[1]; // Columna CONCEPTO
    return concepto &&
           concepto.toString().toLowerCase().includes('ventas');
  });

  if (ventasRowIndex === -1) {
    throw new BadRequestException('Fila "Ventas" no encontrada');
  }

  // 4. Buscar la columna del mes (ENERO, FEBRERO, etc.)
  const headerRow = hoja0.datos[0]; // Primera fila con headers
  const mesesNombres = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  const mesNombre = mesesNombres[mes - 1];
  const mesColumnIndex = headerRow.findIndex((cell: any) => {
    return cell &&
           cell.toString().toUpperCase().trim() === mesNombre;
  });

  if (mesColumnIndex === -1) {
    throw new BadRequestException(`Columna "${mesNombre}" no encontrada`);
  }

  // 5. Actualizar la celda
  hoja0.datos[ventasRowIndex][mesColumnIndex] = ventas;

  // 6. Guardar cambios
  reporte.hojas = hojas;
  reporte.ultimaActualizacion = new Date();

  return this.reporteBaseAnualRepository.save(reporte);
}
```

### Frontend (Actualizar GuardarEnBaseButton)

```typescript
// frontend/src/features/trabajos/reportes/reporte-anual/components/GuardarEnBaseButton.tsx

const handleConfirm = () => {
  if (totalAuxiliar === null) {
    return;
  }

  // 1. Guardar en tabla reportes_anuales (vista de resumen)
  actualizarVentas({
    anio,
    mes,
    ventas: totalMiAdmin,
    ventasAuxiliar: totalAuxiliar,
  });

  // 2. 🆕 NUEVO: Actualizar el Excel en reportes_base_anual
  actualizarVentasEnExcel({
    trabajoId,
    mes,
    ventas: totalMiAdmin,
  });
};
```

---

## ✅ Conclusiones

### Estado Actual:

- ❌ El botón "Guardar en Base" **NO guarda en el Reporte Base Anual (Excel)**
- ✅ Sí guarda en una tabla de resumen (`reportes_anuales`) para la vista de comparación
- ⚠️ El sistema antiguo tenía la lógica, pero no persistía en base de datos

### Para cumplir el requisito:

1. Crear endpoint en backend: `POST /trabajos/:trabajoId/reporte-base-anual/actualizar-ventas-mes`
2. Implementar lógica para buscar fila "Ventas" y columna del mes
3. Actualizar el JSONB `hojas` en `reportes_base_anual`
4. Modificar el frontend para llamar ambos endpoints:
   - Guardar en `reportes_anuales` (vista de resumen)
   - Guardar en `reportes_base_anual` (Excel)

### Archivos a modificar:

- `backend/src/trabajos/services/reporte-base-anual.service.ts`
- `backend/src/trabajos/controllers/reporte-base-anual.controller.ts`
- `frontend/src/services/reporte-base-anual.service.ts`
- `frontend/src/features/trabajos/reportes/reporte-anual/hooks/useReporteBaseAnualUpdate.ts`
- `frontend/src/features/trabajos/reportes/reporte-anual/components/GuardarEnBaseButton.tsx`

---

## 🎯 Próximos Pasos

**El usuario solicitó:**

> "de momento no modifique nada, solo revisa y planea"

✅ **Análisis completado**  
⏸️ **Esperando confirmación del usuario para proceder con la implementación**
