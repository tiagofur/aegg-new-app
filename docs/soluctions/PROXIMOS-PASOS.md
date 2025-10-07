# 🚀 Próximos Pasos - Sistema de Trabajos Contables

## ✅ Estado Actual: BACKEND COMPLETAMENTE FUNCIONAL

**Fecha:** 6 de Octubre de 2025

---

## 📊 Lo que YA Funciona

### ✅ Backend (100%)

- [x] Sistema de autenticación (JWT)
- [x] CRUD completo de trabajos
- [x] CRUD completo de reportes
- [x] Almacenamiento híbrido (JSONB)
- [x] Edición de celdas individuales
- [x] Agregar filas dinámicamente
- [x] Agregar columnas dinámicamente
- [x] Sistema de fórmulas (base)
- [x] Duplicación de trabajos
- [x] Estadísticas de usuario
- [x] 20+ endpoints REST funcionales

### ✅ Base de Datos (100%)

- [x] Tablas: users, trabajos, reportes
- [x] Relaciones FK correctas
- [x] Columnas JSONB optimizadas
- [x] Migraciones automáticas

### ✅ Infraestructura (100%)

- [x] Docker Compose configurado
- [x] PostgreSQL en contenedor
- [x] NestJS en contenedor
- [x] Hot reload funcionando

---

## 🎯 Próxima Fase: Frontend + Importación de Excel

### 1️⃣ **PRIORIDAD ALTA: Importación de Excel**

#### Implementar en Backend:

```typescript
// backend/src/trabajos/services/excel-parser.service.ts

import * as XLSX from "xlsx";

@Injectable()
export class ExcelParserService {
  parsearExcel(buffer: Buffer): DatosExcel {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      raw: false,
    });

    return {
      headers: data[0],
      filas: data.slice(1),
      metadata: {
        total_filas: data.length - 1,
        total_columnas: data[0].length,
      },
    };
  }
}
```

#### Endpoint de Upload:

```typescript
// Agregar a reporte.controller.ts
@Post(':id/importar-excel')
@UseInterceptors(FileInterceptor('file'))
async importarExcel(
  @UploadedFile() file: Express.Multer.File,
  @Param('id') id: string,
  @Param('trabajoId') trabajoId: string,
  @Request() req
) {
  return this.reporteService.importarDesdeExcel(
    id,
    trabajoId,
    file.buffer,
    req.user.userId
  );
}
```

**Tiempo estimado:** 4-6 horas

---

### 2️⃣ **PRIORIDAD ALTA: Frontend - Lista de Trabajos**

#### Componentes a Crear:

**a) Lista de Trabajos**

```tsx
// frontend/src/pages/Trabajos.tsx

import { useEffect, useState } from "react";
import { trabajosApi } from "../services/api";

export default function Trabajos() {
  const [trabajos, setTrabajos] = useState([]);

  useEffect(() => {
    cargarTrabajos();
  }, []);

  const cargarTrabajos = async () => {
    const data = await trabajosApi.listar();
    setTrabajos(data);
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Mis Trabajos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trabajos.map((trabajo) => (
          <TarjetaTrabajo key={trabajo.id} trabajo={trabajo} />
        ))}
      </div>
    </div>
  );
}
```

**b) Tarjeta de Trabajo**

```tsx
// frontend/src/components/TarjetaTrabajo.tsx

export function TarjetaTrabajo({ trabajo }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
      <h3 className="text-xl font-semibold mb-2">{trabajo.nombre}</h3>
      <p className="text-gray-600 mb-4">{trabajo.mes}</p>
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-500">
          {trabajo.reportes.length} reportes
        </span>
        <button className="btn-primary">Abrir</button>
      </div>
    </div>
  );
}
```

**Tiempo estimado:** 6-8 horas

---

### 3️⃣ **PRIORIDAD MEDIA: Vista de Trabajo Individual**

#### Componentes:

**a) Pestañas de Reportes**

```tsx
// frontend/src/pages/TrabajoPantalla.tsx

import { Tabs, TabList, Tab, TabPanel } from "react-tabs";
import TablaReporte from "../components/TablaReporte";

export default function TrabajoPantalla() {
  const { trabajoId } = useParams();
  const [trabajo, setTrabajo] = useState(null);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white shadow p-4">
        <h1>{trabajo?.nombre}</h1>
      </div>

      {/* Pestañas de reportes */}
      <Tabs className="flex-1">
        <TabList>
          {trabajo?.reportes.map((reporte) => (
            <Tab key={reporte.id}>{reporte.tipoReporte}</Tab>
          ))}
        </TabList>

        {trabajo?.reportes.map((reporte) => (
          <TabPanel key={reporte.id}>
            <TablaReporte reporteId={reporte.id} />
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}
```

**b) Tabla Editable**

```tsx
// frontend/src/components/TablaReporte.tsx

import Spreadsheet from "react-spreadsheet";

export default function TablaReporte({ reporteId }) {
  const [datos, setDatos] = useState([]);

  const handleCellChange = async (changes) => {
    // Guardar cambios en backend
    await reportesApi.actualizarCelda(
      reporteId,
      changes.row,
      changes.col,
      changes.value
    );
  };

  return (
    <div className="p-4">
      <Spreadsheet
        data={datos}
        onChange={handleCellChange}
        className="w-full"
      />
    </div>
  );
}
```

**Librerías necesarias:**

```bash
npm install react-tabs
npm install react-spreadsheet
# O alternativa:
npm install handsontable @handsontable/react
```

**Tiempo estimado:** 10-12 horas

---

### 4️⃣ **PRIORIDAD MEDIA: Servicios de API Frontend**

```typescript
// frontend/src/services/trabajos.service.ts

import api from "./api";

export const trabajosApi = {
  listar: async () => {
    const { data } = await api.get("/trabajos");
    return data;
  },

  crear: async (trabajo) => {
    const { data } = await api.post("/trabajos", trabajo);
    return data;
  },

  obtener: async (id) => {
    const { data } = await api.get(`/trabajos/${id}`);
    return data;
  },

  actualizar: async (id, cambios) => {
    const { data } = await api.patch(`/trabajos/${id}`, cambios);
    return data;
  },

  eliminar: async (id) => {
    await api.delete(`/trabajos/${id}`);
  },

  duplicar: async (id) => {
    const { data } = await api.post(`/trabajos/${id}/duplicar`);
    return data;
  },

  estadisticas: async () => {
    const { data } = await api.get("/trabajos/estadisticas");
    return data;
  },
};

export const reportesApi = {
  crear: async (trabajoId, reporte) => {
    const { data } = await api.post(`/trabajos/${trabajoId}/reportes`, reporte);
    return data;
  },

  listar: async (trabajoId) => {
    const { data } = await api.get(`/trabajos/${trabajoId}/reportes`);
    return data;
  },

  obtener: async (trabajoId, reporteId) => {
    const { data } = await api.get(
      `/trabajos/${trabajoId}/reportes/${reporteId}`
    );
    return data;
  },

  importarExcel: async (trabajoId, reporteId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await api.post(
      `/trabajos/${trabajoId}/reportes/${reporteId}/importar-excel`,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    return data;
  },

  actualizarCelda: async (trabajoId, reporteId, fila, columna, valor) => {
    const { data } = await api.patch(
      `/trabajos/${trabajoId}/reportes/${reporteId}/celdas/${fila}/${columna}`,
      { valor }
    );
    return data;
  },

  agregarFila: async (trabajoId, reporteId, datos, posicion) => {
    const { data } = await api.post(
      `/trabajos/${trabajoId}/reportes/${reporteId}/filas`,
      { datos, posicion }
    );
    return data;
  },

  agregarColumna: async (trabajoId, reporteId, columna) => {
    const { data } = await api.post(
      `/trabajos/${trabajoId}/reportes/${reporteId}/columnas`,
      columna
    );
    return data;
  },
};
```

**Tiempo estimado:** 3-4 horas

---

### 5️⃣ **PRIORIDAD BAJA: Características Avanzadas**

#### a) Guardado Automático

```typescript
// Hook personalizado
import { useEffect, useRef } from "react";
import { debounce } from "lodash";

export function useAutoGuardado(callback, delay = 2000) {
  const debouncedSave = useRef(
    debounce(async (data) => {
      await callback(data);
      toast.success("Guardado automático");
    }, delay)
  ).current;

  useEffect(() => {
    return () => {
      debouncedSave.cancel();
    };
  }, []);

  return debouncedSave;
}
```

#### b) Exportación a Excel

```typescript
// backend/src/trabajos/services/excel-export.service.ts

import * as XLSX from "xlsx";

@Injectable()
export class ExcelExportService {
  async exportarReporte(reporte: Reporte): Promise<Buffer> {
    const workbook = XLSX.utils.book_new();

    // Combinar datos originales + modificados
    const datosCombinados = this.combinarDatos(reporte);

    const worksheet = XLSX.utils.aoa_to_sheet(datosCombinados);
    XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

    return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  }
}
```

#### c) Indicadores de Estado

```tsx
// Mostrar si hay cambios sin guardar
export function IndicadorGuardado({ guardando, ultimoGuardado }) {
  return (
    <div className="text-sm text-gray-600">
      {guardando ? (
        <span>💾 Guardando...</span>
      ) : (
        <span>✅ Guardado hace {formatDistanceToNow(ultimoGuardado)}</span>
      )}
    </div>
  );
}
```

**Tiempo estimado:** 8-10 horas

---

## 📅 Cronograma Sugerido

### Semana 1: Importación de Excel

- [ ] Día 1-2: Parser de Excel en backend
- [ ] Día 3: Endpoint de upload
- [ ] Día 4: Validaciones y tests
- [ ] Día 5: Integración con reportes existentes

### Semana 2: Frontend Básico

- [ ] Día 1-2: Lista de trabajos
- [ ] Día 3-4: Formulario de creación
- [ ] Día 5: Servicios de API

### Semana 3: Vista de Trabajo

- [ ] Día 1-2: Sistema de pestañas
- [ ] Día 3-5: Tabla editable básica

### Semana 4: Integración

- [ ] Día 1-2: Importación desde frontend
- [ ] Día 3: Edición de celdas
- [ ] Día 4-5: Tests y pulido

---

## 🔧 Dependencias a Instalar

### Backend (Ya instaladas ✅)

```bash
npm install xlsx
npm install exceljs
npm install hot-formula-parser
npm install @nestjs/platform-express  # Para multipart/form-data
```

### Frontend (Pendientes)

```bash
npm install react-tabs
npm install react-spreadsheet
npm install lodash
npm install date-fns
npm install react-dropzone  # Para drag & drop de archivos
npm install react-toastify  # Para notificaciones
```

---

## 📚 Recursos Recomendados

### Librerías de Tablas Editables

1. **react-spreadsheet** (Más simple)

   - GitHub: https://github.com/iddan/react-spreadsheet
   - Pros: Ligera, fácil de usar
   - Contras: Menos features

2. **Handsontable** (Más completa) ⭐ RECOMENDADA

   - Website: https://handsontable.com
   - Pros: Excel-like, muchas features
   - Contras: Licencia comercial para algunos usos

3. **AG Grid** (Enterprise)
   - Website: https://www.ag-grid.com
   - Pros: Muy potente, performance excelente
   - Contras: Compleja, licencia cara

### Recomendación Final

**Handsontable Community** es la mejor opción para tu caso:

- Gratis para uso no comercial
- Muy similar a Excel
- Soporta fórmulas
- Copy/paste desde Excel
- Excelente documentación

---

## 🎯 Hitos Clave

### ✅ Hito 1: Backend Funcional (COMPLETADO)

- Sistema de trabajos y reportes
- API REST completa
- Base de datos optimizada

### 🔄 Hito 2: Importación de Excel (EN PROGRESO)

- Parser de Excel
- Upload de archivos
- Validación de datos

### 📋 Hito 3: Frontend Básico (PENDIENTE)

- Lista de trabajos
- Creación de trabajos
- Navegación básica

### 📊 Hito 4: Visualización de Reportes (PENDIENTE)

- Sistema de pestañas
- Tabla editable
- Guardado de cambios

### 🚀 Hito 5: Sistema Completo (PENDIENTE)

- Exportación a Excel
- Guardado automático
- Optimizaciones

---

## 🐛 Issues Conocidos

### Backend

- [ ] Validar límite de tamaño de archivos Excel
- [ ] Optimizar queries para trabajos con muchos reportes
- [ ] Agregar índices a columnas JSONB frecuentes

### Frontend

- [ ] Implementar manejo de errores global
- [ ] Agregar loading states
- [ ] Optimizar re-renders en tablas grandes

---

## 💡 Ideas Futuras

### Mejoras de UX

- [ ] Atajos de teclado (Ctrl+S para guardar)
- [ ] Historial de cambios (undo/redo)
- [ ] Búsqueda en reportes
- [ ] Filtros y ordenamiento

### Colaboración

- [ ] WebSockets para edición en tiempo real
- [ ] Comentarios en celdas
- [ ] Historial de versiones
- [ ] Control de acceso granular

### Análisis

- [ ] Gráficos automáticos
- [ ] Dashboard de métricas
- [ ] Comparación entre meses
- [ ] Exportar a PDF con gráficos

---

## 📞 Soporte

Si tienes dudas sobre la implementación:

1. Revisa `docs/SISTEMA-TRABAJOS-IMPLEMENTADO.md`
2. Ejecuta `docs/PRUEBAS-SISTEMA-TRABAJOS.ps1`
3. Consulta los ejemplos en `docs/PRUEBAS-RAPIDAS.md`

---

**Última actualización:** 6 de Octubre de 2025  
**Estado:** Backend 100% completado ✅  
**Próximo paso:** Implementar importación de Excel 📊
