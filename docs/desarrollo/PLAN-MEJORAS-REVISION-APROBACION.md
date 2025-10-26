# Plan de Implementación: Mejoras al Flujo de Revisión y Aprobación

**Fecha:** 25 de octubre, 2025  
**Objetivo:** Implementar las mejoras críticas para lanzar una versión de prueba funcional

---

## 🎯 Fase 1: Soluciones Críticas (URGENTE)

### ✅ Tarea 1.1: Navegación Clickeable en Dashboard de Aprobaciones

**Archivos a modificar:**

1. `frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`
2. `frontend/src/components/trabajos/TrabajoDetail.tsx`

**Cambios Detallados:**

#### Paso 1.1.1: Agregar navegación en la tabla

```tsx
// En AprobacionesDashboard.tsx
import { useNavigate } from "react-router-dom";

export const AprobacionesDashboard: FC<AprobacionesDashboardProps> = ({
  // ... props
}) => {
  const navigate = useNavigate();

  // En el renderizado de la tabla:
  <tbody className="divide-y divide-slate-100 bg-white">
    {pendientesFiltradas.map((item) => (
      <tr
        key={item.id}
        onClick={() => navigate(`/trabajos/${item.trabajoId}?mes=${item.id}`)}
        className="transition hover:bg-blue-50 cursor-pointer group"
      >
        <td className="px-4 py-3 font-medium text-slate-800">
          <div className="flex flex-col">
            <span className="group-hover:text-blue-600 transition">
              {item.clienteNombre} · {item.anio} 🔗
            </span>
            {/* ... resto del contenido */}
          </div>
        </td>
        {/* ... resto de las celdas */}
      </tr>
    ))}
  </tbody>
```

#### Paso 1.1.2: Leer parámetro y auto-expandir mes en TrabajoDetail

```tsx
// En TrabajoDetail.tsx
import { useLocation, useNavigate } from "react-router-dom";

export const TrabajoDetail: React.FC<TrabajoDetailProps> = ({ ... }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Al cargar el componente, leer el parámetro 'mes'
  useEffect(() => {
    if (!trabajo?.reporteBaseAnual?.meses) return;

    const params = new URLSearchParams(location.search);
    const mesIdParam = params.get('mes');

    if (mesIdParam) {
      // Encontrar el número de mes correspondiente al ID
      const mesEncontrado = trabajo.reporteBaseAnual.meses.find(
        m => m.id === mesIdParam
      );

      if (mesEncontrado) {
        // Establecer el mes seleccionado
        setMesSeleccionado(mesEncontrado.mes);

        // Hacer scroll al mes después de que se renderice
        setTimeout(() => {
          const mesElement = document.getElementById(`mes-card-${mesEncontrado.mes}`);
          if (mesElement) {
            mesElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
            // Agregar highlight temporal
            mesElement.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
            setTimeout(() => {
              mesElement.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
            }, 2000);
          }
        }, 300);

        // Limpiar el parámetro de la URL
        navigate(location.pathname, { replace: true });
      }
    }
  }, [trabajo, location.search]);

  // ... resto del componente
};
```

#### Paso 1.1.3: Agregar ID único al MesCard

```tsx
// En MesCard.tsx
export const MesCard: React.FC<MesCardProps> = ({ mes, ... }) => {
  return (
    <div
      id={`mes-card-${mes.mes}`}
      className="rounded-lg border border-gray-200 bg-white shadow-sm transition-all duration-200"
    >
      {/* ... contenido actual */}
    </div>
  );
};
```

**Resultado esperado:**

- ✅ El gestor hace clic en cualquier fila del dashboard de aprobaciones
- ✅ Es redirigido al trabajo específico
- ✅ El mes correspondiente se expande automáticamente
- ✅ La vista hace scroll al mes con un highlight temporal
- ✅ La URL queda limpia (sin el parámetro `?mes=`)

---

### ✅ Tarea 1.2: Validación Backend para Bloquear Ediciones

**Archivos a modificar:**

1. `backend/src/trabajos/services/reportes-mensuales.service.ts`

**Cambios Detallados:**

#### Paso 1.2.1: Agregar método de validación

```typescript
// En reportes-mensuales.service.ts
import { EstadoRevisionMes } from "../entities/mes.entity";

export class ReportesMensualesService {
  // ... código existente ...

  /**
   * Valida que un mes esté en estado editable
   * @throws ConflictException si el mes está en revisión o aprobado
   */
  private async validarMesEditable(mesId: string): Promise<Mes> {
    const mes = await this.mesRepository.findOne({
      where: { id: mesId },
      relations: ["trabajo", "trabajo.gestorResponsable"],
    });

    if (!mes) {
      throw new NotFoundException("Mes no encontrado");
    }

    if (mes.estadoRevision === EstadoRevisionMes.ENVIADO) {
      throw new ConflictException(
        "El mes está en revisión por el gestor. " +
          "No puedes modificarlo hasta que sea aprobado o rechazado. " +
          `Gestor responsable: ${
            mes.trabajo?.gestorResponsable?.name || "No asignado"
          }`
      );
    }

    if (mes.estadoRevision === EstadoRevisionMes.APROBADO) {
      throw new ConflictException(
        "El mes está aprobado y bloqueado. " +
          "Contacta al gestor responsable si necesitas reabrirlo para hacer cambios."
      );
    }

    return mes;
  }

  // ... resto del código ...
}
```

#### Paso 1.2.2: Aplicar validación en método `importar`

```typescript
async importar(
  mesId: string,
  tipoReporte: TipoReporte,
  archivo: Express.Multer.File,
  currentUser: CurrentUserPayload,
): Promise<ReporteMensual> {
  // NUEVO: Validar que el mes sea editable
  await this.validarMesEditable(mesId);

  // ... resto del código existente ...
}
```

#### Paso 1.2.3: Aplicar validación en método `agregarHoja`

```typescript
async agregarHoja(
  reporteId: string,
  nombreHoja: string,
  currentUser: CurrentUserPayload,
): Promise<ReporteMensual> {
  const reporte = await this.findOne(reporteId);

  // NUEVO: Validar que el mes sea editable
  await this.validarMesEditable(reporte.mesId);

  // ... resto del código existente ...
}
```

#### Paso 1.2.4: Aplicar validación en método `eliminarHoja`

```typescript
async eliminarHoja(
  reporteId: string,
  nombreHoja: string,
  currentUser: CurrentUserPayload,
): Promise<ReporteMensual> {
  const reporte = await this.findOne(reporteId);

  // NUEVO: Validar que el mes sea editable
  await this.validarMesEditable(reporte.mesId);

  // ... resto del código existente ...
}
```

#### Paso 1.2.5: Aplicar validación en método `modificarHoja`

```typescript
async modificarHoja(
  reporteId: string,
  nombreHoja: string,
  dto: ModificarHojaDto,
  currentUser: CurrentUserPayload,
): Promise<ReporteMensual> {
  const reporte = await this.findOne(reporteId);

  // NUEVO: Validar que el mes sea editable
  await this.validarMesEditable(reporte.mesId);

  // ... resto del código existente ...
}
```

**Resultado esperado:**

- ✅ Si un mes está en revisión (`ENVIADO`), cualquier intento de modificar sus reportes lanza un error 409
- ✅ Si un mes está aprobado (`APROBADO`), cualquier intento de modificar sus reportes lanza un error 409
- ✅ Los errores son claros y le indican al usuario qué debe hacer
- ✅ La validación está en el backend, no puede ser bypaseada desde el frontend

---

### ✅ Tarea 1.3: Mejorar Mensajes de Validación en Frontend

**Archivos a modificar:**

1. `frontend/src/components/trabajos/MesCard.tsx`

**Cambios Detallados:**

#### Paso 1.3.1: Mejorar manejo de errores en importación

```tsx
// En MesCard.tsx, dentro de ReporteCard
const handleImport = async () => {
  try {
    // ... código de importación ...
  } catch (error: any) {
    console.error("Error al importar:", error);

    // Mejorar el mensaje de error
    const errorMessage =
      error.response?.data?.message || "Error al importar el reporte";

    // Si es un error de validación de mes bloqueado, mostrarlo claramente
    if (
      errorMessage.includes("revisión") ||
      errorMessage.includes("aprobado")
    ) {
      alert(`❌ No puedes modificar este reporte\n\n${errorMessage}`);
    } else {
      alert(`Error: ${errorMessage}`);
    }
  }
};
```

#### Paso 1.3.2: Agregar badge más visible cuando hay cambios solicitados

```tsx
// En MesCard.tsx
{
  mes.estadoRevision === "CAMBIOS_SOLICITADOS" && mes.comentarioRevision && (
    <div className="mb-3 rounded-md border-2 border-rose-300 bg-rose-50 p-4 text-sm">
      <div className="flex items-start gap-2">
        <svg
          className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div>
          <p className="font-semibold text-rose-800 mb-1">
            ⚠️ El gestor solicitó cambios
          </p>
          <p className="text-rose-700">{mes.comentarioRevision}</p>
        </div>
      </div>
    </div>
  );
}
```

**Resultado esperado:**

- ✅ Los errores de validación se muestran con mensajes claros
- ✅ Los cambios solicitados son muy visibles para el miembro
- ✅ El usuario entiende qué debe hacer en cada situación

---

## 🎨 Fase 2: Mejoras de UX (Recomendado)

### ⭐ Tarea 2.1: Indicador de Tiempo de Revisión

**Archivos a modificar:**

1. `frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`

**Cambios:**

```tsx
// Agregar función para calcular días en revisión
const calcularDiasEnRevision = (fechaEnvio?: string | null) => {
  if (!fechaEnvio) return null;
  const dias = Math.floor(
    (Date.now() - new Date(fechaEnvio).getTime()) / (1000 * 60 * 60 * 24)
  );
  return dias;
};

// En la columna de "Última actualización":
<td className="px-4 py-3 text-slate-600">
  <div className="flex flex-col text-xs">
    <span>{formatRelative(item.fechaActualizacion)}</span>
    <span className="text-slate-400">
      {formatDate(item.fechaActualizacion)}
    </span>
    {item.estadoRevision === "ENVIADO" && item.fechaEnvioRevision && (
      <span
        className={`font-semibold mt-1 ${
          calcularDiasEnRevision(item.fechaEnvioRevision)! > 3
            ? "text-rose-600"
            : "text-amber-600"
        }`}
      >
        ⏱️ {calcularDiasEnRevision(item.fechaEnvioRevision)} días en revisión
      </span>
    )}
  </div>
</td>;
```

**Resultado:** El gestor ve cuánto tiempo lleva cada mes en revisión, con alerta si supera 3 días.

---

### ⭐ Tarea 2.2: Botón de "Ir al Trabajo" Visible

**Archivos a modificar:**

1. `frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`

**Cambios:**

```tsx
// Agregar una columna de acciones
<thead className="bg-slate-50">
  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
    <th className="px-4 py-3">Cliente / Mes</th>
    <th className="px-4 py-3">Estado revisión</th>
    <th className="px-4 py-3">Asignado</th>
    <th className="px-4 py-3">Última actualización</th>
    <th className="px-4 py-3 text-right">Avance</th>
    <th className="px-4 py-3 text-center">Acción</th> {/* NUEVA */}
  </tr>
</thead>

<tbody className="divide-y divide-slate-100 bg-white">
  {pendientesFiltradas.map((item) => (
    <tr key={item.id} className="transition hover:bg-slate-50">
      {/* ... celdas existentes ... */}

      {/* NUEVA CELDA */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/trabajos/${item.trabajoId}?mes=${item.id}`);
          }}
          className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Revisar
        </button>
      </td>
    </tr>
  ))}
</tbody>
```

**Resultado:** Botón obvio de "Revisar" en cada fila para ir directamente al trabajo.

---

### ⭐ Tarea 2.3: Badge de Pendientes en el Menú de Navegación

**Archivos a modificar:**

1. `frontend/src/components/layout/AppShell.tsx` (o donde esté el menú de navegación)

**Cambios:**

```tsx
// Agregar hook para obtener conteo de pendientes
const { data: aprobacionesData } = useAprobacionesDashboard();
const pendientes = aprobacionesData?.resumenEstados?.EN_REVISION || 0;

// En el item del menú:
<NavLink to="/trabajos/aprobaciones" className="...">
  <ShieldCheck className="h-5 w-5" />
  <span>Aprobaciones</span>
  {pendientes > 0 && (
    <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
      {pendientes}
    </span>
  )}
</NavLink>;
```

**Resultado:** El gestor ve un badge con el número de trabajos pendientes de revisión directamente en el menú.

---

## 📋 Checklist de Implementación

### Fase 1 (CRÍTICA - 3-4 horas)

- [ ] **Tarea 1.1.1:** Agregar navegación clickeable en tabla del dashboard
- [ ] **Tarea 1.1.2:** Implementar lectura de parámetro `?mes=` en TrabajoDetail
- [ ] **Tarea 1.1.3:** Agregar auto-scroll y highlight al mes
- [ ] **Tarea 1.2.1:** Crear método `validarMesEditable` en backend
- [ ] **Tarea 1.2.2:** Aplicar validación en método `importar`
- [ ] **Tarea 1.2.3:** Aplicar validación en método `agregarHoja`
- [ ] **Tarea 1.2.4:** Aplicar validación en método `eliminarHoja`
- [ ] **Tarea 1.2.5:** Aplicar validación en método `modificarHoja`
- [ ] **Tarea 1.3.1:** Mejorar manejo de errores en frontend
- [ ] **Tarea 1.3.2:** Mejorar visualización de cambios solicitados

### Fase 2 (RECOMENDADA - 2-3 horas)

- [ ] **Tarea 2.1:** Agregar indicador de tiempo de revisión
- [ ] **Tarea 2.2:** Agregar botón "Revisar" visible en cada fila
- [ ] **Tarea 2.3:** Agregar badge de pendientes en el menú

---

## 🧪 Plan de Pruebas

### Prueba 1: Flujo Completo Miembro → Gestor

1. Como **Miembro**, procesar un mes y enviarlo a revisión
2. Verificar que el botón "Enviar a revisión" desaparezca
3. Intentar importar un nuevo reporte (debe dar error 409)
4. Como **Gestor**, ir al dashboard de aprobaciones
5. Hacer clic en el trabajo pendiente
6. Verificar que llegue al trabajo correcto con el mes expandido
7. Aprobar el mes
8. Verificar que el mes quede en estado `APROBADO`
9. Como **Miembro**, verificar que no pueda editar el mes aprobado

### Prueba 2: Flujo de Rechazo

1. Como **Miembro**, enviar un mes a revisión
2. Como **Gestor**, solicitar cambios con comentario
3. Verificar que el mes vuelva a estado `CAMBIOS_SOLICITADOS`
4. Como **Miembro**, verificar que vea el comentario del gestor destacado
5. Hacer los cambios
6. Volver a enviar a revisión
7. Como **Gestor**, aprobar esta vez
8. Verificar que el flujo se complete correctamente

### Prueba 3: Validaciones Backend

1. Como usuario técnico con Postman/Insomnia
2. Enviar un mes a revisión
3. Intentar llamar a POST `/reportes-mensuales/importar` directamente
4. Verificar que devuelva error 409 con mensaje claro
5. Repetir con otros endpoints de modificación

---

## 🚀 Comandos de Desarrollo

### Backend

```bash
cd backend
npm run start:dev
```

### Frontend

```bash
cd frontend
npm run dev
```

### Verificar compilación

```bash
# Backend
cd backend
npm run build

# Frontend
cd frontend
npm run build
```

---

## 📚 Referencias

**Archivos Clave del Sistema:**

- Estados: `backend/src/trabajos/entities/mes.entity.ts`
- Lógica de revisión: `backend/src/trabajos/services/meses.service.ts`
- Dashboard: `frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`
- Detalle trabajo: `frontend/src/components/trabajos/TrabajoDetail.tsx`
- Tarjeta mes: `frontend/src/components/trabajos/MesCard.tsx`

**Documentación Relacionada:**

- `docs/desarrollo/REPORTE-FLUJO-REVISION-APROBACION.md` (este reporte)
- `docs/mejoras-2025-10-18/permisos-y-flujos.md`

---

## ✅ Criterios de Aceptación

El sistema estará **listo para pruebas con clientes** cuando:

1. ✅ El gestor puede navegar desde el dashboard de aprobaciones a cualquier trabajo con un solo clic
2. ✅ El mes correspondiente se expande automáticamente al llegar al trabajo
3. ✅ Es imposible modificar un mes que está en revisión (validación backend)
4. ✅ Los mensajes de error son claros y le indican al usuario qué hacer
5. ✅ El miembro ve claramente cuando el gestor solicitó cambios
6. ✅ El flujo completo Miembro → Gestor → Aprobación funciona sin fricción

---

**Próximo paso:** ¿Implemento estas mejoras ahora?
