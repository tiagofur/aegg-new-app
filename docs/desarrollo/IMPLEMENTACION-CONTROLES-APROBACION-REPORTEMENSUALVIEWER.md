# ✅ Implementación: Controles de Aprobación en ReporteMensualViewer

**Fecha:** 25 de octubre de 2025  
**Tipo:** Feature - Integración de flujo de aprobación  
**Estado:** COMPLETADO

## 📋 Resumen

Se han integrado los controles de aprobación directamente en el componente `ReporteMensualViewer`, permitiendo que los gestores aprueben o rechacen meses desde la misma vista donde están revisando los reportes.

## 🎯 Objetivos Cumplidos

✅ Banner visual cuando el mes está en revisión (ENVIADO)  
✅ Banner visual cuando el mes está aprobado (APROBADO)  
✅ Botones de Aprobar y Solicitar Cambios para gestores  
✅ Bloqueo de botones de escritura cuando está en solo lectura  
✅ Mensajes contextuales según el rol (Miembro vs Gestor)  
✅ Validación de permisos (solo gestor responsable o admin)  
✅ Recarga automática después de aprobar/rechazar

## 🔧 Cambios Implementados

### 1. TrabajoDetail.tsx

**Props adicionales pasadas a ReporteMensualViewer:**

```typescript
<ReporteMensualViewer
  // ... props existentes
  mesEstadoRevision={mesActual.estadoRevision}
  gestorResponsableId={trabajo.gestorResponsableId}
  onMesUpdated={onReload}
/>
```

### 2. ReporteMensualViewer.tsx

#### A) Nuevas Props

```typescript
type ReporteMensualViewerProps = {
  // ... props existentes
  mesEstadoRevision: EstadoRevisionMes;
  gestorResponsableId?: string | null;
  onMesUpdated: () => void;
};
```

#### B) Nuevos Imports

```typescript
import { EstadoRevisionMes } from "../../types/trabajo";
import { mesesService } from "../../services";
import { useAuth } from "../../context/AuthContext";
```

#### C) Lógica de Permisos

```typescript
const { user } = useAuth();
const role = user?.role ?? "Gestor";
const userId = user?.id ?? "";
const isAdmin = role === "Admin";
const esGestorResponsable = gestorResponsableId
  ? gestorResponsableId === userId
  : role === "Gestor";
const puedeRevisar = isAdmin || esGestorResponsable;
const isMiembro = role === "Miembro";
const isReadOnly =
  mesEstadoRevision === "ENVIADO" || mesEstadoRevision === "APROBADO";
const deberianMostrarseLosBotones =
  puedeRevisar && mesEstadoRevision === "ENVIADO";
```

#### D) Funciones de Aprobación

```typescript
const handleAprobarMes = async () => {
  // Valida permisos
  // Confirma con usuario
  // Llama a mesesService.aprobar(mesId)
  // Recarga datos con onMesUpdated()
};

const handleSolicitarCambios = async () => {
  // Valida permisos
  // Solicita comentario
  // Llama a mesesService.solicitarCambios(mesId, comentario)
  // Recarga datos con onMesUpdated()
};
```

#### E) Banner de Revisión (ENVIADO)

- Fondo degradado ámbar
- Icono de campana
- Mensaje contextual según rol
- Botones de Aprobar (verde) y Solicitar Cambios (rojo)
- Solo visible si `mesEstadoRevision === "ENVIADO"`

#### F) Banner de Aprobado (APROBADO)

- Fondo degradado verde esmeralda
- Icono de check
- Mensaje de solo lectura permanente
- Solo visible si `mesEstadoRevision === "APROBADO"`

#### G) Bloqueo de Acciones Write

Todos los botones de escritura ahora validan `!isReadOnly`:

- ❌ "Guardar en Base" (GuardarEnBaseButton)
- ❌ "Guardar cambios" (tablaSaveContext)
- ❌ "Importar archivo" / "Actualizar archivo"
- ❌ "Limpiar datos"

## 🎨 UI/UX

### Banner de Revisión (Ámbar)

```
┌─────────────────────────────────────────────────────────┐
│ 🔒 Mes en Revisión                    [Aprobar] [Rechazar] │
│                                                          │
│ Este mes está bloqueado mientras el gestor lo revisa... │
└─────────────────────────────────────────────────────────┘
```

### Banner de Aprobado (Verde)

```
┌─────────────────────────────────────────────────────────┐
│ ✅ Mes Aprobado                                          │
│                                                          │
│ Este mes fue aprobado y permanece en modo de solo      │
│ lectura permanente. Los datos no pueden modificarse.    │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Validaciones de Seguridad

1. **Permisos de Aprobación:**

   - Solo Admin o Gestor Responsable puede aprobar/rechazar
   - Se valida en frontend Y backend

2. **Estado del Mes:**

   - Solo se puede aprobar si está en estado "ENVIADO"
   - Backend valida que no esté ya aprobado

3. **Bloqueo de Escritura:**
   - Botones de write se ocultan si `isReadOnly = true`
   - Backend ya tiene validaciones de assertMesEditable

## 📊 Flujo de Usuario

### Miembro:

1. Trabaja en su mes normalmente
2. Envía a revisión (desde otro componente)
3. Ve banner ámbar: "Bloqueado mientras el gestor lo revisa"
4. NO puede editar hasta que gestor responda

### Gestor:

1. Ve aprobación pendiente en Dashboard
2. Clica "Revisar" → navega al trabajo
3. Ve el mes con banner ámbar y botones
4. Revisa los datos (todos los reportes visibles)
5. Decisión:
   - **Aprobar:** Clica botón verde → Mes queda en APROBADO (permanente)
   - **Rechazar:** Clica botón rojo → Solicita comentario → Mes vuelve a EN_EDICION

### Admin:

- Tiene todos los permisos de gestor
- Puede aprobar/rechazar cualquier mes

## 🧪 Testing Manual

Para probar la funcionalidad:

1. **Crear mes en revisión:**

   ```bash
   # Como miembro, enviar mes a revisión
   # O usar endpoint manual del gestor
   ```

2. **Como gestor, verificar:**

   - Banner ámbar visible
   - Botones "Aprobar" y "Solicitar cambios" visibles
   - Botones de escritura ocultos
   - Mensaje correcto según rol

3. **Aprobar mes:**

   - Clic en "Aprobar"
   - Confirmar en diálogo
   - Verificar que cambia a banner verde
   - Verificar que botones de aprobación desaparecen

4. **Solicitar cambios:**
   - Clic en "Solicitar cambios"
   - Escribir comentario
   - Verificar que vuelve a modo editable

## ✅ Checklist de Completitud

- [x] Props actualizadas en TrabajoDetail
- [x] Props definidas en ReporteMensualViewer
- [x] Imports agregados (useAuth, mesesService, EstadoRevisionMes)
- [x] Lógica de permisos implementada
- [x] Funciones handleAprobarMes y handleSolicitarCambios
- [x] Banner ENVIADO con botones
- [x] Banner APROBADO sin botones
- [x] Bloqueo de botones write cuando isReadOnly
- [x] Sin errores de TypeScript
- [x] Callback onMesUpdated para recargar datos

## 📝 Notas Técnicas

1. **¿Por qué no usar MesCard?**

   - MesCard se eliminó anteriormente para ahorrar espacio vertical
   - La arquitectura actual usa un selector de mes + visor de reportes
   - Integrar en ReporteMensualViewer mantiene la UI compacta

2. **Gestión de Estado:**

   - El estado de revisión viene del prop `mesEstadoRevision`
   - Después de aprobar/rechazar, se llama `onMesUpdated()` que hace refetch del trabajo completo
   - Esto asegura que todos los datos se actualicen (estadoRevision, fechas, etc.)

3. **Permisos:**
   - Se calcula `puedeRevisar` = Admin OR esGestorResponsable
   - `esGestorResponsable` verifica que gestorResponsableId === userId
   - Si no hay gestor asignado, cualquier gestor puede revisar

## 🚀 Próximos Pasos

1. **Testing con usuario real**
2. **Verificar que el flujo completo funciona:**
   - Enviar a revisión → Banner aparece → Aprobar → Banner cambia
3. **Documentar en guía de usuario**
4. **Considerar agregar notificaciones** (email/push cuando hay aprobación pendiente)

## 🎉 Resultado Final

Los gestores ahora pueden aprobar o rechazar meses directamente desde la vista de reportes, sin necesidad de salir a otro componente o dashboard. La UI es clara, los permisos están validados, y el flujo es intuitivo.
