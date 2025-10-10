# Implementación: Llenar Estado SAT con "Vigente" al Importar

**Fecha**: 9 de octubre de 2025  
**Estado**: ✅ **IMPLEMENTADO**

---

## 📋 Requerimiento

Al importar un reporte Excel, si la columna **"Estado SAT"** o **"Estatus SAT"** está vacía, debe llenarse automáticamente con el valor **"Vigente"**. Si ya tiene un valor (como "Cancelada" o "Vigente"), debe mantenerse tal cual.

---

## 🔧 Cambios Implementados

### Archivo Modificado

**`backend/src/trabajos/services/reportes-mensuales.service.ts`**

### 1. Función `procesarExcel` - Línea 111

Se agregó la llamada a `llenarEstadoSat` después de la limpieza de datos:

```typescript
private procesarExcel(workbook: XLSX.WorkBook, tipo: TipoReporteMensual): any[] {
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    let datos = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`📊 Procesando reporte tipo: ${tipo}`);
    console.log(`📄 Total de filas originales: ${datos.length}`);

    // Limpiar filas innecesarias antes del header real
    datos = this.limpiarFilasInnecesarias(datos);

    // Limpiar filas vacías al final
    datos = this.limpiarFilasVacias(datos);

    // ✅ NUEVO: Llenar Estado SAT con "Vigente" cuando esté vacío
    datos = this.llenarEstadoSat(datos);

    console.log(`✅ Total de filas después de limpieza: ${datos.length}`);

    return datos;
}
```

### 2. Nueva Función `llenarEstadoSat`

```typescript
/**
 * Llena la columna de Estado SAT / Estatus SAT con "Vigente" cuando esté vacía.
 * Detecta la columna automáticamente por nombre (case-insensitive).
 * Mantiene el valor si ya existe ("Vigente", "Cancelada", "Cancelado", etc.)
 */
private llenarEstadoSat(datos: any[]): any[] {
    if (!Array.isArray(datos) || datos.length < 2) {
        return datos;
    }

    // Obtener la fila de headers (primera fila)
    const headers = datos[0];
    if (!Array.isArray(headers)) {
        return datos;
    }

    // Buscar la columna de Estado SAT o Estatus SAT (case-insensitive)
    const estadoSatIndex = headers.findIndex((header) => {
        if (!header || typeof header !== 'string') return false;
        const headerLower = header.toLowerCase().trim();
        return (
            headerLower.includes('estado') && headerLower.includes('sat') ||
            headerLower.includes('estatus') && headerLower.includes('sat') ||
            headerLower === 'estado sat' ||
            headerLower === 'estatus sat' ||
            headerLower === 'estadosat' ||
            headerLower === 'estatussat'
        );
    });

    // Si no se encuentra la columna, no hacer nada
    if (estadoSatIndex === -1) {
        console.log('ℹ️  No se encontró columna de Estado SAT en el reporte');
        return datos;
    }

    console.log(`✓ Columna "Estado SAT" encontrada en posición ${estadoSatIndex + 1} (${headers[estadoSatIndex]})`);

    // Contador de celdas modificadas
    let celdasLlenadas = 0;

    // Recorrer todas las filas de datos (desde índice 1, saltando header)
    for (let i = 1; i < datos.length; i++) {
        const fila = datos[i];

        // Verificar que sea un array válido
        if (!Array.isArray(fila)) continue;

        // Asegurar que la fila tenga el tamaño suficiente
        while (fila.length <= estadoSatIndex) {
            fila.push(null);
        }

        // Obtener el valor actual de la celda
        const valorActual = fila[estadoSatIndex];

        // Si está vacío (null, undefined, '', o solo espacios), llenar con "Vigente"
        if (
            valorActual === null ||
            valorActual === undefined ||
            valorActual === '' ||
            (typeof valorActual === 'string' && valorActual.trim() === '')
        ) {
            fila[estadoSatIndex] = 'Vigente';
            celdasLlenadas++;
        }
        // Si ya tiene valor, mantenerlo (puede ser "Cancelada", "Vigente", etc.)
    }

    if (celdasLlenadas > 0) {
        console.log(`✓ Se llenaron ${celdasLlenadas} celda(s) de "Estado SAT" con valor "Vigente"`);
    } else {
        console.log('ℹ️  Todas las celdas de "Estado SAT" ya tenían valores');
    }

    return datos;
}
```

---

## 🎯 Funcionalidad

### Detección de la Columna

La función busca la columna de Estado SAT usando **múltiples variaciones del nombre** (case-insensitive):

- "Estado SAT"
- "Estatus SAT"
- "EstadoSAT"
- "EstatusSAT"
- "estado sat"
- "estatus sat"
- Cualquier columna que contenga "estado" + "sat"
- Cualquier columna que contenga "estatus" + "sat"

### Lógica de Llenado

```
Para cada fila de datos:
  ↓
  ¿La celda de Estado SAT está vacía?
  ├─ Sí (null, undefined, '', o espacios) → Llenar con "Vigente"
  └─ No (tiene valor) → Mantener el valor existente
```

### Valores Reconocidos

**Se mantienen sin cambios**:

- "Vigente"
- "Cancelada"
- "Cancelado"
- "VIGENTE"
- "CANCELADA"
- Cualquier otro valor existente

**Se llenan con "Vigente"**:

- `null`
- `undefined`
- `""` (cadena vacía)
- `"   "` (solo espacios)

---

## 📊 Ejemplos de Uso

### Caso 1: Excel con columna "Estado SAT" vacía

**Excel importado**:

```
| UUID | Folio  | Subtotal | Estado SAT |
|------|--------|----------|------------|
| AAA  | F4473  | 1000     |            |
| BBB  | F4474  | 2000     |            |
| CCC  | F4475  | 3000     |            |
```

**Después de procesar**:

```
| UUID | Folio  | Subtotal | Estado SAT |
|------|--------|----------|------------|
| AAA  | F4473  | 1000     | Vigente    |  ← Llenado
| BBB  | F4474  | 2000     | Vigente    |  ← Llenado
| CCC  | F4475  | 3000     | Vigente    |  ← Llenado
```

**Logs en consola**:

```
✓ Columna "Estado SAT" encontrada en posición 4 (Estado SAT)
✓ Se llenaron 3 celda(s) de "Estado SAT" con valor "Vigente"
```

---

### Caso 2: Excel con valores mixtos

**Excel importado**:

```
| UUID | Folio  | Subtotal | Estado SAT |
|------|--------|----------|------------|
| AAA  | F4473  | 1000     | Vigente    |
| BBB  | F4474  | 2000     |            |
| CCC  | F4475  | 3000     | Cancelada  |
| DDD  | F4476  | 4000     |            |
```

**Después de procesar**:

```
| UUID | Folio  | Subtotal | Estado SAT |
|------|--------|----------|------------|
| AAA  | F4473  | 1000     | Vigente    |  ← Mantenido
| BBB  | F4474  | 2000     | Vigente    |  ← Llenado
| CCC  | F4475  | 3000     | Cancelada  |  ← Mantenido
| DDD  | F4476  | 4000     | Vigente    |  ← Llenado
```

**Logs en consola**:

```
✓ Columna "Estado SAT" encontrada en posición 4 (Estado SAT)
✓ Se llenaron 2 celda(s) de "Estado SAT" con valor "Vigente"
```

---

### Caso 3: Excel sin columna "Estado SAT"

**Excel importado**:

```
| UUID | Folio  | Subtotal | Moneda |
|------|--------|----------|--------|
| AAA  | F4473  | 1000     | MXN    |
| BBB  | F4474  | 2000     | USD    |
```

**Después de procesar**:

```
| UUID | Folio  | Subtotal | Moneda |
|------|--------|----------|--------|
| AAA  | F4473  | 1000     | MXN    |
| BBB  | F4474  | 2000     | USD    |
```

**Logs en consola**:

```
ℹ️  No se encontró columna de Estado SAT en el reporte
```

---

### Caso 4: Excel con todas las celdas llenas

**Excel importado**:

```
| UUID | Folio  | Subtotal | Estado SAT |
|------|--------|----------|------------|
| AAA  | F4473  | 1000     | Vigente    |
| BBB  | F4474  | 2000     | Vigente    |
| CCC  | F4475  | 3000     | Cancelada  |
```

**Después de procesar**:

```
| UUID | Folio  | Subtotal | Estado SAT |
|------|--------|----------|------------|
| AAA  | F4473  | 1000     | Vigente    |  ← Sin cambios
| BBB  | F4474  | 2000     | Vigente    |  ← Sin cambios
| CCC  | F4475  | 3000     | Cancelada  |  ← Sin cambios
```

**Logs en consola**:

```
✓ Columna "Estado SAT" encontrada en posición 4 (Estado SAT)
ℹ️  Todas las celdas de "Estado SAT" ya tenían valores
```

---

## 🔍 Características Técnicas

### Detección Robusta

- ✅ Case-insensitive (mayúsculas/minúsculas)
- ✅ Maneja variaciones: "Estado SAT", "Estatus SAT", etc.
- ✅ Detecta columnas con o sin espacios
- ✅ No falla si la columna no existe

### Seguridad

- ✅ Valida que los datos sean un array
- ✅ Valida cada fila antes de procesarla
- ✅ Extiende las filas si son más cortas que el índice
- ✅ No modifica valores existentes

### Logging

- ✅ Informa si encuentra la columna y en qué posición
- ✅ Cuenta cuántas celdas fueron modificadas
- ✅ Informa si no hay columna de Estado SAT
- ✅ Informa si todas las celdas ya tenían valores

---

## ✅ Flujo Completo de Importación

```
1. Usuario sube archivo Excel
   ↓
2. Backend lee el archivo con XLSX
   ↓
3. Convierte a array bidimensional
   ↓
4. Limpia filas innecesarias antes del header
   ↓
5. Limpia filas vacías al final
   ↓
6. ✅ NUEVO: Llena "Estado SAT" con "Vigente" si está vacío
   ↓
7. Guarda datos en base de datos
   ↓
8. Frontend muestra datos tal cual (con Estado SAT lleno)
```

---

## 🚀 Cómo Probar

### 1. Reiniciar el Backend

```powershell
# En la terminal de backend
cd backend
npm run start:dev
```

### 2. Importar un Excel

1. Ir a un trabajo existente
2. Seleccionar un mes
3. Importar un reporte (cualquier tipo)
4. Verificar que tenga una columna "Estado SAT" o "Estatus SAT"

### 3. Verificar en la Consola del Backend

Deberías ver logs como:

```
📊 Procesando reporte tipo: INGRESOS_MI_ADMIN
📄 Total de filas originales: 45
✓ Header detectado en fila 1
✓ Columna "Estado SAT" encontrada en posición 2 (Estado SAT)
✓ Se llenaron 20 celda(s) de "Estado SAT" con valor "Vigente"
✅ Total de filas después de limpieza: 44
```

### 4. Verificar en el Frontend

1. Hacer clic en "Ver Datos" del reporte importado
2. Buscar la columna "Estado SAT"
3. Verificar que todas las celdas tengan valores
4. Las celdas que estaban vacías deben mostrar "Vigente"

---

## 📝 Notas Importantes

1. **Solo afecta la importación**: Esta función se ejecuta **solo al importar** un nuevo Excel. Los reportes ya importados no se modificarán.

2. **No requiere re-importar**: Si ya tienes reportes importados y quieres aplicar este cambio, necesitas:

   - Eliminar el reporte (botón de limpiar)
   - Volver a importar el Excel

3. **Datos en crudo**: El Excel se muestra tal cual viene, esta función solo garantiza que "Estado SAT" no esté vacío.

4. **Compatible con edición**: Después de importar, el usuario puede editar el "Estado SAT" desde el componente editable en el frontend.

---

## 👤 Autor

**GitHub Copilot**  
Fecha: 9 de octubre de 2025

## ✅ Estado

**IMPLEMENTADO Y LISTO PARA USAR**

Para aplicar los cambios:

1. Guardar el archivo modificado
2. Reiniciar el backend
3. Importar un nuevo reporte y verificar
