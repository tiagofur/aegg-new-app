# 🔍 Análisis: Flujo de Aprobación - Estado Actual

**Fecha:** 25 de octubre de 2025  
**Usuario Reportante:** Gestor  
**Problema:** Falta claridad en UI de aprobación

---

## 📋 Problemas Identificados

### 1. Botones de Aprobar/Rechazar No Visibles

**Ubicación:** `MesCard.tsx` líneas 592-678

**Condición actual:**

```typescript
{
  puedeRevisar && mes.estadoRevision === "ENVIADO" && (
    <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
      <button onClick={handleAprobarMes}>Aprobar mes</button>
      <button onClick={handleSolicitarCambios}>Solicitar cambios</button>
    </div>
  );
}
```

**¿Por qué no se ven?**

- Posiblemente el mes está colapsado
- La sección expandida necesita estar visible
- El usuario necesita saber que debe expandir el mes

---

### 2. Frontend Permite Edición Visual

**Estado actual:**

```typescript
const isReadOnly =
  mes.estadoRevision === "ENVIADO" || mes.estadoRevision === "APROBADO";
```

✅ **Esto SÍ funciona correctamente:**

- Se calcula `isReadOnly` correctamente
- Se pasa a `ReporteCard`
- El backend bloquea modificaciones

❓ **Pero el feedback visual podría ser mejor:**

- Los reportes deberían mostrar un mensaje claro
- Los botones de importar deberían estar visualmente deshabilitados

---

### 3. Auto-aprobación del Gestor

**Escenario actual:**

- Un gestor puede crear un trabajo
- Asignarse a sí mismo como gestor
- Enviar a revisión
- Aprobar su propio trabajo

**¿Es esto correcto?**

- Técnicamente sí, si el gestor es responsable
- Pero podría requerir validación adicional según reglas de negocio
- En algunas organizaciones esto no es permitido

---

## ✅ Funcionalidad que SÍ Existe (Confirmado)

### Backend - Endpoints

- ✅ `PATCH /meses/:id/aprobar` - Aprobar mes
- ✅ `PATCH /meses/:id/solicitar-cambios` - Rechazar y solicitar cambios
- ✅ `PATCH /meses/:id/enviar-revision` - Enviar a revisión

### Frontend - Servicios

```typescript
// frontend/src/services/meses.service.ts
async aprobar(id: string): Promise<Mes>
async solicitarCambios(id: string, comentario: string): Promise<Mes>
async enviarRevision(id: string, comentario?: string): Promise<Mes>
```

### Frontend - Handlers en MesCard

```typescript
handleAprobarMes(); // Línea 211
handleSolicitarCambios(); // Línea 229
handleEnviarRevision(); // Línea 131
```

### Frontend - Botones UI

- ✅ Botón "Aprobar mes" (línea 593)
- ✅ Botón "Solicitar cambios" (línea 642)
- ✅ Botón "Enviar a revisión" (línea 545)

---

## 🎯 Soluciones Propuestas

### Solución 1: Auto-expandir Mes en Revisión ✅

Cuando un gestor entra desde el dashboard de aprobaciones, el mes debería:

1. Auto-expandirse
2. Hacer scroll a la vista
3. Mostrar los botones de aprobar/rechazar

**Ya implementado en Tarea 1.1** ✅

---

### Solución 2: Indicador Visual en Header del Mes

Agregar un badge o indicador en el header del mes colapsado:

```tsx
{puedeRevisar && mes.estadoRevision === "ENVIADO" && (
  <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-semibold">
    <svg className="h-4 w-4" ...>
    Pendiente tu revisión
  </span>
)}
```

---

### Solución 3: Mejorar Mensaje de isReadOnly

En `ReporteCard`, cuando `isReadOnly`:

**Antes:**

- Simplemente deshabilita botones
- No hay mensaje claro

**Después:**

- Mostrar banner explicativo:

```tsx
{
  isReadOnly && (
    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded">
      <p className="text-sm text-blue-800">
        🔒 Este reporte está bloqueado porque el mes está{" "}
        {mes.estadoRevision === "ENVIADO" ? "en revisión" : "aprobado"}
      </p>
    </div>
  );
}
```

---

### Solución 4: Deshabilitar Auto-aprobación (Opcional)

Si se requiere prevenir que un gestor apruebe su propio trabajo:

```typescript
const handleAprobarMes = async () => {
  // Verificar que el gestor no sea quien envió a revisión
  if (mes.enviadoRevisionPorId === userId) {
    alert("No puedes aprobar un mes que tú mismo enviaste a revisión.");
    return;
  }

  // ... resto del código
};
```

**Pregunta de negocio:** ¿Debe permitirse auto-aprobación?

---

## 🔄 Flujo Esperado (Correcto)

### Como Miembro:

1. Importar reportes
2. Procesar y guardar
3. **Enviar a revisión** → Estado: ENVIADO
4. ❌ **No puede editar** (frontend deshabilita, backend bloquea)
5. Espera respuesta del gestor

### Como Gestor:

1. Ve notificación en badge del menú (✅ Ya implementado)
2. Entra al dashboard de aprobaciones (✅ Ya implementado)
3. Click en trabajo pendiente (✅ Ya implementado)
4. Mes se auto-expande (✅ Ya implementado Tarea 1.1)
5. **Ve botones de Aprobar/Rechazar** ← Necesita estar visible
6. Revisa reportes
7. Opciones:
   - **Aprobar** → Estado: APROBADO (permanente)
   - **Rechazar** → Estado: CAMBIOS_SOLICITADOS (permite editar)

### Después de Aprobar:

- ❌ Nadie puede editar (permanente)
- ✅ Se guarda quién aprobó y cuándo

### Después de Rechazar:

- ✅ Miembro puede editar de nuevo
- ✅ Ve mensaje con los cambios solicitados (✅ Ya mejorado Tarea 1.3)
- 🔄 Puede volver a enviar a revisión

---

## 🧪 Pasos para Verificar

1. **Como Miembro:**

   - [ ] Crear trabajo o usar existente
   - [ ] Importar 3 reportes
   - [ ] Procesar y guardar
   - [ ] Enviar a revisión
   - [ ] Verificar que no puede editar más

2. **Como Gestor:**

   - [ ] Ver badge en menú con contador
   - [ ] Ir a dashboard de aprobaciones
   - [ ] Ver trabajo en lista
   - [ ] Click en trabajo
   - [ ] **Verificar que mes está expandido**
   - [ ] **Verificar que botones Aprobar/Rechazar están visibles**
   - [ ] Aprobar el mes
   - [ ] Verificar que nadie puede editar

3. **Flujo de Rechazo:**
   - [ ] Crear otro mes y enviar a revisión
   - [ ] Como gestor, solicitar cambios
   - [ ] Como miembro, ver mensaje de cambios solicitados
   - [ ] Editar y volver a enviar

---

## 🎯 Recomendación Inmediata

**El problema principal es de UX, no de funcionalidad:**

1. ✅ La funcionalidad existe y funciona
2. ❓ Los botones pueden no estar visibles por estar colapsado
3. 💡 Necesitamos mejorar el feedback visual

**Soluciones priorizadas:**

1. 🔥 **Alta:** Verificar auto-expand funciona desde dashboard
2. 🔥 **Alta:** Agregar indicador "Pendiente tu revisión" en header
3. 🟡 **Media:** Mejorar mensaje isReadOnly en reportes
4. 🟢 **Baja:** Evaluar si permitir auto-aprobación

---

## 💬 Preguntas para el Usuario

1. **¿El mes se expande automáticamente cuando entras desde el dashboard?**

   - Si no: Revisar Tarea 1.1
   - Si sí: Verificar que botones estén dentro de la sección expandida

2. **¿Ves los botones cuando expandes manualmente el mes?**

   - Si no: Verificar condición `puedeRevisar`
   - Si sí: El problema es solo que no auto-expande

3. **¿Quieres permitir que un gestor apruebe su propio trabajo?**

   - Sí: Funcionalidad actual está bien
   - No: Implementar validación adicional

4. **¿El frontend muestra claramente que un mes está bloqueado?**
   - Si no: Implementar mensajes visuales mejorados

---

**Siguiente paso:** Implementar mejoras visuales según respuestas del usuario
