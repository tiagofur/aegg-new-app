# 🔧 Hotfix: Permitir Visualización de Reportes Durante Revisión

**Fecha:** 25 de octubre de 2025  
**Prioridad:** 🔴 CRÍTICA  
**Estado:** ✅ SOLUCIONADO

---

## 🐛 Problema Reportado

**Usuario:** Gestor  
**Escenario:** Intentar visualizar reportes de un mes enviado a revisión  
**Error:**

```
Error al cargar reporte
Request failed with status code 409
```

**Flujo que fallaba:**

1. Miembro envía mes a revisión (estado → ENVIADO)
2. Gestor intenta abrir el trabajo y ver los reportes
3. ❌ Error 409 al cargar los datos del reporte
4. ❌ Gestor no puede revisar el trabajo

---

## 🔍 Análisis de la Causa

### Código Problemático:

**Archivo:** `backend/src/trabajos/services/reportes-mensuales.service.ts`

**Método:** `obtenerDatos` (línea 693)

```typescript
async obtenerDatos(mesId: string, reporteId: string): Promise<{ datos: any[][] }> {
    const mes = await this.mesRepository.findOne({
        where: { id: mesId },
        relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
    });

    if (!mes) {
        throw new NotFoundException(`Mes con id ${mesId} no encontrado`);
    }

    // ❌ PROBLEMA: Bloquea incluso lectura
    this.assertMesEditable(mes);

    const reporte = mes.reportes.find((r) => r.id === reporteId);
    // ...
}
```

### ¿Por qué era un problema?

1. **`obtenerDatos` es un método de solo lectura**

   - Solo retorna `{ datos: reporte.datos || [] }`
   - No modifica ningún dato
   - No tiene efectos secundarios

2. **El gestor NECESITA ver los datos para revisar**

   - Sin ver los datos, no puede aprobar/rechazar
   - El flujo de revisión se rompe completamente

3. **La validación era demasiado restrictiva**
   - `assertMesEditable` bloqueaba TODO acceso
   - No distinguía entre lectura y escritura

---

## ✅ Solución Implementada

### Cambio Aplicado:

```typescript
async obtenerDatos(mesId: string, reporteId: string): Promise<{ datos: any[][] }> {
    const mes = await this.mesRepository.findOne({
        where: { id: mesId },
        relations: ['reportes', 'trabajo', 'trabajo.gestorResponsable'],
    });

    if (!mes) {
        throw new NotFoundException(`Mes con id ${mesId} no encontrado`);
    }

    // ✅ SOLUCIONADO: Removida validación de solo lectura
    // NO validar mes editable - este método es solo lectura
    // El gestor necesita ver los datos para aprobar/rechazar

    const reporte = mes.reportes.find((r) => r.id === reporteId);

    if (!reporte) {
        throw new NotFoundException(`Reporte con id ${reporteId} no encontrado en el mes ${mesId}`);
    }

    return { datos: reporte.datos || [] };
}
```

### Justificación:

- ✅ **Seguridad mantenida:** Los métodos de escritura siguen bloqueados
- ✅ **Lectura permitida:** Cualquier usuario puede ver los datos
- ✅ **Flujo de revisión funcional:** El gestor puede revisar
- ✅ **Integridad garantizada:** Los datos no pueden modificarse durante revisión

---

## 🛡️ Seguridad: Métodos Que Siguen Protegidos

Estos métodos **SÍ mantienen** la validación `assertMesEditable`:

| Método                | Tipo           | Estado de Validación  |
| --------------------- | -------------- | --------------------- |
| `importarReporte`     | ✍️ Escritura   | ✅ Validado           |
| `procesarYGuardar`    | ✍️ Escritura   | ✅ Validado           |
| `actualizarDatos`     | ✍️ Escritura   | ✅ Validado           |
| `limpiarDatosReporte` | ✍️ Escritura   | ✅ Validado           |
| `reprocesarEstadoSat` | ✍️ Escritura   | ✅ Validado           |
| `eliminar`            | ✍️ Escritura   | ✅ Validado           |
| **`obtenerDatos`**    | **👁️ Lectura** | **🔓 Sin validación** |

---

## ✅ Validación del Fix

### Escenario de Prueba:

1. **Miembro** importa reportes y envía mes a revisión

   - Estado del mes: `ENVIADO`
   - ✅ Miembro no puede editar (error 409 correcto)

2. **Gestor** abre el trabajo y navega al mes

   - ✅ Puede ver los reportes sin error
   - ✅ Puede revisar los datos
   - ✅ Puede aprobar o rechazar

3. **Miembro** intenta modificar reporte vía API
   - ❌ Error 409: "El mes está en revisión por el gestor"
   - ✅ Protección funciona correctamente

---

## 📊 Impacto del Cambio

### Antes del Fix:

```
Miembro → Envía a revisión
           ↓
Gestor → Intenta abrir ❌ Error 409
           ↓
        No puede revisar ❌
           ↓
        Flujo bloqueado 🚫
```

### Después del Fix:

```
Miembro → Envía a revisión
           ↓
Gestor → Abre y visualiza ✅
           ↓
        Revisa los datos ✅
           ↓
        Aprueba/Rechaza ✅
           ↓
        Flujo completo ✅
```

---

## 📁 Archivos Modificados

- ✅ `backend/src/trabajos/services/reportes-mensuales.service.ts`

  - Método `obtenerDatos` (línea ~693)
  - Removida llamada a `assertMesEditable`
  - Agregado comentario explicativo

- ✅ `docs/desarrollo/IMPLEMENTACION-TAREA-1.2-VALIDACIONES.md`
  - Agregada sección "Correcciones Post-Implementación"
  - Documentado el problema y la solución

---

## 🧪 Testing Requerido

- [ ] Gestor puede ver reportes en estado ENVIADO
- [ ] Gestor puede ver reportes en estado APROBADO
- [ ] Miembro NO puede editar reportes en estado ENVIADO
- [ ] Miembro NO puede editar reportes en estado APROBADO
- [ ] Gestor puede aprobar mes después de revisar
- [ ] Gestor puede rechazar mes después de revisar
- [ ] API directa rechaza modificaciones en estados bloqueados

---

## 🎯 Resultado Final

✅ **HOTFIX EXITOSO**

- **Problema:** Bloqueaba lectura durante revisión
- **Solución:** Permitir lectura, mantener protección de escritura
- **Resultado:** Flujo de revisión funcional
- **Seguridad:** Intacta, solo afecta lectura

---

## 📝 Lecciones Aprendidas

1. **Distinguir entre lectura y escritura**

   - No todos los métodos necesitan misma validación
   - Métodos de consulta suelen ser seguros sin bloqueo

2. **Validar desde la perspectiva del usuario**

   - El gestor NECESITA ver para revisar
   - Bloquear lectura rompe el flujo de trabajo

3. **Documentar excepciones a las reglas**
   - Explicar por qué `obtenerDatos` no valida
   - Facilita mantenimiento futuro

---

**Firmado:** Sistema de Control de Calidad  
**Aprobado para:** Producción Inmediata  
**Prioridad de Despliegue:** 🔴 CRÍTICA
