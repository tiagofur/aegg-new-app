# Reporte: Flujo de Revisión y Aprobación de Trabajos

**Fecha:** 25 de octubre, 2025  
**Objetivo:** Analizar el flujo actual de revisión y aprobación, identificar problemas y crear un plan de mejoras para lanzar una primera versión de prueba.

---

## 📋 Resumen Ejecutivo

El sistema tiene implementado un **flujo básico funcional** de revisión y aprobación, pero presenta **problemas críticos de navegación y usabilidad** que deben resolverse antes de lanzar a clientes.

**Estado General:** 🟡 **Funcional pero requiere mejoras urgentes**

---

## ✅ Funcionalidades Implementadas Correctamente

### 1. Envío a Revisión (Miembro)

- ✅ El miembro puede enviar un mes a revisión mediante el botón "Enviar a revisión"
- ✅ Validación: Solo se puede enviar cuando el mes está en estado `COMPLETADO`
- ✅ El `estadoRevision` cambia de `EN_EDICION` → `ENVIADO`
- ✅ Se registra quién envió (`enviadoRevisionPorId`) y cuándo (`fechaEnvioRevision`)
- ✅ El `estadoAprobacion` del trabajo se actualiza automáticamente a `EN_REVISION`

**Archivos involucrados:**

- Backend: `backend/src/trabajos/services/meses.service.ts` (método `enviarRevision`)
- Frontend: `frontend/src/components/trabajos/MesCard.tsx` (método `handleEnviarRevision`)

### 2. Bloqueo de Edición

- ✅ Frontend implementa `isReadOnly = mes.estadoRevision === "ENVIADO" || mes.estadoRevision === "APROBADO"`
- ✅ Muestra mensaje de advertencia: "El mes está en revisión y no puede modificarse..."
- ✅ Botones de edición deshabilitados cuando `isReadOnly === true`
- ✅ El botón "Enviar a revisión" se oculta correctamente

**Archivos involucrados:**

- `frontend/src/components/trabajos/MesCard.tsx`
- `frontend/src/components/trabajos/TrabajoDetail.tsx`

### 3. Dashboard de Aprobaciones

- ✅ Existe la página `/trabajos/aprobaciones` para el gestor
- ✅ Muestra trabajos con meses en estado `ENVIADO` o `CAMBIOS_SOLICITADOS`
- ✅ Filtra correctamente por estado de aprobación
- ✅ Muestra resumen con contadores por estado
- ✅ Muestra línea de tiempo con actividades recientes

**Archivos involucrados:**

- Backend: `backend/src/trabajos/services/aprobaciones.service.ts`
- Frontend: `frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`
- Frontend: `frontend/src/pages/AprobacionesPage.tsx`

### 4. Aprobación del Gestor

- ✅ El gestor puede aprobar el mes desde `MesCard`
- ✅ Validación: Solo Admin o Gestor Responsable pueden aprobar
- ✅ Cambia `estadoRevision` de `ENVIADO` → `APROBADO`
- ✅ Registra quién aprobó (`aprobadoPorId`) y cuándo (`fechaAprobacion`)
- ✅ Actualiza el `estadoAprobacion` del trabajo

**Archivos involucrados:**

- Backend: `backend/src/trabajos/services/meses.service.ts` (método `aprobarMes`)
- Frontend: `frontend/src/components/trabajos/MesCard.tsx` (método `handleAprobarMes`)

### 5. Solicitud de Cambios

- ✅ El gestor puede solicitar cambios con comentarios obligatorios
- ✅ Cambia `estadoRevision` de `ENVIADO` → `CAMBIOS_SOLICITADOS`
- ✅ Si el mes estaba `COMPLETADO`, lo revierte a `EN_PROCESO`
- ✅ Revierte el reporte base (quita el mes de `mesesCompletados`)
- ✅ El miembro puede ver el comentario del gestor
- ✅ El miembro puede volver a editar y enviar a revisión

**Archivos involucrados:**

- Backend: `backend/src/trabajos/services/meses.service.ts` (método `solicitarCambios`)
- Frontend: `frontend/src/components/trabajos/MesCard.tsx` (método `handleSolicitarCambios`)

### 6. Permisos y Validaciones

- ✅ Backend valida permisos en todos los endpoints
- ✅ Solo Admin o Gestor Responsable pueden aprobar/rechazar
- ✅ Solo el miembro asignado puede enviar a revisión
- ✅ Mensajes de error claros

---

## 🔴 Problemas Críticos Identificados

### ❌ 1. NO HAY NAVEGACIÓN DESDE EL DASHBOARD DE APROBACIONES

**Severidad:** 🔴 **CRÍTICA** - Bloquea el flujo completo

**Problema:**  
El gestor ve la lista de trabajos pendientes de revisión en `/trabajos/aprobaciones`, pero **no puede hacer clic** para ir al trabajo y revisar el mes. La tabla es puramente informativa.

**Impacto:**  
El gestor debe:

1. Ver el trabajo en el dashboard de aprobaciones
2. Anotar el nombre del cliente y el año
3. Ir manualmente a `/trabajos`
4. Buscar el trabajo por nombre
5. Hacer clic para abrirlo
6. Buscar el mes específico
7. Expandir el mes
8. Revisar y aprobar/rechazar

**Solución requerida:**  
Agregar enlaces clickeables en la tabla del dashboard de aprobaciones que lleven directamente a:

- Opción A: `/trabajos/{trabajoId}` (llevar al trabajo completo)
- Opción B: `/trabajos/{trabajoId}?mes={mesId}` (llevar al trabajo con el mes específico expandido)

---

### ⚠️ 2. FALTA VALIDACIÓN EN BACKEND PARA BLOQUEAR EDICIONES

**Severidad:** 🟡 **IMPORTANTE** - Puede causar inconsistencias

**Problema:**  
Aunque el frontend bloquea la edición cuando `estadoRevision === "ENVIADO"`, un usuario técnico podría hacer llamadas directas a la API para modificar reportes de un mes en revisión.

**Impacto:**

- Riesgo de que se modifiquen datos mientras el gestor está revisando
- Inconsistencias entre lo que el gestor vio y lo que se aprobó

**Archivos a modificar:**

- `backend/src/trabajos/services/reportes-mensuales.service.ts`

**Solución requerida:**  
Agregar validación en los métodos de edición de reportes:

```typescript
if (
  mes.estadoRevision === EstadoRevisionMes.ENVIADO ||
  mes.estadoRevision === EstadoRevisionMes.APROBADO
) {
  throw new ConflictException(
    "No puedes modificar reportes de un mes que está en revisión o aprobado. " +
      "Solicita al gestor que rechace el mes si necesitas hacer cambios."
  );
}
```

---

### ⚠️ 3. FALTA PREVISUALIZACIÓN EN EL DASHBOARD

**Severidad:** 🟢 **MEJORABLE** - No bloquea, pero mejora mucho la UX

**Problema:**  
El dashboard de aprobaciones muestra información básica, pero el gestor no puede ver:

- Qué reportes contiene el mes
- Cuántas hojas Excel tiene cada reporte
- Vista previa rápida del contenido

**Solución requerida:**  
Agregar un modal o panel expandible en el dashboard con:

- Lista de reportes del mes
- Resumen de hojas y datos clave
- Botones de aprobar/rechazar directamente desde el dashboard

---

## 📝 Plan de Implementación

### Fase 1: Solución de Problemas Críticos (URGENTE)

**Prioridad:** 🔴 Alta  
**Tiempo estimado:** 3-4 horas

#### Tarea 1.1: Agregar Navegación en el Dashboard

**Archivos a modificar:**

- `frontend/src/features/trabajos/aprobaciones/components/AprobacionesDashboard.tsx`

**Cambios:**

```tsx
// En la tabla, hacer la fila clickeable
<tr
  key={item.id}
  onClick={() => navigate(`/trabajos/${item.trabajoId}?mes=${item.id}`)}
  className="transition hover:bg-slate-50 cursor-pointer"
>
  {/* contenido actual */}
</tr>
```

**También necesitamos:**

- Modificar `TrabajoDetail.tsx` para leer el parámetro `mes` de la URL y expandir automáticamente ese mes
- Agregar scroll automático al mes expandido

#### Tarea 1.2: Agregar Validaciones en Backend

**Archivos a modificar:**

- `backend/src/trabajos/services/reportes-mensuales.service.ts`

**Métodos a proteger:**

- `importar()` - Validar antes de importar nuevo archivo
- `agregarHoja()` - Validar antes de agregar hoja
- `eliminarHoja()` - Validar antes de eliminar hoja
- `modificarHoja()` - Validar antes de modificar hoja

**Implementación:**

```typescript
private async validarMesEditable(mesId: string): Promise<void> {
    const mes = await this.mesRepository.findOne({
        where: { id: mesId },
        relations: ['trabajo']
    });

    if (!mes) {
        throw new NotFoundException('Mes no encontrado');
    }

    if (mes.estadoRevision === EstadoRevisionMes.ENVIADO) {
        throw new ConflictException(
            'El mes está en revisión. No puedes modificarlo hasta que el gestor lo apruebe o rechace.'
        );
    }

    if (mes.estadoRevision === EstadoRevisionMes.APROBADO) {
        throw new ConflictException(
            'El mes está aprobado. Contacta al gestor responsable si necesitas reabrirlo.'
        );
    }
}
```

---

### Fase 2: Mejoras de UX (IMPORTANTE)

**Prioridad:** 🟡 Media  
**Tiempo estimado:** 4-6 horas

#### Tarea 2.1: Mejorar Visualización del Dashboard

**Crear nuevo componente:**

- `frontend/src/features/trabajos/aprobaciones/components/AprobacionPreviewModal.tsx`

**Funcionalidad:**

- Modal que se abre al hacer clic en un ícono "Ver detalles"
- Muestra lista de reportes del mes
- Muestra resumen de datos
- Botones de aprobar/rechazar dentro del modal

#### Tarea 2.2: Agregar Notificaciones Visuales

**Modificar:**

- `frontend/src/components/trabajos/MesCard.tsx`

**Agregar:**

- Badge más visible cuando hay comentarios del gestor
- Animación o highlight cuando el estado cambia
- Contador de días desde que se envió a revisión

#### Tarea 2.3: Auto-scroll al Mes en TrabajoDetail

**Modificar:**

- `frontend/src/components/trabajos/TrabajoDetail.tsx`

**Implementar:**

```typescript
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const mesIdParam = params.get("mes");

  if (mesIdParam) {
    // Expandir el mes automáticamente
    setMesSeleccionado(parseInt(mesIdFromList));

    // Hacer scroll al mes
    setTimeout(() => {
      const mesElement = document.getElementById(`mes-${mesIdParam}`);
      mesElement?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  }
}, [location.search]);
```

---

### Fase 3: Optimizaciones Adicionales (OPCIONAL)

**Prioridad:** 🟢 Baja  
**Tiempo estimado:** 2-3 horas

#### Tarea 3.1: Filtros Avanzados en Dashboard

- Filtro por gestor responsable
- Filtro por fecha de envío
- Filtro por cliente

#### Tarea 3.2: Métricas y Analytics

- Tiempo promedio de revisión
- Tasa de aprobación vs rechazo
- Meses más problemáticos

#### Tarea 3.3: Notificaciones por Email

- Email al gestor cuando un mes se envía a revisión
- Email al miembro cuando un mes es aprobado/rechazado

---

## 🎯 Recomendación para Primera Versión de Prueba

Para lanzar una **versión de prueba funcional a clientes**, debes completar como mínimo:

### ✅ Requisitos Mínimos (Fase 1 completa):

1. ✅ Navegación desde dashboard de aprobaciones al trabajo específico
2. ✅ Validaciones en backend para bloquear ediciones
3. ✅ Auto-expansión del mes al llegar desde el dashboard

### 🎁 Recomendado Agregar (Fase 2.1 y 2.2):

4. ⭐ Preview modal en el dashboard (mejora mucho la experiencia)
5. ⭐ Notificaciones visuales claras de cambios solicitados

### ⏰ Tiempo Total Estimado:

- **Mínimo:** 3-4 horas (solo Fase 1)
- **Recomendado:** 7-10 horas (Fase 1 + Fase 2.1 y 2.2)

---

## 📊 Resumen de Estados del Flujo

### Estados de Mes (`estadoRevision`):

1. **EN_EDICION** - El miembro está trabajando
2. **ENVIADO** - En revisión del gestor (bloqueado para edición)
3. **APROBADO** - Aprobado por el gestor (bloqueado permanentemente)
4. **CAMBIOS_SOLICITADOS** - Rechazado, vuelve al miembro para editar

### Estados de Trabajo (`estadoAprobacion`):

1. **EN_PROGRESO** - Trabajo en curso
2. **EN_REVISION** - Al menos un mes enviado a revisión
3. **APROBADO** - Todos los meses aprobados
4. **REABIERTO** - Al menos un mes con cambios solicitados

### Flujo Completo:

```
[Miembro trabaja] → EN_EDICION
       ↓
[Procesa y guarda] → COMPLETADO (estado mes)
       ↓
[Envía a revisión] → ENVIADO (bloqueado)
       ↓
   [Gestor revisa]
       ↓
   ┌───────┴────────┐
   ↓                ↓
[Aprueba]      [Rechaza]
   ↓                ↓
APROBADO    CAMBIOS_SOLICITADOS
(final)      (vuelve a EN_EDICION)
```

---

## 🚀 Siguiente Paso Inmediato

**ACCIÓN REQUERIDA:** Implementar Fase 1 (Tarea 1.1 y 1.2)

¿Quieres que proceda a implementar estas mejoras críticas ahora?

1. Agregar navegación clickeable en el dashboard
2. Agregar validaciones en backend
3. Implementar auto-expansión del mes

Esto tomará aproximadamente 3-4 horas y dejará el sistema listo para una primera versión de prueba con clientes.
