# Feature: Importar Reporte Base Anual

## Descripción

Se mejoró la interfaz para importar el Reporte Base Anual, que es único para todo el proyecto. Ahora hay un botón dedicado y visible para esta funcionalidad.

## Cambios Realizados

### 1. Backend

El backend ya tenía implementado el endpoint de importación:

- **Endpoint**: `POST /trabajos/:id/reporte-base/importar`
- **Función**: Importa un archivo Excel con las hojas del reporte base anual
- **Validación**: Verifica que el archivo sea un Excel válido (.xlsx o .xls)

### 2. Frontend - Componente `ReporteAnualHeader.tsx`

#### Antes:

- Solo había un botón "Descargar Excel" que estaba deshabilitado si no había hojas
- No era claro cómo importar el reporte base

#### Ahora:

- **Botón "Importar Excel"** (verde): Siempre visible y activo

  - Abre el diálogo de importación
  - Cambia el texto a "Reimportar Excel" si ya hay hojas importadas
  - Icono de flecha hacia arriba para indicar subida de archivo

- **Botón "Ver Reporte"** (morado): Para ver el reporte anual completo

- **Botón "Descargar Excel"** (azul): Para descargar el reporte

  - Deshabilitado si no hay hojas importadas
  - Con tooltip explicativo

- **Mensaje de alerta**: Si no hay reporte base importado
  - Fondo amarillo con borde
  - Indica claramente que se debe importar el Excel
  - Explica que servirá como plantilla para todos los meses

### 3. Componente `TrabajoDetail.tsx`

- Se separó la lógica de importar y descargar
- Ahora `onImportarExcel` siempre abre el diálogo de importación
- `onDescargarExcel` solo se encarga de la descarga (en desarrollo)

### 4. Componente `ImportReporteBaseDialog.tsx`

Ya existía y funciona correctamente:

- Acepta archivos .xlsx y .xls
- Muestra el tamaño del archivo seleccionado
- Valida y muestra errores
- Llama al servicio de importación

## Flujo de Usuario

### Importar Reporte Base Anual:

1. Usuario entra al detalle de un trabajo
2. Ve el header "📊 Reporte Base Anual"
3. Si no hay reporte base, ve una alerta amarilla indicándolo
4. Hace clic en el botón verde "Importar Excel"
5. Se abre un diálogo modal para seleccionar el archivo
6. Selecciona el archivo Excel del reporte base
7. Hace clic en "Importar"
8. El sistema procesa el archivo y lo almacena
9. Se muestra un mensaje de éxito
10. El diálogo se cierra y la interfaz se actualiza
11. El botón ahora dice "Reimportar Excel"
12. El botón "Descargar Excel" se habilita

### Reimportar (Actualizar) Reporte Base:

1. Si ya existe un reporte base importado
2. El usuario puede hacer clic en "Reimportar Excel"
3. El proceso es el mismo que la importación inicial
4. El nuevo archivo reemplaza el anterior

## Archivos Modificados

- `frontend/src/components/trabajos/ReporteAnualHeader.tsx`
- `frontend/src/components/trabajos/TrabajoDetail.tsx`

## Archivos Existentes Utilizados

- `frontend/src/components/trabajos/ImportReporteBaseDialog.tsx`
- `frontend/src/services/trabajos.service.ts`
- `backend/src/trabajos/services/trabajos.service.ts`
- `backend/src/trabajos/controllers/trabajos.controller.ts`

## Estructura del Reporte Base Anual

El reporte base anual es un Excel que contiene:

- Múltiples hojas (sheets)
- Cada hoja tiene datos en formato tabular
- Se almacena en la entidad `ReporteBaseAnual` con estructura JSONB:
  ```typescript
  {
    hojas: [
      {
        nombre: "Hoja 1",
        datos: [[...], [...], ...]  // Array de arrays (filas y columnas)
      },
      {
        nombre: "Hoja 2",
        datos: [[...], [...], ...]
      }
    ]
  }
  ```

## Ejemplo de Uso

### Archivo Excel Típico:

- **Hoja 1**: "Resumen Anual" - Datos consolidados del año
- **Hoja 2**: "Ingresos Consolidados" - Todos los ingresos del año
- **Hoja 3**: "Comparativas" - Comparaciones mensuales

### Validaciones:

- ✅ Archivo debe ser .xlsx o .xls
- ✅ Debe tener al menos una hoja
- ✅ El sistema lee todas las hojas automáticamente
- ✅ Los datos se almacenan como JSON en PostgreSQL

## Testing

### Probar la Importación:

1. Crear un trabajo nuevo
2. Verificar que aparece el mensaje de alerta (fondo amarillo)
3. Click en "Importar Excel"
4. Seleccionar un archivo Excel válido
5. Verificar que se importa correctamente
6. Verificar que el mensaje de alerta desaparece
7. Verificar que el botón dice "Reimportar Excel"
8. Verificar que "Descargar Excel" se habilita

### Probar la Reimportación:

1. Con un trabajo que ya tiene reporte base
2. Click en "Reimportar Excel"
3. Seleccionar un archivo diferente
4. Verificar que se actualiza correctamente

## Notas Técnicas

- El reporte base es **único por trabajo** (relación OneToOne)
- Se puede reimportar las veces que sea necesario
- Al reimportar, se reemplaza completamente el anterior
- Los meses pueden usar este reporte base como plantilla
- El campo `mesesCompletados` rastrea qué meses ya fueron procesados

## Próximas Mejoras Sugeridas

- [ ] Implementar la funcionalidad de descarga de Excel
- [ ] Mostrar preview de las hojas importadas
- [ ] Permitir ver los datos del reporte base sin tener que ir al reporte anual
- [ ] Agregar validaciones más específicas del contenido del Excel
- [ ] Permitir editar el reporte base después de importarlo
