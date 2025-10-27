# 🔍 Troubleshooting: Botones de Aprobación No Aparecen

**Fecha:** 25 de octubre de 2025  
**Problema:** Botones de Aprobar/Rechazar no se muestran  
**Estado:** 🔧 DIAGNOSTICANDO

---

## ✅ Verificaciones Implementadas

Se agregaron logs de debug en `MesCard.tsx` para diagnosticar el problema.

### Logs Agregados:

```typescript
React.useEffect(() => {
  console.log("🔍 MesCard DEBUG:", {
    mesNombre: MESES_NOMBRES[mes.mes - 1],
    estadoRevision: mes.estadoRevision,
    puedeRevisar,
    esGestorResponsable,
    gestorResponsableId,
    userId,
    role,
    isAdmin,
    esGestor,
    deberianMostrarseLosBotones:
      puedeRevisar && mes.estadoRevision === "ENVIADO",
  });
}, [mes.estadoRevision, puedeRevisar, mes.mes]);
```

---

## 🧪 Pasos para Diagnosticar

### 1. Verifica la Consola del Navegador

**Instrucciones:**

1. Abre el navegador (Chrome/Edge)
2. Presiona `F12` para abrir DevTools
3. Ve a la pestaña **Console**
4. Navega a un trabajo con un mes en revisión
5. Expande el mes
6. Busca el log que dice `🔍 MesCard DEBUG:`

**Qué buscar en el log:**

```javascript
{
  mesNombre: "Enero",              // ← Nombre del mes
  estadoRevision: "ENVIADO",       // ← DEBE ser "ENVIADO" para ver botones
  puedeRevisar: true,              // ← DEBE ser true
  esGestorResponsable: true,       // ← DEBE ser true para gestores
  gestorResponsableId: "xxx",      // ← ID del gestor responsable
  userId: "yyy",                   // ← Tu ID de usuario
  role: "Gestor",                  // ← Tu rol
  isAdmin: false,                  // ← Si eres admin
  esGestor: true,                  // ← Si tienes rol Gestor
  deberianMostrarseLosBotones: true  // ← RESULTADO FINAL
}
```

---

## 🎯 Escenarios Posibles

### Escenario 1: `estadoRevision` NO es "ENVIADO"

**Síntomas:**

```javascript
estadoRevision: "EN_EDICION"; // ← No es ENVIADO
deberianMostrarseLosBotones: false;
```

**Causa:** El mes no ha sido enviado a revisión todavía

**Solución:**

1. Como miembro (o gestor):
2. Importar los 3 reportes
3. Procesar y guardar
4. Hacer click en "Enviar a revisión"
5. Verificar que el badge cambie a "En revisión"

---

### Escenario 2: `puedeRevisar` es false

**Síntomas:**

```javascript
estadoRevision: "ENVIADO"; // ← Correcto
puedeRevisar: false; // ← PROBLEMA
esGestorResponsable: false; // ← No eres el gestor responsable
deberianMostrarseLosBotones: false;
```

**Causas posibles:**

#### A. No eres el gestor responsable del trabajo

```javascript
gestorResponsableId: "user-123";
userId: "user-456"; // ← IDs no coinciden
```

**Solución:**

- El trabajo debe tener asignado el gestor correcto
- O debes ser Admin

#### B. El trabajo no tiene gestor asignado

```javascript
gestorResponsableId: null; // ← No hay gestor
esGestorResponsable: true; // ← Todos los gestores pueden revisar
```

**Solución:** Debería funcionar si eres Gestor

#### C. Tu usuario no tiene rol Gestor ni Admin

```javascript
role: "Miembro"; // ← No tienes permiso
puedeRevisar: false;
```

**Solución:** Necesitas ser Gestor o Admin

---

### Escenario 3: El mes está colapsado

**Síntomas:**

- El log aparece en consola
- Todo está correcto (`deberianMostrarseLosBotones: true`)
- Pero no ves los botones

**Causa:** El mes está colapsado y los botones están dentro del `{expanded && ...}`

**Solución:**

- Hacer click en el header del mes para expandirlo
- Verificar el indicador "¡REVISAR AHORA!" en el header
- Si está colapsado, los botones no se ven

---

### Escenario 4: Frontend no se recompiló

**Síntomas:**

- No aparece el log `🔍 MesCard DEBUG:` en consola
- No ves el indicador "¡REVISAR AHORA!"

**Causa:** El código no se actualizó

**Solución:**

1. En la terminal del frontend (donde corre Vite):
   ```bash
   # Detener (Ctrl+C)
   # Volver a iniciar
   npm run dev
   ```
2. En el navegador:
   ```
   Ctrl + Shift + R  (recarga dura)
   ```
3. Verificar que no haya errores de compilación en terminal

---

## 📋 Checklist de Verificación

Sigue estos pasos en orden:

### Paso 1: Verificar Compilación

- [ ] El frontend está corriendo (`npm run dev`)
- [ ] No hay errores en la terminal del frontend
- [ ] La página carga sin errores

### Paso 2: Verificar Estado del Mes

- [ ] Abrir DevTools (F12)
- [ ] Navegar al trabajo
- [ ] Expandir el mes
- [ ] Ver log `🔍 MesCard DEBUG:` en consola
- [ ] Copiar el log completo

### Paso 3: Verificar Valores en Log

- [ ] `estadoRevision` es "ENVIADO"
- [ ] `puedeRevisar` es `true`
- [ ] `deberianMostrarseLosBotones` es `true`

### Paso 4: Verificar UI

- [ ] El mes está **expandido** (no colapsado)
- [ ] Aparece el indicador "¡REVISAR AHORA!" en el header
- [ ] Aparece el banner ámbar "🔒 Mes en Revisión"
- [ ] Aparecen los botones verde (Aprobar) y rojo (Solicitar cambios)

---

## 🔧 Soluciones Rápidas

### Si el mes no está en ENVIADO:

```bash
# Backend debe estar corriendo
# Frontend debe estar corriendo
# Como miembro o gestor:
1. Importar reportes
2. Procesar y guardar
3. Click "Enviar a revisión"
```

### Si puedeRevisar es false:

```bash
# Verificar en el frontend:
1. ¿Eres Admin o Gestor?
2. ¿El trabajo tiene gestor asignado?
3. ¿Eres el gestor asignado?
```

### Si no aparece el log:

```bash
# En terminal frontend:
Ctrl+C
npm run dev

# En navegador:
Ctrl+Shift+R
F12 → Console
```

### Si el mes está colapsado:

```bash
# Simplemente:
Click en el header del mes para expandirlo
```

---

## 📸 Capturas Esperadas

### Console Log Correcto:

```javascript
🔍 MesCard DEBUG: {
  mesNombre: "Enero",
  estadoRevision: "ENVIADO",        // ✅
  puedeRevisar: true,                // ✅
  esGestorResponsable: true,         // ✅
  gestorResponsableId: "abc123",
  userId: "abc123",                  // ✅ Coinciden
  role: "Gestor",                    // ✅
  isAdmin: false,
  esGestor: true,                    // ✅
  deberianMostrarseLosBotones: true  // ✅ PERFECTO
}
```

### UI Esperada (Mes Expandido):

```
┌──────────────────────────────────────────────────┐
│ 📅 Enero [COMPLETADO] [En revisión]            │
│ [🔔 ¡REVISAR AHORA!] ← NARANJA ANIMADO        ▲ │
├──────────────────────────────────────────────────┤
│ ╔════════════════════════════════════════╗       │
│ ║ 🔔 🔒 Mes en Revisión                  ║       │
│ ║ Los reportes están en modo solo        ║       │
│ ║ lectura. Revisa y decide...            ║       │
│ ╚════════════════════════════════════════╝       │
│                                                  │
│ 📊 Reporte Ingresos SAT [Ver datos]             │
│ 📊 Reporte Auxiliar [Ver datos]                 │
│ 📊 Reporte Mi Admin [Ver datos]                 │
│                                                  │
│ ┌─────────────────┐  ┌──────────────────┐       │
│ │ ✅ Aprobar mes   │  │ ⚠️ Solicitar     │       │
│ │                 │  │    cambios       │       │
│ └─────────────────┘  └──────────────────┘       │
└──────────────────────────────────────────────────┘
```

---

## 📝 Información para Reportar

Si después de verificar todo sigue sin funcionar, por favor reporta:

1. **Log completo de consola:**

   ```
   Copia y pega el objeto completo de "🔍 MesCard DEBUG:"
   ```

2. **Rol y permisos:**

   ```
   - Tu rol: ____
   - Eres gestor del trabajo: Sí/No
   - El trabajo tiene gestor asignado: Sí/No
   ```

3. **Estado del mes:**

   ```
   - Estado: ____
   - Estado de revisión: ____
   - ¿El mes está expandido?: Sí/No
   ```

4. **Errores en consola:**
   ```
   ¿Hay errores en rojo en la consola? Copiarlos aquí
   ```

---

## 🎯 Siguiente Paso

**POR FAVOR EJECUTA:**

1. Abre el navegador
2. Presiona `F12`
3. Ve a la pestaña Console
4. Navega al trabajo con mes en revisión
5. Expande el mes
6. Copia el log `🔍 MesCard DEBUG:`
7. **Compártelo aquí**

Con esa información sabremos exactamente qué está pasando.
