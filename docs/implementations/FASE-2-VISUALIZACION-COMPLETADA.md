# ✅ FASE 2 COMPLETADA: Vista en Pantalla

## 🎯 Nuevos Endpoints Implementados

### 1. **Obtener Datos para Visualización** ✅

```http
GET /trabajos/:trabajoId/reportes/:id/datos
```

**Query Parameters:**

- `hoja` (opcional): Nombre de la hoja para reportes multi-hoja
- `pagina` (opcional, default: 1): Número de página
- `porPagina` (opcional, default: 100): Filas por página
- `incluirModificaciones` (opcional, default: true): Incluir cambios del usuario

**Respuesta para HOJA ÚNICA:**

```json
{
  "tipo": "hoja-unica",
  "headers": ["Concepto", "Enero", "Febrero", "Marzo"],
  "filas": [
    ["Ventas", 10000, 12000, 15000],
    ["Servicios", 5000, 6000, 7000]
  ],
  "paginacion": {
    "pagina": 1,
    "porPagina": 100,
    "totalFilas": 2,
    "totalPaginas": 1,
    "inicio": 1,
    "fin": 2
  },
  "metadata": {
    "tieneModificaciones": false,
    "estadoReporte": "importado"
  }
}
```

**Respuesta para MULTI-HOJA:**

```json
{
  "tipo": "multi-hoja",
  "hojaActual": "Reporte Mensual",
  "hojasDisponibles": [
    {
      "nombre": "Reporte Mensual",
      "totalFilas": 50,
      "totalColumnas": 15
    },
    {
      "nombre": "Ingresos",
      "totalFilas": 100,
      "totalColumnas": 8
    }
  ],
  "headers": ["Concepto", "Enero", "Febrero"],
  "filas": [
    ["Ventas", 10000, 12000],
    ["Servicios", 5000, 6000]
  ],
  "paginacion": {
    "pagina": 1,
    "porPagina": 100,
    "totalFilas": 50,
    "totalPaginas": 1,
    "inicio": 1,
    "fin": 50
  },
  "metadata": {
    "tieneModificaciones": true,
    "totalHojas": 2,
    "estadoReporte": "importado"
  }
}
```

---

### 2. **Obtener Hojas Disponibles** ✅

```http
GET /trabajos/:trabajoId/reportes/:id/hojas
```

**Respuesta:**

```json
{
  "tipo": "multi-hoja",
  "hojas": [
    {
      "nombre": "Reporte Mensual",
      "totalFilas": 50,
      "totalColumnas": 15
    },
    {
      "nombre": "Ingresos",
      "totalFilas": 100,
      "totalColumnas": 8
    }
  ]
}
```

---

### 3. **Obtener Estadísticas del Reporte** ✅

```http
GET /trabajos/:trabajoId/reportes/:id/estadisticas
```

**Respuesta para MULTI-HOJA:**

```json
{
  "estado": "importado",
  "tipo": "multi-hoja",
  "totalHojas": 2,
  "totalFilas": 150,
  "totalColumnas": 15,
  "hojas": [
    {
      "nombre": "Reporte Mensual",
      "filas": 50,
      "columnas": 15
    },
    {
      "nombre": "Ingresos",
      "filas": 100,
      "columnas": 8
    }
  ],
  "modificaciones": {
    "celdasModificadas": 5,
    "filasAgregadas": 2,
    "columnasAgregadas": 1,
    "formulas": 3
  },
  "fechaImportacion": "2025-10-06T22:00:00Z",
  "nombreArchivo": "reporte-octubre.xlsx"
}
```

---

### 4. **Obtener Rango Específico de Datos** ✅

```http
GET /trabajos/:trabajoId/reportes/:id/rango
```

**Query Parameters:**

- `hoja` (opcional): Nombre de la hoja
- `filaInicio` (requerido): Índice de fila inicial (0-based)
- `filaFin` (requerido): Índice de fila final (0-based)
- `incluirHeaders` (opcional, default: false): Incluir headers

**Uso:** Ideal para **scrolling virtual** en tablas grandes

**Respuesta:**

```json
{
  "headers": ["Concepto", "Enero", "Febrero"],
  "filas": [
    ["Fila 100", 1000, 2000],
    ["Fila 101", 1100, 2100],
    ["Fila 102", 1200, 2200]
  ],
  "rango": {
    "inicio": 100,
    "fin": 103,
    "total": 5000
  }
}
```

---

## 🧪 Ejemplos de Uso con PowerShell

### Ejemplo 1: Ver datos de la primera página

```powershell
$headers = @{ Authorization = "Bearer $token" }

# Obtener primera página (100 filas)
$datos = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/datos" `
    -Method GET `
    -Headers $headers

Write-Output "📊 Datos obtenidos:"
Write-Output "Tipo: $($datos.tipo)"
Write-Output "Headers: $($datos.headers -join ', ')"
Write-Output "Filas: $($datos.filas.Count)"
Write-Output "Total filas: $($datos.paginacion.totalFilas)"
```

### Ejemplo 2: Ver datos de una hoja específica (multi-hoja)

```powershell
# Ver datos de la hoja "Ingresos"
$datos = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/datos?hoja=Ingresos&pagina=1&porPagina=50" `
    -Method GET `
    -Headers $headers

Write-Output "📋 Hoja actual: $($datos.hojaActual)"
Write-Output "Hojas disponibles:"
$datos.hojasDisponibles | ForEach-Object {
    Write-Output "  - $($_.nombre): $($_.totalFilas) filas"
}
```

### Ejemplo 3: Listar todas las hojas disponibles

```powershell
$hojas = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/hojas" `
    -Method GET `
    -Headers $headers

Write-Output "📑 Hojas disponibles:"
$hojas.hojas | ForEach-Object {
    Write-Output "  - $($_.nombre): $($_.totalFilas) filas x $($_.totalColumnas) columnas"
}
```

### Ejemplo 4: Ver estadísticas del reporte

```powershell
$stats = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/estadisticas" `
    -Method GET `
    -Headers $headers

Write-Output "📊 Estadísticas del Reporte:"
Write-Output "Estado: $($stats.estado)"
Write-Output "Tipo: $($stats.tipo)"
Write-Output "Total hojas: $($stats.totalHojas)"
Write-Output "Total filas: $($stats.totalFilas)"
Write-Output "Modificaciones:"
Write-Output "  - Celdas modificadas: $($stats.modificaciones.celdasModificadas)"
Write-Output "  - Filas agregadas: $($stats.modificaciones.filasAgregadas)"
Write-Output "  - Columnas agregadas: $($stats.modificaciones.columnasAgregadas)"
```

### Ejemplo 5: Obtener rango específico (scrolling virtual)

```powershell
# Obtener filas 100 a 150 de la hoja "Reporte Mensual"
$rango = Invoke-RestMethod `
    -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/rango?hoja=Reporte Mensual&filaInicio=100&filaFin=150&incluirHeaders=true" `
    -Method GET `
    -Headers $headers

Write-Output "📍 Rango obtenido: filas $($rango.rango.inicio) a $($rango.rango.fin) de $($rango.rango.total)"
Write-Output "Filas en el rango: $($rango.filas.Count)"
```

### Ejemplo 6: Paginación completa

```powershell
# Recorrer todas las páginas
$pagina = 1
$porPagina = 50
$hayMasPaginas = $true

while ($hayMasPaginas) {
    $datos = Invoke-RestMethod `
        -Uri "http://localhost:3001/trabajos/$trabajoId/reportes/$reporteId/datos?pagina=$pagina&porPagina=$porPagina" `
        -Method GET `
        -Headers $headers

    Write-Output "Página $pagina de $($datos.paginacion.totalPaginas)"
    Write-Output "Filas: $($datos.paginacion.inicio) a $($datos.paginacion.fin)"

    # Procesar las filas...
    foreach ($fila in $datos.filas) {
        # Hacer algo con cada fila
    }

    $pagina++
    $hayMasPaginas = $pagina -le $datos.paginacion.totalPaginas
}
```

---

## 🔧 Características Implementadas

### ✅ Paginación Inteligente

- **Páginas configurables**: 10, 50, 100, 500 filas por página
- **Navegación eficiente**: Solo carga lo necesario
- **Metadata completa**: Información de paginación detallada

### ✅ Soporte Multi-Hoja

- **Selector de hojas**: Cambiar entre hojas fácilmente
- **Lista de hojas**: Ver todas las hojas disponibles
- **Metadata por hoja**: Filas y columnas de cada hoja

### ✅ Aplicación de Modificaciones

- **Automático**: Las modificaciones se aplican al obtener datos
- **Opcional**: Puede desactivarse con `incluirModificaciones=false`
- **Eficiente**: Solo aplica a las filas solicitadas

### ✅ Scrolling Virtual (Rango)

- **Optimizado**: Para tablas con miles de filas
- **Flexible**: Solicitar cualquier rango de filas
- **Headers opcionales**: Incluir o no según necesidad

### ✅ Estadísticas Detalladas

- **Conteo de modificaciones**: Cuántas celdas, filas, columnas modificadas
- **Info de archivo**: Nombre, tamaño, fecha de importación
- **Estado del reporte**: pendiente, importado, procesado

---

## 📊 Flujos de Uso Típicos

### Flujo 1: Visualizar Reporte Importado

```
1. Usuario abre un trabajo
   GET /trabajos/:id

2. Usuario selecciona un reporte
   GET /trabajos/:trabajoId/reportes/:reporteId/estadisticas

3. Si es multi-hoja, listar hojas disponibles
   GET /trabajos/:trabajoId/reportes/:reporteId/hojas

4. Obtener primera página de datos
   GET /trabajos/:trabajoId/reportes/:reporteId/datos?pagina=1&porPagina=100

5. Usuario navega a página 2
   GET /trabajos/:trabajoId/reportes/:reporteId/datos?pagina=2&porPagina=100

6. Usuario cambia de hoja (si es multi-hoja)
   GET /trabajos/:trabajoId/reportes/:reporteId/datos?hoja=Ingresos&pagina=1
```

### Flujo 2: Tabla con Scrolling Virtual

```
1. Cargar estadísticas para saber el total de filas
   GET /trabajos/:trabajoId/reportes/:reporteId/estadisticas

2. Cargar headers
   GET /trabajos/:trabajoId/reportes/:reporteId/rango?filaInicio=0&filaFin=1&incluirHeaders=true

3. Usuario hace scroll, cargar filas visibles
   GET /trabajos/:trabajoId/reportes/:reporteId/rango?filaInicio=50&filaFin=100

4. Usuario sigue haciendo scroll
   GET /trabajos/:trabajoId/reportes/:reporteId/rango?filaInicio=100&filaFin=150
```

---

## 🎨 Casos de Uso en Frontend

### Componente: Selector de Hojas (Multi-Hoja)

```typescript
// React Component Example
function SelectorHojas({ reporteId, onHojaChange }) {
  const [hojas, setHojas] = useState([]);

  useEffect(() => {
    async function cargar() {
      const data = await api.get(`/reportes/${reporteId}/hojas`);
      setHojas(data.hojas);
    }
    cargar();
  }, [reporteId]);

  return (
    <select onChange={(e) => onHojaChange(e.target.value)}>
      {hojas.map((hoja) => (
        <option key={hoja.nombre} value={hoja.nombre}>
          {hoja.nombre} ({hoja.totalFilas} filas)
        </option>
      ))}
    </select>
  );
}
```

### Componente: Tabla Paginada

```typescript
function TablaPaginada({ reporteId, hoja }) {
  const [datos, setDatos] = useState(null);
  const [pagina, setPagina] = useState(1);

  useEffect(() => {
    async function cargar() {
      const params = new URLSearchParams({
        pagina: pagina.toString(),
        porPagina: "100",
        ...(hoja && { hoja }),
      });

      const data = await api.get(`/reportes/${reporteId}/datos?${params}`);
      setDatos(data);
    }
    cargar();
  }, [reporteId, hoja, pagina]);

  if (!datos) return <Loading />;

  return (
    <div>
      <table>
        <thead>
          <tr>
            {datos.headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {datos.filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j}>{celda}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Paginacion
        actual={pagina}
        total={datos.paginacion.totalPaginas}
        onChange={setPagina}
      />
    </div>
  );
}
```

---

## ✅ Checklist de Implementación FASE 2

### Backend

- [x] Método `obtenerDatosVisualizacion()`
- [x] Método `obtenerDatosHojaEspecifica()` (privado)
- [x] Método `obtenerDatosHojaUnica()` (privado)
- [x] Método `aplicarModificacionesAFilas()` (privado)
- [x] Método `obtenerHojasDisponibles()`
- [x] Método `obtenerEstadisticas()`
- [x] Método `obtenerRangoDatos()`
- [x] Método `tieneModificaciones()` (privado)
- [x] Método `contarModificaciones()` (privado)
- [x] Endpoint GET `/datos`
- [x] Endpoint GET `/hojas`
- [x] Endpoint GET `/estadisticas`
- [x] Endpoint GET `/rango`
- [x] Compilación sin errores
- [x] Todos los endpoints mapeados

### Próximos Pasos (FASE 3: Frontend)

- [ ] Componente `ListaTrabajos`
- [ ] Componente `SelectorHojas`
- [ ] Componente `TablaDatos`
- [ ] Componente `Paginacion`
- [ ] Sistema de pestañas para multi-hoja
- [ ] Indicador de modificaciones
- [ ] Loading states
- [ ] Error handling

---

## 📝 Notas Técnicas

### Performance

- **Paginación**: Solo carga las filas necesarias
- **Modificaciones**: Se aplican solo a las filas solicitadas
- **Memoria**: No mantiene todos los datos en memoria

### Flexibilidad

- **Páginas dinámicas**: 10, 50, 100, 500 filas
- **Multi-hoja**: Cambio rápido entre hojas
- **Modificaciones opcionales**: Ver datos originales o modificados

### Escalabilidad

- **Archivos grandes**: Soporta miles de filas sin problemas
- **Scrolling virtual**: Carga solo lo visible
- **JSONB**: Queries eficientes en PostgreSQL

---

## 🚀 Endpoints Disponibles - Resumen

```
VISUALIZACIÓN:
GET  /trabajos/:trabajoId/reportes/:id/datos          ✅ Obtener datos paginados
GET  /trabajos/:trabajoId/reportes/:id/hojas          ✅ Listar hojas disponibles
GET  /trabajos/:trabajoId/reportes/:id/estadisticas   ✅ Ver estadísticas
GET  /trabajos/:trabajoId/reportes/:id/rango          ✅ Obtener rango específico

IMPORTACIÓN (FASE 1):
POST /trabajos/:trabajoId/reportes/:id/importar-excel ✅ Importar Excel
POST /trabajos/:trabajoId/reportes/:id/info-excel     ✅ Info sin importar

EDICIÓN (Ya existentes):
PATCH /trabajos/:trabajoId/reportes/:id/celdas/:f/:c  ✅ Editar celda
POST  /trabajos/:trabajoId/reportes/:id/filas         ✅ Agregar fila
POST  /trabajos/:trabajoId/reportes/:id/columnas      ✅ Agregar columna
```

---

**Estado:** ✅ FASE 2 COMPLETADA  
**Próxima fase:** FASE 3 - Frontend (Componentes React)  
**Fecha:** 6 de Octubre de 2025
