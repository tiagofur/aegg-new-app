# 📊 Column Parser - Utilidades de Parsing Flexible

Sistema robusto y flexible para detectar columnas en reportes de Excel con múltiples variaciones de nombres, espacios, mayúsculas y acentos.

## 🎯 Características

- ✅ **Búsqueda Dinámica de Headers**: Encuentra automáticamente la fila de headers (útil cuando hay títulos o metadatos antes)
- ✅ **Normalización de Headers**: Remueve espacios, mayúsculas, acentos y caracteres especiales
- ✅ **Keywords Múltiples**: Detecta múltiples variaciones del mismo campo
- ✅ **Validación de Columnas**: Valida columnas obligatorias antes de procesar
- ✅ **Parsing Inteligente**: Funciones especializadas para fechas, montos, monedas y TC
- ✅ **Mensajes Claros**: Errores detallados indicando qué columnas faltan
- ✅ **Type-Safe**: Totalmente tipado con TypeScript

## 📦 Uso Básico

### Importar Utilidades

```typescript
import {
  findHeaderRow,
  normalizeHeader,
  findColumnIndex,
  COLUMN_KEYWORDS,
  validateRequiredColumns,
  parseTipoCambio,
  parseFecha,
  parseAmount,
  parseMoneda,
} from "./column-parser";
```

### Ejemplo: Parsing de Auxiliar de Ingresos

```typescript
export const parseExcelToAuxiliarIngresos = (excelData: any[][]) => {
  // 0. Buscar fila del header dinámicamente (primera con 8+ columnas)
  const headerRowIndex = findHeaderRow(excelData, 8);
  if (headerRowIndex === -1) {
    throw new Error("No se encontró la fila de headers en el Excel");
  }

  const headers = excelData[headerRowIndex];
  const dataStartRow = headerRowIndex + 1;

  console.log(`Headers encontrados en fila ${headerRowIndex + 1}:`, headers);

  // 1. Definir columnas obligatorias
  const requiredColumns = {
    UUID: COLUMN_KEYWORDS.UUID,
    Subtotal: COLUMN_KEYWORDS.SUBTOTAL,
    Moneda: COLUMN_KEYWORDS.MONEDA,
    "Tipo Cambio": COLUMN_KEYWORDS.TIPO_CAMBIO,
  };

  // 2. Validar columnas
  const { missing, found, normalized } = validateRequiredColumns(
    headers,
    requiredColumns
  );

  // 3. Verificar si hay columnas faltantes
  if (missing.length > 0) {
    throw new Error(
      `Columnas obligatorias faltantes:\n` +
        `${missing.map((col) => `  • ${col}`).join("\n")}\n\n` +
        `Headers detectados:\n` +
        `${headers.map((h, i) => `  ${i + 1}. ${h}`).join("\n")}`
    );
  }

  // 4. Obtener índices
  const uuidIndex = found["UUID"];
  const subtotalIndex = found["Subtotal"];
  const monedaIndex = found["Moneda"];
  const tipoCambioIndex = found["Tipo Cambio"];

  // 5. Parsear filas (desde dataStartRow)
  const rows = [];
  for (let i = dataStartRow; i < excelData.length; i++) {
    const row = excelData[i];

    const moneda = parseMoneda(row[monedaIndex]);
    const tipoCambio = parseTipoCambio(row[tipoCambioIndex], moneda);
    const subtotal = parseAmount(row[subtotalIndex]);

    rows.push({
      uuid: row[uuidIndex],
      subtotal,
      moneda,
      tipoCambio,
    });
  }

  return rows;
};
```

## 🔑 Keywords Disponibles

### Identificadores

- `COLUMN_KEYWORDS.UUID` - UUID, Folio Fiscal, Folio Timbrado
- `COLUMN_KEYWORDS.FOLIO` - Folio, UUID, Número de Factura
- `COLUMN_KEYWORDS.SERIE` - Serie

### Fechas

- `COLUMN_KEYWORDS.FECHA` - Fecha, Fecha Timbrado, Fecha Expedición, Fecha Emisión

### Partes

- `COLUMN_KEYWORDS.RFC` - RFC, RFC Receptor
- `COLUMN_KEYWORDS.RFC_EMISOR` - RFC Emisor
- `COLUMN_KEYWORDS.RAZON_SOCIAL` - Razón Social, Nombre Receptor
- `COLUMN_KEYWORDS.NOMBRE_EMISOR` - Nombre Emisor

### Montos

- `COLUMN_KEYWORDS.SUBTOTAL` - Subtotal, Subtotal Aux, Importe
- `COLUMN_KEYWORDS.DESCUENTO` - Descuento
- `COLUMN_KEYWORDS.TOTAL` - Total, Importe Total

### Impuestos

- `COLUMN_KEYWORDS.IVA` - IVA, Impuesto
- `COLUMN_KEYWORDS.IVA_16` - IVA 16, IVA 16%
- `COLUMN_KEYWORDS.IVA_8` - IVA 8, IVA 8%
- `COLUMN_KEYWORDS.IVA_RETENIDO` - IVA Retenido
- `COLUMN_KEYWORDS.ISR_RETENIDO` - ISR Retenido
- `COLUMN_KEYWORDS.TOTAL_TRASLADADOS` - Total Trasladados
- `COLUMN_KEYWORDS.TOTAL_RETENIDOS` - Total Retenidos

### Moneda y Tipo de Cambio

- `COLUMN_KEYWORDS.MONEDA` - Moneda, Currency
- `COLUMN_KEYWORDS.TIPO_CAMBIO` - Tipo Cambio, TipoCambio, TC

### Estado SAT

- `COLUMN_KEYWORDS.ESTADO_SAT` - Estado SAT, Estatus SAT, Status

## 📚 API Reference

### `findHeaderRow(excelData: any[][], minColumns?: number): number`

**🆕 Nueva función** - Encuentra dinámicamente la fila que contiene los headers reales.

Útil cuando el Excel tiene filas de título, subtítulos o metadatos antes del header real.

**Parámetros:**

- `excelData` - Array bidimensional del Excel
- `minColumns` - Número mínimo de columnas para considerar una fila como header (default: 8)

**Retorna:** Índice de la fila del header, o `-1` si no se encuentra

**Ejemplo:**

```typescript
// Excel con título en fila 0, header en fila 1
const data = [
  ["Reporte de Ingresos - Enero 2024"], // Fila 0: título (1 columna)
  ["", "Generado el 15/01/2024"], // Fila 1: metadato (2 columnas)
  ["UUID", "Fecha", "RFC", "Subtotal", "Moneda", ...], // Fila 2: header (10+ columnas)
  ["abc-123", "2024-01-15", "RFC001", 1000, "MXN", ...], // Fila 3: datos
];

const headerRowIndex = findHeaderRow(data); // Retorna: 2
const headers = data[headerRowIndex]; // ["UUID", "Fecha", "RFC", ...]
const dataStartRow = headerRowIndex + 1; // 3
```

**Comportamiento:**

- Recorre las filas del Excel desde arriba
- Cuenta columnas no vacías en cada fila
- La primera fila con ≥ `minColumns` columnas se considera el header
- Imprime en consola: `"📍 Header encontrado en fila X (N columnas)"`
- Si no encuentra: `"⚠️ No se encontró fila de header con al menos N columnas"`

**¿Cuándo usar?**

- ✅ Archivos Excel con títulos o metadatos antes del header
- ✅ Reportes exportados desde sistemas que agregan información adicional
- ✅ Cuando no sabes en qué fila está el header real

### `normalizeHeader(header: any): string`

Normaliza un header removiendo espacios, mayúsculas, acentos.

**Ejemplos:**

```typescript
normalizeHeader("Tipo Cambio"); // "tipocambio"
normalizeHeader("TipoCambio"); // "tipocambio"
normalizeHeader("Estatus Sat"); // "estatussat"
normalizeHeader("Estado SAT"); // "estadosat"
```

### `findColumnIndex(headers: string[], keywords: string[]): number`

Busca el índice de una columna usando múltiples keywords.

**Retorna:** Índice de la columna o `-1` si no se encuentra

### `validateRequiredColumns(headers: any[], requiredColumns: Record<string, string[]>): ColumnValidationResult`

Valida que todas las columnas obligatorias existan.

**Retorna:**

```typescript
{
    missing: string[],      // Columnas faltantes
    found: Record<string, number>,  // Columnas encontradas con índices
    normalized: string[]    // Headers normalizados
}
```

### `parseTipoCambio(value: any, moneda?: string): number`

Parsea un tipo de cambio. Detecta TCs sospechosos (1 o 0 en moneda extranjera).

**Retorna:** Tipo de cambio o `1` por defecto

### `parseFecha(value: any): string`

Parsea fechas desde Date, string o número serial de Excel.

**Retorna:** Fecha en formato `YYYY-MM-DD` o string vacío

### `parseAmount(value: any): number`

Parsea montos removiendo símbolos de moneda y comas.

**Retorna:** Número parseado o `0`

### `parseMoneda(value: any): string`

Normaliza códigos de moneda.

**Retorna:** Código estándar (`MXN`, `USD`, `EUR`, etc.)

## 🧪 Testing

### Headers con Variaciones

```typescript
// Estos headers se detectan como la misma columna:
"Tipo Cambio";
"TipoCambio";
"Tipo de Cambio";
"tipo_cambio";
"TIPO CAMBIO";
"TC";

// Todos se normalizan y detectan correctamente
```

### Validación de Columnas

```typescript
const headers = ["UUID", "Fecha", "RFC"];
const required = {
  UUID: COLUMN_KEYWORDS.UUID,
  Subtotal: COLUMN_KEYWORDS.SUBTOTAL, // ❌ Falta
};

const result = validateRequiredColumns(headers, required);
// result.missing = ["Subtotal"]
// result.found = { "UUID": 0 }
```

## 🔧 Extensión

Para agregar nuevos keywords:

```typescript
// En column-parser.ts
export const COLUMN_KEYWORDS = {
  // ...existing keywords...

  // Nuevo keyword
  MI_CAMPO: ["micampo", "mi campo", "mi_campo", "MiCampo"],
};
```

Luego úsalo en tu parser:

```typescript
const miCampoIndex = findColumnIndex(normalized, COLUMN_KEYWORDS.MI_CAMPO);
```

## 📝 Notas Importantes

### Tipo de Cambio en Mi Admin Ingresos

⚠️ **Bug Conocido:** Mi Admin Ingresos puede mostrar `TC = 1.0` para facturas en USD cuando el TC real es ~20.0.

**Solución:** Usar `parseTipoCambio()` que detecta este caso y permite corrección posterior usando datos del Auxiliar de Ingresos.

```typescript
let tc = parseTipoCambio(row[tcIndex], moneda);

// Si TC sospechoso y tenemos Auxiliar
if ((tc === 1 || tc === 0) && moneda !== "MXN" && auxiliarData) {
  const auxiliar = auxiliarData.find((a) => a.uuid === uuid);
  if (auxiliar && auxiliar.tipoCambio > 1) {
    console.warn(`⚠️ TC corregido: ${tc} → ${auxiliar.tipoCambio}`);
    tc = auxiliar.tipoCambio;
  }
}
```

## 🎓 Mejores Prácticas

1. **Siempre valida columnas obligatorias primero**

   ```typescript
   const { missing, found } = validateRequiredColumns(...);
   if (missing.length > 0) throw new Error(...);
   ```

2. **Usa las funciones de parsing especializadas**

   ```typescript
   const fecha = parseFecha(row[fechaIndex]);
   const monto = parseAmount(row[montoIndex]);
   const moneda = parseMoneda(row[monedaIndex]);
   ```

3. **Agrega logs de debug**

   ```typescript
   console.log("✅ Columnas detectadas:", found);
   console.log(`✅ ${rows.length} registros parseados`);
   ```

4. **Maneja errores claramente**
   ```typescript
   if (missing.length > 0) {
     throw new Error(
       `Columnas faltantes: ${missing.join(", ")}\n` +
         `Headers: ${headers.join(", ")}`
     );
   }
   ```

## 📊 Performance

- **Normalización:** O(n) donde n = número de headers
- **Validación:** O(m × n) donde m = columnas requeridas, n = headers
- **Memoria:** Keywords son constantes, no hay overhead por importación

## 🤝 Contribuir

Al agregar nuevos reportes:

1. Identifica los headers reales del Excel
2. Agrega keywords relevantes a `COLUMN_KEYWORDS`
3. Usa `validateRequiredColumns` para validación
4. Documenta casos especiales en el README

---

**Creado para:** FASE 8 - Mejora del Sistema de Parsing de Reportes  
**Versión:** 1.0  
**Fecha:** Octubre 2025
