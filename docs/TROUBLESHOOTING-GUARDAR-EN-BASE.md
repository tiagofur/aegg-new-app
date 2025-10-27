# 🔧 Troubleshooting: Error 404 en "Guardar en Base"

**Fecha:** 23 de Octubre, 2025  
**Error:** `❌ Error: Request failed with status code 404`

---

## ✅ Solución Aplicada

### 1. **Backend reiniciado**

El backend NestJS necesita reiniciarse cuando se agregan nuevos endpoints. Se ha reiniciado correctamente:

```bash
cd backend
npm run start:dev
```

**Estado:** ✅ Backend compilado sin errores

---

### 2. **Logs de debugging agregados**

Se han agregado logs detallados para diagnosticar problemas en el algoritmo de búsqueda:

#### Logs implementados:

1. **Información de hojas:**

   ```typescript
   console.log(`Reporte Base tiene ${reporte.hojas.length} hojas`);
   console.log(
     `Nombres de hojas:`,
     reporte.hojas.map((h) => h.nombre)
   );
   console.log(`Trabajando con hoja: "${hoja0.nombre}"`);
   ```

2. **Búsqueda de encabezado:**

   ```typescript
   // Si no encuentra el encabezado, muestra las primeras 10 filas
   console.log("❌ No se encontró el encabezado. Mostrando primeras 10 filas:");
   ```

3. **Búsqueda de columna del mes:**

   ```typescript
   console.log(`Mes buscado: "${mesNombre}"`);
   console.log(
     `Columnas normalizadas:`,
     headerRow.map((c, i) => `[${i}]="${normalize(c)}"`)
   );
   ```

4. **Búsqueda de fila Ventas:**
   ```typescript
   console.log("Buscando filas después del encabezado:");
   // Muestra primeras 20 filas después del encabezado
   ```

---

## 🔍 Cómo Verificar

### 1. **Verificar que el backend esté corriendo**

```bash
# En PowerShell
Get-Process -Name node | Where-Object { $_.Path -like "*backend*" }
```

Debe mostrar un proceso de node ejecutando el backend.

### 2. **Verificar el endpoint directamente**

Puedes usar Postman o cURL para probar el endpoint:

```bash
POST http://localhost:3000/trabajos/{trabajoId}/reporte-base/actualizar-ventas-mes
Headers:
  Authorization: Bearer {token}
  Content-Type: application/json
Body:
  {
    "mes": 10,
    "ventas": 150000
  }
```

### 3. **Ver los logs del backend**

Los logs aparecerán en la terminal donde está corriendo el backend:

```
[TrabajosService] Actualizando celda en Excel:
[TrabajosService] ✅ Ventas actualizadas en Excel para octubre
```

---

## 📊 Estructura del Excel Esperada

El algoritmo busca en la **PRIMERA HOJA** del Excel importado:

### Estructura esperada:

```
┌─────────┬─────────┬────────┬─────────┬───────┬─────┬
│ OP'N.   │ CONCEPTO│ ENERO  │ FEBRERO │ MARZO │ ... │
├─────────┼─────────┼────────┼─────────┼───────┼─────┤
│ ( + )   │ Concepto│ 100000 │ 120000  │ 130000│ ... │
│ ( - )   │ Concepto│  50000 │  60000  │  70000│ ... │
│ ( = )   │ Ventas  │ 150000 │ 180000  │ 200000│ ... │ ← Actualiza aquí
└─────────┴─────────┴────────┴─────────┴───────┴─────┘
```

### Requisitos:

1. ✅ **Fila de encabezado** debe contener al menos 3 nombres de meses
2. ✅ **Columna del mes** debe coincidir exactamente (normalizado)
3. ✅ **Fila Ventas** debe tener:
   - Columna 0: Símbolo con "=" (ejemplo: "( = )")
   - Columna 1: Texto que contenga "ventas"

---

## ❌ Causas Comunes del Error 404

### 1. **Backend no reiniciado**

**Síntoma:** El endpoint no existe  
**Solución:** Reiniciar el backend con `npm run start:dev`

### 2. **Ruta incorrecta en el frontend**

**Síntoma:** La URL no coincide  
**Verificar:**

```typescript
// frontend/src/services/trabajos.service.ts
`/trabajos/${trabajoId}/reporte-base/actualizar-ventas-mes`;
```

**Debe coincidir con:**

```typescript
// backend/src/trabajos/controllers/trabajos.controller.ts
@Post(':id/reporte-base/actualizar-ventas-mes')
```

✅ **Estado:** Rutas coinciden correctamente

### 3. **Problema de autenticación**

**Síntoma:** 401 Unauthorized (no 404, pero importante verificar)  
**Verificar:** Token JWT válido en headers

### 4. **trabajoId incorrecto**

**Síntoma:** 404 si el trabajo no existe  
**Verificar:** El trabajoId debe ser un UUID válido

---

## 🧪 Pasos de Prueba

### 1. **Preparación:**

1. Asegurarse de que el backend esté corriendo
2. Tener un trabajo creado
3. Haber importado un Reporte Base Anual (Excel)
4. Verificar que el Excel tenga la estructura correcta

### 2. **Ejecutar prueba desde el frontend:**

1. Navegar a un mes del trabajo
2. Abrir el Reporte MI Admin
3. Procesar MI Admin y Auxiliar
4. Presionar "Guardar en Base"

### 3. **Ver los logs en el backend:**

La terminal del backend mostrará:

**Éxito:**

```
[TrabajosService] Reporte Base tiene 3 hojas
[TrabajosService] Nombres de hojas: [ 'Hoja1', 'Hoja2', 'Hoja3' ]
[TrabajosService] Trabajando con hoja: "Hoja1"
[TrabajosService] La hoja tiene 50 filas
[TrabajosService] ✅ Encabezado encontrado en fila 0
[TrabajosService] Contenido del encabezado: [ "OP'N.", "CONCEPTO", "ENERO", ... ]
[TrabajosService] ✅ Columna del mes "OCTUBRE" encontrada en índice 11
[TrabajosService] ✅ Fila de Ventas encontrada en índice 15
[TrabajosService] Actualizando celda en Excel: { trabajoId, mes: 'octubre', ventas: 150000, fila: 15, columna: 11 }
[TrabajosService] ✅ Ventas actualizadas en Excel para octubre
```

**Error (sin encabezado):**

```
[TrabajosService] ❌ No se encontró el encabezado. Mostrando primeras 10 filas:
Fila 0: [ 'Dato', 'Valor', ... ]
Fila 1: [ 'A', 'B', ... ]
...
```

**Error (sin columna del mes):**

```
[TrabajosService] ❌ No se encontró la columna del mes
[TrabajosService] Mes buscado: "octubre"
[TrabajosService] Columnas normalizadas: [ '[0]="opn"', '[1]="concepto"', '[2]="ene"', ... ]
```

**Error (sin fila Ventas):**

```
[TrabajosService] ❌ No se encontró la fila de Ventas
[TrabajosService] Buscando filas después del encabezado:
Fila 1: [0]="" [1]="subtotal"
Fila 2: [0]="+" [1]="ingresos"
...
```

---

## 🔧 Soluciones por Tipo de Error

### Error: "No se encontró el encabezado"

**Causa:** La primera hoja no tiene una fila con al menos 3 nombres de meses  
**Solución:**

1. Verificar que el Excel tenga la estructura correcta
2. La fila de encabezado debe estar en las primeras 20 filas
3. Debe contener nombres de meses en español

### Error: "No se encontró la columna del mes"

**Causa:** El nombre del mes en el Excel no coincide  
**Solución:**

1. Verificar que el mes esté escrito correctamente
2. Puede estar en mayúsculas o minúsculas (se normaliza)
3. Debe coincidir con: enero, febrero, marzo, abril, mayo, junio, julio, agosto, septiembre, octubre, noviembre, diciembre

### Error: "No se encontró la fila Ventas"

**Causa:** La fila de ventas no tiene el formato esperado  
**Solución:**

1. La columna 0 debe contener el símbolo "=" (ejemplo: "( = )")
2. La columna 1 debe contener la palabra "ventas"
3. Ejemplo correcto: `["( = )", "Ventas", 150000, 180000, ...]`

---

## 📝 Checklist de Verificación

Antes de reportar un problema, verificar:

- [ ] Backend está corriendo (`npm run start:dev` en la carpeta backend)
- [ ] Backend compiló sin errores
- [ ] Reporte Base Anual está importado en el trabajo
- [ ] El Excel tiene al menos una hoja
- [ ] La primera hoja tiene la estructura correcta:
  - [ ] Fila de encabezado con nombres de meses
  - [ ] Columna del mes existe
  - [ ] Fila "( = ) Ventas" existe
- [ ] Token de autenticación es válido
- [ ] trabajoId es correcto
- [ ] Permisos del usuario (ADMIN, GESTOR o MIEMBRO)

---

## 🎯 Estado Actual

**Backend:** ✅ Reiniciado y funcionando  
**Endpoint:** ✅ Registrado correctamente  
**Logs:** ✅ Agregados para debugging  
**Frontend:** ✅ Configurado correctamente

**Próximo paso:** Probar la funcionalidad y revisar los logs para identificar el problema específico.

---

## 📞 Cómo Reportar un Problema

Si el error persiste, proporcionar:

1. **Logs del backend** (copiar toda la salida de la terminal)
2. **Mensaje de error completo** del frontend
3. **Estructura del Excel** (captura de pantalla de las primeras filas)
4. **trabajoId** usado en la prueba
5. **Mes** que se intentó actualizar

Con esta información podremos diagnosticar y resolver el problema específico.
