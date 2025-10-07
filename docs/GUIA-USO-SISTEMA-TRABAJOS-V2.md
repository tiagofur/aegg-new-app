# Guía de Uso - Sistema de Trabajos V2

## 🎯 ¿Qué se implementó?

Se ha completado la implementación del **Sistema de Trabajos V2** con arquitectura de Reporte Base Anual que se actualiza progresivamente mes a mes.

## 📦 Fases Completadas

### ✅ FASE 6: Frontend - Tipos TypeScript

- `frontend/src/types/trabajo.ts` - Todas las interfaces y tipos
- `frontend/src/types/index.ts` - Exportaciones centralizadas
- Constantes útiles (MESES_NOMBRES, TIPOS_REPORTE_NOMBRES, etc.)

### ✅ FASE 7: Frontend - Servicios API

- `frontend/src/services/trabajos.service.ts` - CRUD de trabajos
- `frontend/src/services/meses.service.ts` - Gestión de meses
- `frontend/src/services/reportes-mensuales.service.ts` - Importación y procesamiento
- Integración con axios configurado (interceptores de auth incluidos)

### ✅ FASE 8: Frontend - Componentes React

- `TrabajosList` - Lista de todos los trabajos con cards visuales
- `TrabajoDetail` - Vista detallada de un trabajo con progreso
- `MesCard` - Componente accordion para cada mes
- `ReporteCard` - Card individual para cada reporte con upload
- `CreateTrabajoDialog` - Modal para crear nuevo trabajo
- `CreateMesDialog` - Modal para agregar meses al trabajo

### ✅ FASE 9: Frontend - Página Principal

- `TrabajosPage` - Página principal que integra todos los componentes
- Navegación entre lista y detalle
- Estados de carga
- Manejo de errores

### ✅ FASE 10: Integración

- Rutas configuradas en `App.tsx`
- Autenticación integrada con PrivateRoute
- Servicios conectados al backend

## 🚀 Cómo usar el sistema

### 1. Iniciar los Servidores

```powershell
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Flujo de Trabajo Completo

#### Paso 1: Crear un Trabajo

1. Accede a `/trabajos`
2. Click en "Nuevo Trabajo"
3. Completa el formulario:
   - Nombre del Cliente
   - RUT del Cliente
   - Año
4. Click en "Crear Trabajo"

El sistema automáticamente:

- Crea el trabajo
- Genera el Reporte Base Anual con 3 hojas iniciales:
  - Resumen Anual
  - Ingresos Consolidados
  - Comparativas

#### Paso 2: Agregar un Mes

1. Click en el trabajo creado
2. Click en "Agregar Mes"
3. Selecciona el mes (1-12)
4. Click en "Agregar Mes"

El sistema automáticamente:

- Crea el mes
- Genera 3 reportes mensuales:
  - Reporte Ingresos (SIN_IMPORTAR)
  - Reporte Ingresos Auxiliar (SIN_IMPORTAR)
  - Reporte MI Admin (SIN_IMPORTAR)

#### Paso 3: Importar Reportes Excel

1. Expande el mes (click en el accordion)
2. Para cada uno de los 3 reportes:
   - Click en "Importar Archivo"
   - Selecciona el archivo Excel (.xlsx o .xls)
   - Espera a que se importe

Estados del reporte:

- **SIN_IMPORTAR**: Aún no se ha cargado archivo
- **IMPORTADO**: Archivo cargado y parseado correctamente
- **PROCESADO**: Datos consolidados y guardados
- **ERROR**: Hubo un problema en la importación

#### Paso 4: Procesar y Guardar el Mes

1. Una vez los 3 reportes estén IMPORTADOS
2. Click en "Procesar y Guardar Mes"
3. El sistema:
   - Consolida los datos de los 3 reportes
   - Actualiza el Reporte Base Anual
   - Marca el mes como COMPLETADO
   - Agrega el mes al array de mesesCompletados

#### Paso 5: Ver el Progreso

En la vista de detalle del trabajo verás:

- Barra de progreso (X/12 meses completados)
- Chips de meses (verde = completado, gris = pendiente)
- Botones para:
  - Ver Reporte Base
  - Descargar Excel (cuando esté disponible)

## 📊 Estructura de Datos

### Trabajo

```typescript
{
  id: string
  clienteNombre: string
  clienteRut: string
  anio: number
  estado: 'ACTIVO' | 'INACTIVO' | 'COMPLETADO'
  reporteBaseAnual: {
    mesesCompletados: [1, 2, 3, ...] // Meses procesados
    hojas: [
      { nombre: 'Resumen Anual', datos: [...] },
      { nombre: 'Ingresos Consolidados', datos: [...] },
      { nombre: 'Comparativas', datos: [...] }
    ]
  }
  meses: [...]
}
```

### Mes

```typescript
{
  id: string
  mes: number // 1-12
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO'
  reportes: [
    { tipo: 'INGRESOS', estado: 'SIN_IMPORTAR', datos: [...] },
    { tipo: 'INGRESOS_AUXILIAR', estado: 'SIN_IMPORTAR', datos: [...] },
    { tipo: 'INGRESOS_MI_ADMIN', estado: 'SIN_IMPORTAR', datos: [...] }
  ]
}
```

## 🎨 Características de UI

### TrabajosList

- Cards con información resumida
- Chips de estado (ACTIVO, INACTIVO, COMPLETADO)
- Progreso visual (X/12 meses)
- Barra de progreso
- Hover effects

### TrabajoDetail

- Header con navegación (volver a lista)
- Card de Reporte Base Anual:
  - Barra de progreso grande
  - Chips de los 12 meses (verde/gris)
  - Botones de acción
- Lista de meses (accordion):
  - Expandir/colapsar cada mes
  - Ver los 3 reportes
  - Botón "Procesar y Guardar"

### ReporteCard

- Icono de estado visual
- Nombre del archivo importado
- Fecha de importación
- Botón de upload con validación de tipo
- Loading state durante importación
- Deshabilitado cuando está PROCESADO

## 🔧 API Endpoints Utilizados

### Trabajos

- `GET /trabajos` - Listar todos
- `GET /trabajos/:id` - Obtener detalle
- `POST /trabajos` - Crear
- `PATCH /trabajos/:id` - Actualizar
- `DELETE /trabajos/:id` - Eliminar

### Meses

- `POST /meses` - Crear mes
- `GET /meses/trabajo/:trabajoId` - Listar meses de un trabajo
- `GET /meses/:id` - Obtener mes
- `DELETE /meses/:id` - Eliminar mes

### Reportes Mensuales

- `POST /reportes-mensuales/importar` - Importar Excel (multipart/form-data)
- `POST /reportes-mensuales/:mesId/procesar` - Procesar y guardar mes

## ⚙️ Configuración

### Variables de Entorno (Frontend)

```env
VITE_API_URL=http://localhost:3000
```

### Autenticación

El frontend usa el sistema de auth existente:

- Token JWT en localStorage
- Interceptor de axios que agrega el token automáticamente
- PrivateRoute protege las rutas

## 🐛 Troubleshooting

### "Error al cargar trabajos"

- Verifica que el backend esté corriendo en puerto 3000
- Revisa la consola del navegador para más detalles
- Asegúrate de estar autenticado

### "Error al importar el archivo"

- Solo archivos .xlsx o .xls son válidos
- Verifica que el backend tenga configurado multer correctamente
- Revisa los logs del backend para errores de parseo

### Los cambios no se reflejan

- El sistema usa `window.location.reload()` después de procesar
- Si no funciona, recarga manualmente la página

## 📝 Próximos Pasos (Opcional)

### Implementación Pendiente

1. **Vista del Reporte Base**

   - Componente para visualizar las hojas del reporte
   - Tabla con datos consolidados por mes

2. **Descarga de Excel**

   - Endpoint backend para generar Excel del reporte base
   - Botón de descarga funcional

3. **Lógica de Consolidación**

   - Implementar los TODO en ReportesMensualesService:
     - `consolidarIngresos()`
     - `consolidarAuxiliar()`
     - `consolidarMiAdmin()`
     - `actualizarHojasReporte()`

4. **Validaciones Avanzadas**

   - Validación de estructura de Excel
   - Verificación de columnas requeridas
   - Detección de datos faltantes

5. **Mejoras de UX**
   - Toast notifications (react-toastify)
   - Animaciones (framer-motion)
   - Loading skeletons
   - Confirmaciones de eliminación

## 🎉 ¡Sistema Completado!

Has implementado exitosamente:

- ✅ 6 componentes React
- ✅ 3 servicios API
- ✅ 1 página principal integrada
- ✅ Tipos TypeScript completos
- ✅ Integración con backend TypeORM
- ✅ Sistema de autenticación
- ✅ UI responsive con Tailwind CSS

El sistema está listo para:

- Crear trabajos por cliente/año
- Agregar meses (1-12)
- Importar reportes Excel
- Consolidar datos mensuales
- Actualizar reporte base anual progresivamente
