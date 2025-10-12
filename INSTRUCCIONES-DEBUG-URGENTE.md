# 🔥 INSTRUCCIONES DE DEBUGGING - POR FAVOR SIGUE ESTO PASO A PASO

## ⚠️ IMPORTANTE: El código está CORRECTO, necesitamos ver QUÉ está pasando

He agregado logs detallados en el código para encontrar el problema. Por favor sigue estos pasos **EXACTAMENTE** como están escritos:

---

## 📋 PASO 1: Preparar el entorno

1. **Cierra el navegador completamente** (Chrome/Edge/Firefox)
2. **Limpia la caché del navegador** (Ctrl+Shift+Delete → selecciona "Imágenes y archivos en caché")
3. **Inicia el backend** (si no está corriendo):
   ```powershell
   .\start-backend.ps1
   ```
4. **Inicia el frontend** (abre una nueva terminal):
   ```powershell
   .\start-frontend.ps1
   ```

---

## 📋 PASO 2: Abrir la consola del navegador

1. Abre el navegador en `http://localhost:5173`
2. **Presiona F12** para abrir las DevTools
3. Ve a la pestaña **"Console"**
4. **Limpia la consola** (botón 🚫 o Ctrl+L)

---

## 📋 PASO 3: Crear un mes NUEVO (NO uses meses viejos)

**⚠️ CRÍTICO: NO uses meses que ya tenían reportes importados antes**

1. Ve a un Trabajo
2. Crea un **mes NUEVO** (por ejemplo: Noviembre 2024)
3. Expande el mes (haz click en él)

Deberías ver:

- ✅ Auxiliar Ingresos (SIN_IMPORTAR)
- ✅ Mi Admin Ingresos (SIN_IMPORTAR)

---

## 📋 PASO 4: Importar el reporte AUXILIAR PRIMERO

**⚠️ IMPORTANTE: Siempre importa Auxiliar ANTES de Mi Admin**

1. En "Auxiliar Ingresos", haz click en **"Importar"**
2. Selecciona un archivo Excel de Auxiliar
3. Espera a que termine (debe decir "Archivo importado correctamente")
4. **NO CIERRES LA CONSOLA** - Copia TODO lo que aparezca
5. Haz click en **"Ver"** para abrir el reporte
6. **TOMA UN SCREENSHOT** de la tabla y de la consola

---

## 📋 PASO 5: Importar el reporte MI ADMIN

1. En "Mi Admin Ingresos", haz click en **"Importar"**
2. Selecciona un archivo Excel de Mi Admin (del MISMO mes)
3. Espera a que termine
4. Haz click en **"Ver"** para abrir el reporte
5. **⚠️ AQUÍ ES CRÍTICO - MIRA LA CONSOLA**

---

## 🔍 PASO 6: QUÉ BUSCAR EN LA CONSOLA

Deberías ver logs que empiecen con:

```
🔥🔥🔥 ============================================
🔥🔥🔥 INICIO parseExcelToMiAdminIngresos
🔥🔥🔥 auxiliarData recibido: { ... }
```

**COPIA Y PÉGAME TODO ESO**, especialmente estas líneas:

- `esUndefined: true/false`
- `esArray: true/false`
- `length: X`
- `primerosRegistros: [...]`

También busca:

```
🔍 ReporteCard DEBUG: { ... }
```

**COPIA ESO TAMBIÉN**

---

## 📋 PASO 7: QUÉ DEBERÍAS VER EN LA TABLA

Si todo funciona, deberías ver estas columnas:

1. ✅ Folio
2. ✅ Fecha
3. ✅ RFC
4. ✅ Razón Social
5. ✅ Subtotal
6. ✅ Moneda
7. ✅ **Tipo Cambio** (editable, input numérico)
8. ✅ **Subtotal AUX** (de Auxiliar)
9. ✅ **Subtotal MXN** (calculado)
10. ✅ **TC Sugerido** (calculado con botón "Aplicar")
11. ✅ **Estado SAT** (editable, dropdown Vigente/Cancelada)

---

## 🚨 SI NO FUNCIONA: ENVÍAME ESTO

**Por favor, envíame:**

1. **Screenshot de la tabla de Mi Admin** (debe mostrar todas las columnas)
2. **TODO el contenido de la consola** (copia y pega el texto completo)
3. **Screenshot de la consola** también
4. **¿Qué ves en la columna "Estado SAT"?**
   - ¿Es un dropdown clickeable?
   - ¿Dice "Vigente" o "Cancelada"?
   - ¿Se puede hacer click?
5. **¿Qué ves en la columna "Tipo Cambio"?**
   - ¿Es un input editable?
   - ¿Tiene un valor numérico?
   - ¿Se puede hacer click y escribir?
6. **¿Ves las columnas "Subtotal AUX", "Subtotal MXN", "TC Sugerido"?**
   - ¿Tienen valores?
   - ¿Dicen "N/A"?
   - ¿No aparecen del todo?

---

## 💡 TEORÍAS DE POR QUÉ PUEDE NO FUNCIONAR

1. **Estás viendo reportes viejos importados antes del fix**
   - Solución: Crea un mes NUEVO e importa de nuevo
2. **No importaste Auxiliar primero**
   - Solución: Siempre importa Auxiliar ANTES de Mi Admin
3. **El navegador está usando código viejo en caché**
   - Solución: Cierra el navegador, limpia caché, abre de nuevo
4. **El backend no está corriendo**
   - Solución: Verifica que `.\start-backend.ps1` esté corriendo
5. **Los UUIDs no coinciden entre Auxiliar y Mi Admin**
   - Solución: Los logs te dirán si encuentra matches en auxiliarLookup

---

## ✅ SI TODO FUNCIONA

Si ves todas las columnas y los controles editables:

1. **Haz click en un Estado SAT** → Debería abrir un dropdown
2. **Cambia de Vigente a Cancelada** → Debería cambiar de inmediato
3. **Haz click en un Tipo Cambio** → Debería ser editable
4. **Cambia el valor** → Espera 2 segundos → Debería auto-guardar
5. **Mira la consola** → Debería decir "✅ Datos guardados"

---

## 🆘 ÚLTIMA OPCIÓN: COMPARTE PANTALLA

Si después de todo esto NO funciona, podríamos necesitar:

- Compartir pantalla para ver en vivo
- Acceso al código para debuggear en tiempo real
- Revisar el backend también

**Pero POR FAVOR, prueba estos pasos primero y envíame los logs de la consola.**

---

## 📝 NOTAS TÉCNICAS (para mi referencia)

**Archivos modificados:**

- `frontend/src/components/trabajos/ReporteCard.tsx` - Agregado prop `auxiliarReporteId` + logs + useEffect
- `frontend/src/components/trabajos/MesCard.tsx` - Busca auxiliarReporte y pasa ID
- `frontend/src/features/trabajos/reportes/mi-admin-ingresos/utils/mi-admin-ingresos-calculations.ts` - Agregados logs 🔥🔥🔥

**Lo que DEBE pasar:**

1. MesCard encuentra el reporte Auxiliar → `auxiliarReporte.id`
2. Pasa ese ID a cada ReporteCard → `auxiliarReporteId={auxiliarReporteId}`
3. ReporteCard lo usa en useAuxiliarIngresosData → `reporteId: auxiliarReporteId`
4. Cuando abres Mi Admin, carga auxiliarData
5. ReporteCard pasa auxiliarData a MiAdminIngresosTable
6. MiAdminIngresosTable pasa auxiliarData a useMiAdminIngresosData
7. useMiAdminIngresosData pasa auxiliarData a parseExcelToMiAdminIngresos
8. parseExcelToMiAdminIngresos crea auxiliarLookup Map
9. Por cada row de Mi Admin, busca en auxiliarLookup por UUID
10. Calcula subtotalAUX, subtotalMXN, tcSugerido
11. Las columnas aparecen en la tabla
12. Los inputs editables funcionan

**Si auxiliarData llega como `undefined` o `[]` (array vacío):**

- El problema está ANTES del parsing
- Puede ser que auxiliarReporteId no se esté pasando
- O que el hook useAuxiliarIngresosData no se esté ejecutando
- O que el backend no esté devolviendo datos
- Los logs nos dirán EXACTAMENTE dónde se rompe

---

**¡Por favor prueba esto y envíame los logs! No te rindas todavía, estamos muy cerca.** 🚀
