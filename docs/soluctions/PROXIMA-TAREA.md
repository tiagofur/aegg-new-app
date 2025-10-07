# 📋 PRÓXIMA TAREA: FASE 4 - Visualización de Datos

**Estado actual:** FASE 3 completada ✅  
**Siguiente objetivo:** Mostrar los datos importados en tablas

---

## 🎯 OBJETIVO DE FASE 4

**Crear interfaz para visualizar los datos del Excel importado**

### Lo que el usuario podrá hacer:

1. ✅ Ver datos del Excel en tabla HTML
2. ✅ Navegar entre páginas (paginación)
3. ✅ Cambiar entre hojas (para tipo "mensual")
4. ✅ Ver estadísticas (total filas, columnas, etc.)
5. ✅ Buscar dentro de la tabla
6. ✅ Filtrar por columnas

---

## 🏗️ COMPONENTES A CREAR

### **1. DataTable.tsx**

**Ubicación:** `frontend/src/components/DataTable.tsx`

**Props:**

```typescript
interface DataTableProps {
  headers: string[];
  rows: any[][];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
}
```

**Funcionalidades:**

- Tabla HTML con headers fijos
- Scroll horizontal para muchas columnas
- Paginación en footer
- Loading state
- Empty state cuando no hay datos

---

### **2. SheetTabs.tsx**

**Ubicación:** `frontend/src/components/SheetTabs.tsx`

**Props:**

```typescript
interface SheetTabsProps {
  sheets: Array<{ nombre: string; totalFilas: number }>;
  activeSheet: string;
  onSheetChange: (sheetName: string) => void;
}
```

**Funcionalidades:**

- Tabs horizontales con nombre de hoja
- Badge con cantidad de filas
- Tab activo destacado
- Scroll horizontal si hay muchas hojas

---

### **3. DataViewer.tsx**

**Ubicación:** `frontend/src/components/DataViewer.tsx`

**Props:**

```typescript
interface DataViewerProps {
  trabajoId: string;
  reporteId: string;
  reporteTipo: string;
}
```

**Funcionalidades:**

- Contenedor principal
- Llama a APIs para obtener datos
- Maneja estado (loading, error, datos)
- Coordina SheetTabs y DataTable
- Muestra estadísticas (panel superior)

---

### **4. ReporteDetail.tsx** (Nueva Página)

**Ubicación:** `frontend/src/pages/ReporteDetail.tsx`

**Ruta:** `/trabajos/:trabajoId/reportes/:reporteId`

**Layout:**

```
┌─────────────────────────────────────────────┐
│ ← Volver | Nombre del Reporte              │
├─────────────────────────────────────────────┤
│ 📊 Estadísticas                             │
│ Total Filas: 450 | Columnas: 12            │
│ Hojas: 3        | Archivo: reporte.xlsx   │
├─────────────────────────────────────────────┤
│ [Tab: Balance] [Tab: Ingresos] [Tab: Gastos]│ ← Solo si multi-hoja
├─────────────────────────────────────────────┤
│                                             │
│          TABLA DE DATOS                     │
│                                             │
├─────────────────────────────────────────────┤
│ ← Anterior | Página 1 de 5 | Siguiente →   │
└─────────────────────────────────────────────┘
```

---

## 📡 ENDPOINTS A USAR (Ya disponibles)

### **1. Obtener Datos Paginados**

```typescript
GET /trabajos/:trabajoId/reportes/:id/datos

Query params:
- hoja?: string      // Para multi-sheet
- pagina?: number    // Default: 1
- limite?: number    // Default: 100

Response:
{
  hoja?: string,
  datos: {
    headers: string[],
    filas: any[][]
  },
  paginacion: {
    paginaActual: number,
    totalPaginas: number,
    limite: number,
    total: number
  }
}
```

### **2. Obtener Lista de Hojas**

```typescript
GET /trabajos/:trabajoId/reportes/:id/hojas

Response:
{
  hojas: [
    { nombre: "Balance", totalFilas: 150 },
    { nombre: "Ingresos", totalFilas: 200 }
  ]
}
```

### **3. Obtener Estadísticas**

```typescript
GET /trabajos/:trabajoId/reportes/:id/estadisticas

Query params:
- hoja?: string      // Para multi-sheet

Response:
{
  hoja?: string,
  totalFilas: number,
  totalColumnas: number,
  headers: string[],
  metadata: {
    tipoReporte: string,
    nombreArchivo: string,
    fechaImportacion: string
  }
}
```

---

## 🎨 DISEÑO UI SUGERIDO

### **Colores Tailwind:**

```css
- Header tabla: bg-gray-100 border-b-2 border-gray-300
- Filas pares: bg-white
- Filas impares: bg-gray-50
- Hover fila: bg-blue-50
- Tab activo: bg-blue-600 text-white
- Tab inactivo: bg-gray-200 text-gray-700
- Paginación: buttons azules
```

### **Componentes Lucide:**

```typescript
import {
  Table, // Icono tabla
  FileText, // Icono reporte
  ArrowLeft, // Volver
  ChevronLeft, // Página anterior
  ChevronRight, // Página siguiente
  Search, // Búsqueda
  Filter, // Filtros
  Download, // Exportar
  BarChart3, // Estadísticas
} from "lucide-react";
```

---

## 📝 CÓDIGO DE REFERENCIA

### **Llamar API en React:**

```typescript
const [datos, setDatos] = useState<any>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchDatos = async () => {
    try {
      setLoading(true);
      const response = await reportesApi.getDatos(trabajoId, reporteId, {
        hoja: selectedSheet,
        pagina: currentPage,
      });
      setDatos(response);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchDatos();
}, [trabajoId, reporteId, selectedSheet, currentPage]);
```

### **Renderizar Tabla:**

```typescript
<table className="min-w-full divide-y divide-gray-200">
  <thead className="bg-gray-100 sticky top-0">
    <tr>
      {datos.datos.headers.map((header, idx) => (
        <th
          key={idx}
          className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase"
        >
          {header}
        </th>
      ))}
    </tr>
  </thead>
  <tbody className="bg-white divide-y divide-gray-200">
    {datos.datos.filas.map((fila, rowIdx) => (
      <tr key={rowIdx} className="hover:bg-blue-50">
        {fila.map((celda, cellIdx) => (
          <td
            key={cellIdx}
            className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
          >
            {celda ?? "-"}
          </td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

### **Paginación:**

```typescript
<div className="flex items-center justify-between mt-4">
  <button
    onClick={() => setCurrentPage(currentPage - 1)}
    disabled={currentPage === 1}
    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
  >
    <ChevronLeft className="h-4 w-4" />
  </button>

  <span className="text-sm text-gray-700">
    Página {currentPage} de {totalPages}
  </span>

  <button
    onClick={() => setCurrentPage(currentPage + 1)}
    disabled={currentPage === totalPages}
    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-300"
  >
    <ChevronRight className="h-4 w-4" />
  </button>
</div>
```

---

## 🧪 CASOS DE PRUEBA

### **Test 1: Ver datos single-sheet**

```
1. Crear reporte tipo "balance"
2. Importar Excel
3. Click en reporte desde TrabajoDetail
4. Navegar a /trabajos/:id/reportes/:reporteId
5. Verificar que se muestre tabla con datos
6. No debe haber tabs (solo una hoja)
```

### **Test 2: Ver datos multi-sheet**

```
1. Crear reporte tipo "mensual"
2. Importar Excel con 3 hojas
3. Abrir reporte
4. Verificar que se muestren 3 tabs
5. Click en cada tab
6. Verificar que datos cambian
```

### **Test 3: Paginación**

```
1. Importar Excel con 250 filas
2. Abrir reporte
3. Verificar que se muestren 100 filas
4. Verificar paginación: "Página 1 de 3"
5. Click "Siguiente"
6. Verificar que carguen filas 101-200
```

### **Test 4: Estadísticas**

```
1. Abrir cualquier reporte
2. Verificar panel superior muestra:
   - Total filas
   - Total columnas
   - Nombre archivo
   - Tipo reporte
```

---

## 🔄 FLUJO DE TRABAJO SUGERIDO

### **Orden de implementación:**

**Día 1: Estructura básica**

1. Crear `DataTable.tsx` con tabla simple
2. Crear `ReporteDetail.tsx` con layout básico
3. Conectar con API `getDatos`
4. Mostrar datos sin paginación

**Día 2: Funcionalidades avanzadas**

1. Implementar paginación en `DataTable`
2. Crear `SheetTabs.tsx`
3. Conectar tabs con API
4. Cambio de hoja actualiza tabla

**Día 3: Polish y mejoras**

1. Crear `DataViewer.tsx` que coordina todo
2. Agregar panel de estadísticas
3. Loading states y error handling
4. Estilos finales y responsive

---

## 📁 ARCHIVOS A MODIFICAR

```
frontend/src/
├── components/
│   ├── DataTable.tsx        ⭐ CREAR
│   ├── SheetTabs.tsx        ⭐ CREAR
│   └── DataViewer.tsx       ⭐ CREAR
├── pages/
│   ├── ReporteDetail.tsx    ⭐ CREAR
│   └── TrabajoDetail.tsx    🔧 MODIFICAR (agregar link a reporte)
├── services/
│   └── api.ts               ✅ Ya tiene los métodos necesarios
└── App.tsx                  🔧 MODIFICAR (agregar ruta)
```

### **Modificación en App.tsx:**

```typescript
<Route
  path="/trabajos/:trabajoId/reportes/:reporteId"
  element={
    <PrivateRoute>
      <ReporteDetail />
    </PrivateRoute>
  }
/>
```

### **Modificación en TrabajoDetail.tsx:**

Agregar link en cada reporte:

```typescript
<button
  onClick={() => navigate(`/trabajos/${id}/reportes/${reporte.id}`)}
  className="text-blue-600 hover:text-blue-800"
>
  Ver Datos →
</button>
```

---

## 🎯 CRITERIOS DE ÉXITO

Al completar FASE 4:

```
✅ Usuario puede ver datos importados en tabla
✅ Paginación funciona correctamente
✅ Tabs de hojas funcionan (multi-sheet)
✅ Estadísticas se muestran correctamente
✅ Loading states durante carga
✅ Error handling si falla API
✅ Responsive design (funciona en mobile)
✅ UI consistente con FASE 3
✅ Sin errores en consola
✅ Todo documentado
```

---

## 📚 DOCUMENTACIÓN DE APOYO

**Leer antes de empezar:**

1. `docs/FASE-2-VISUALIZACION-COMPLETADA.md` - Endpoints backend
2. `frontend/src/services/api.ts` - Métodos ya disponibles
3. `frontend/src/components/ImportExcel.tsx` - Ejemplo de componente con API

**Referencias útiles:**

- Tailwind Tables: https://tailwindui.com/components/application-ui/lists/tables
- React Pagination: Implementación custom simple
- Lucide Icons: https://lucide.dev/icons/

---

## ⏱️ TIEMPO ESTIMADO

```
DataTable.tsx:     1 hora
SheetTabs.tsx:     30 min
DataViewer.tsx:    1 hora
ReporteDetail.tsx: 1 hora
Testing:           30 min
Polish:            30 min
────────────────────────
Total:             4-5 horas
```

---

## 🚀 COMANDO PARA EMPEZAR

Una vez que todo esté levantado y funcionando:

```
"Vamos a FASE 4, empecemos creando el componente DataTable.tsx para mostrar los datos en una tabla HTML"
```

---

## 💡 TIPS

1. **Empieza simple:** Primero tabla básica, luego añade features
2. **Usa los tipos:** TypeScript ayudará con la estructura de datos
3. **Reutiliza estilos:** Copia clases de ImportExcel para consistencia
4. **Testea con datos reales:** Importa un Excel y úsalo para desarrollo
5. **Loading states:** Siempre muestra feedback al usuario

---

## 🎉 RESULTADO ESPERADO

Al final de FASE 4, tendrás:

```
Sistema completo de importación + visualización:
┌───────────────────────────────────────┐
│  1. Usuario importa Excel             │
│  2. Datos se guardan en DB            │
│  3. Usuario puede ver datos en tabla  │
│  4. Navegar entre hojas y páginas     │
│  5. Ver estadísticas                  │
└───────────────────────────────────────┘

¡Todo end-to-end funcional! 🚀
```

---

**Próxima fase después:** FASE 5 - Edición de Datos  
**Estado actual:** FASE 3 completada ✅  
**Listo para:** FASE 4 🎯
