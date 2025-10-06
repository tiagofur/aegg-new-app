# 🧪 Guía de Pruebas - FASE 3 Frontend Importación

## 📋 Pre-requisitos

- ✅ Backend corriendo: http://localhost:3001
- ✅ Frontend corriendo: http://localhost:5173
- ✅ PostgreSQL corriendo
- ✅ Usuario registrado en el sistema

---

## 🚀 Pasos para Probar

### 1. **Acceder a la Aplicación**

```
1. Abrir navegador: http://localhost:5173
2. Si no tienes cuenta: Click "Registrarse" → crear cuenta
3. Si ya tienes cuenta: Login con email/password
```

### 2. **Navegar a Trabajos**

```
1. Después del login → Dashboard
2. Click en card "Mis Trabajos"
   (o ir directamente a http://localhost:5173/trabajos)
```

### 3. **Crear un Trabajo**

```
1. Click botón "Nuevo Trabajo" (azul, esquina superior derecha)
2. Modal aparece:
   - Nombre: "Contabilidad Enero 2024"
   - Descripción: "Reportes mensuales del primer trimestre"
3. Click "Crear"
4. El trabajo aparece en la lista de cards
```

### 4. **Crear un Reporte**

```
1. Click en el card del trabajo recién creado
2. Página TrabajoDetail se abre
3. En panel izquierdo "Reportes", click "Nuevo"
4. Modal aparece:
   - Nombre: "Reporte Mensual Enero"
   - Tipo: Seleccionar "Reporte Mensual (Multi-hoja)"
   - Descripción: "Balance y estados financieros"
5. Click "Crear"
6. El reporte aparece en lista izquierda Y se selecciona automáticamente
7. Panel derecho ahora muestra componente "Importar Excel"
```

### 5. **Importar Excel (Multi-hoja)**

```
1. Panel derecho muestra mensaje:
   "Este reporte soporta múltiples hojas. Todas las hojas del archivo serán importadas."

2. OPCIÓN A - Drag & Drop:
   - Arrastra un archivo .xlsx al área punteada

3. OPCIÓN B - Click para seleccionar:
   - Click en área "Haz clic para seleccionar"
   - Diálogo de archivos se abre
   - Seleccionar archivo .xlsx o .xls

4. Archivo aparece con nombre y tamaño

5. Click botón azul "Importar Archivo"

6. Loading state:
   - Botón muestra "Importando..." con spinner

7. Success state (si todo va bien):
   - ✅ Mensaje verde: "Archivo importado exitosamente"
   - Panel "Detalles de la importación" muestra:
     * Tipo de reporte: mensual
     * Archivo: nombre-del-archivo.xlsx
     * Hojas importadas: [Hoja1, Hoja2, Hoja3...]
     * Total de filas: 150
     * Total de columnas: 12
```

### 6. **Importar Excel (Single-hoja)**

```
1. Crear otro reporte con tipo "Balance", "Ingresos", etc.
2. Panel derecho muestra mensaje:
   "Solo se importará la primera hoja del archivo Excel."
3. Importar archivo igual que antes
4. Success state muestra solo info de primera hoja:
   - Total de filas
   - Total de columnas
```

### 7. **Validaciones a Probar**

```
❌ Archivo muy grande (>10MB):
   - Error: "El archivo es muy grande (12.5MB). Máximo permitido: 10MB"

❌ Tipo de archivo incorrecto (.pdf, .docx):
   - Error: "Tipo de archivo no permitido. Permitidos: .xlsx,.xls"

❌ Archivo Excel corrupto/vacío:
   - Error desde backend: "El archivo Excel no tiene datos válidos"
```

### 8. **Otras Funcionalidades**

```
✅ Duplicar Trabajo:
   - En página Trabajos → botón "Duplicar"
   - Crea copia con sufijo " (Copia)"

✅ Eliminar Trabajo:
   - En página Trabajos → botón "Eliminar"
   - Confirmación → elimina trabajo y reportes

✅ Eliminar Reporte:
   - En TrabajoDetail → icono papelera en reporte
   - Confirmación → elimina reporte

✅ Importar otro archivo:
   - Después de success → botón "Importar otro archivo"
   - Resetea el componente para nueva importación
```

---

## 🎯 Casos de Prueba Específicos

### Test Case 1: Multi-Sheet Import

**Objetivo:** Verificar que tipo "mensual" importe todas las hojas

**Archivo de prueba:** Excel con 3 hojas (Balance, Ingresos, Gastos)

**Pasos:**

1. Crear reporte tipo "Reporte Mensual (Multi-hoja)"
2. Importar archivo Excel con 3 hojas
3. Verificar success message
4. **Esperado:** Lista "Hojas importadas: Balance, Ingresos, Gastos"

### Test Case 2: Single-Sheet Import

**Objetivo:** Verificar que otros tipos solo importen primera hoja

**Archivo de prueba:** Mismo Excel con 3 hojas

**Pasos:**

1. Crear reporte tipo "Balance"
2. Importar mismo archivo Excel
3. Verificar success message
4. **Esperado:** Solo info de primera hoja, NO lista de hojas

### Test Case 3: File Size Validation

**Objetivo:** Validar límite de 10MB

**Archivo de prueba:** Excel > 10MB

**Pasos:**

1. Intentar importar archivo grande
2. **Esperado:** Error inmediato sin llamar al backend

### Test Case 4: File Type Validation

**Objetivo:** Solo aceptar .xlsx y .xls

**Archivo de prueba:** .pdf, .docx, .csv

**Pasos:**

1. Intentar importar cada tipo
2. **Esperado:** Error "Tipo de archivo no permitido"

### Test Case 5: Empty Excel

**Objetivo:** Manejar Excel sin datos

**Archivo de prueba:** Excel vacío o solo headers

**Pasos:**

1. Importar Excel vacío
2. **Esperado:** Error desde backend o success con 0 filas

---

## 🔍 Verificación en Backend

### Verificar Datos en Base de Datos

**1. Conectar a PostgreSQL:**

```bash
docker-compose exec postgres psql -U postgres -d nestjs_app
```

**2. Ver trabajos creados:**

```sql
SELECT id, nombre, estado, "fechaCreacion"
FROM trabajos
ORDER BY "fechaCreacion" DESC;
```

**3. Ver reportes de un trabajo:**

```sql
SELECT id, nombre, tipo, "nombreArchivoOriginal"
FROM reportes
WHERE "trabajoId" = 'id-del-trabajo';
```

**4. Ver estructura de datos importados:**

```sql
SELECT
  id,
  nombre,
  "datosOriginales"->>'hojas' as hojas_multi,
  "datosOriginales"->>'headers' as headers_single
FROM reportes
WHERE "nombreArchivoOriginal" IS NOT NULL;
```

**5. Salir de PostgreSQL:**

```sql
\q
```

### Verificar Logs del Backend

**Ver logs en tiempo real:**

```bash
docker-compose logs -f backend
```

**Buscar errores específicos:**

```bash
docker-compose logs backend | grep ERROR
```

---

## 📊 Datos de Prueba Sugeridos

### Excel Multi-hoja (tipo "mensual")

```
Nombre archivo: Reporte_Mensual_Enero_2024.xlsx

Hoja 1 "Balance":
  - Headers: Cuenta, Debe, Haber, Saldo
  - 50 filas de datos

Hoja 2 "Ingresos":
  - Headers: Fecha, Concepto, Monto, Categoría
  - 30 filas de datos

Hoja 3 "Gastos":
  - Headers: Fecha, Proveedor, Monto, Tipo
  - 40 filas de datos
```

### Excel Single-hoja (tipo "balance")

```
Nombre archivo: Balance_General_2024.xlsx

Hoja 1 "Resumen":
  - Headers: Activo, Pasivo, Capital, Total
  - 25 filas de datos

Hoja 2 "Detalle": (será ignorada)
  - No se importa
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to backend"

**Solución:**

```bash
# Verificar que backend esté corriendo
docker-compose ps

# Si está down, reiniciar
docker-compose restart backend

# Ver logs
docker-compose logs backend --tail 50
```

### Error: "401 Unauthorized"

**Solución:**

```
1. Token expiró → hacer logout y login de nuevo
2. Token inválido → limpiar localStorage:
   - Abrir DevTools (F12)
   - Console → localStorage.clear()
   - Recargar página
```

### Error: Frontend no actualiza después de cambios

**Solución:**

```bash
# Limpiar cache y reinstalar
cd frontend
npm install
docker-compose restart frontend
```

### Excel no importa correctamente

**Verificar:**

```
1. ✅ Archivo tiene extensión .xlsx o .xls
2. ✅ Archivo < 10MB
3. ✅ Excel tiene al menos una hoja con datos
4. ✅ Primera fila tiene headers (no vacía)
5. ✅ Backend logs no muestran errores
```

---

## ✅ Checklist de Pruebas Completas

```
Frontend:
□ Login exitoso
□ Registro de nuevo usuario
□ Dashboard muestra card "Mis Trabajos"
□ Navegar a /trabajos
□ Crear trabajo nuevo
□ Ver lista de trabajos
□ Click en trabajo → detalle
□ Crear reporte tipo "mensual"
□ Crear reporte tipo "balance"
□ Importar Excel multi-hoja
□ Importar Excel single-hoja
□ Ver detalles de importación
□ Validación tamaño archivo
□ Validación tipo archivo
□ Duplicar trabajo
□ Eliminar reporte
□ Eliminar trabajo
□ Logout

Backend:
□ Endpoints responden correctamente
□ Datos se guardan en PostgreSQL
□ Estructura JSONB correcta (multi vs single)
□ Validaciones de tamaño funcionan
□ Logs no muestran errores críticos

Integración:
□ Frontend → Backend communication OK
□ JWT authentication funciona
□ CORS configurado correctamente
□ Upload multipart/form-data funciona
□ Respuestas del backend se manejan bien
```

---

## 🎉 Resultado Esperado

Al completar todas las pruebas, deberías tener:

1. ✅ **Trabajos creados** en la base de datos
2. ✅ **Reportes asociados** a cada trabajo
3. ✅ **Datos importados** desde Excel guardados en JSONB
4. ✅ **Diferenciación** entre multi-hoja y single-hoja
5. ✅ **UI funcional** sin errores en consola
6. ✅ **Feedback claro** en todas las operaciones

**¡El sistema de importación está 100% funcional!** 🚀

---

**Siguiente paso:** FASE 4 - Visualización de datos importados
