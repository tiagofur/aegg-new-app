# 🧪 Prueba Rápida - FASE 5: Vista Reporte Anual

**Fecha**: 7 de Octubre, 2025  
**Objetivo**: Verificar funcionalidad de la nueva vista de Reporte Anual

---

## ✅ Checklist de Pruebas

### 1. Navegación al Reporte Anual

- [ ] Frontend corriendo en http://localhost:5173/
- [ ] Backend corriendo en http://localhost:3000/
- [ ] Database PostgreSQL activa

#### Pasos:

1. Abrir http://localhost:5173/
2. Login con usuario existente
3. Navegar a la lista de trabajos
4. Seleccionar un trabajo
5. En la sección "Reporte Base Anual", buscar el botón morado "📊 Ver Reporte Anual"
6. Click en el botón

**Resultado Esperado**:

- ✅ Navega a `/trabajos/{id}/reporte-anual/{año}`
- ✅ URL muestra el trabajoId y el año correctos

---

### 2. Vista de Reporte Anual

#### Cards de Resumen (parte superior):

- [ ] **Card 1 (Azul)**: "Total Ventas Mi Admin"
  - Muestra un valor en formato $X,XXX.XX o "-"
- [ ] **Card 2 (Morado)**: "Total Ventas Auxiliar"
  - Muestra un valor en formato $X,XXX.XX o "-"
- [ ] **Card 3 (Amarillo)**: "Diferencia Total"
  - Muestra un valor en formato $X,XXX.XX o "-"
- [ ] **Card 4 (Verde)**: "Meses Confirmados"
  - Muestra "X / 12"
  - Muestra "X pendientes" si hay pendientes

#### Tabla de 12 Meses:

- [ ] Tabla muestra 12 filas (una por mes)
- [ ] Columnas: Mes, Ventas Mi Admin, Ventas Auxiliar, Diferencia, Estado
- [ ] Nombres de meses correctos (Enero, Febrero, Marzo...)
- [ ] Valores formateados con $ y separadores de miles

#### Badges de Estado:

- [ ] **⚪ Pendiente** (gris): Para meses sin datos
- [ ] **✅ Confirmado** (verde): Para meses con diferencia < $0.10
- [ ] **⚠️ Con diferencia** (amarillo): Para meses con diferencia >= $0.10

---

### 3. Interacciones

- [ ] **Botón "🔄 Actualizar"**:
  - Click refresca los datos
  - Muestra loading state
- [ ] **Navegación de vuelta**:

  - Botón "← Volver a Trabajos" funciona
  - Breadcrumb muestra la ruta correcta

- [ ] **Hover en filas**:
  - Filas cambian de color al pasar el mouse

---

### 4. Footer Informativo

- [ ] Card azul con información visible
- [ ] Contiene explicación de los 3 estados
- [ ] Contiene instrucciones para guardar datos

---

### 5. Casos de Uso Específicos

#### Caso 1: Trabajo sin datos guardados

**Setup**: Trabajo nuevo sin haber usado "Guardar en Base"

**Resultado Esperado**:

- [ ] Todos los cards muestran $0.00 o valores en 0
- [ ] Todas las filas tienen badge "⚪ Pendiente"
- [ ] Meses Confirmados: "0 / 12"

#### Caso 2: Trabajo con datos parciales

**Setup**: Trabajo con algunos meses guardados

**Resultado Esperado**:

- [ ] Cards muestran sumas de meses guardados
- [ ] Meses sin datos: badge "Pendiente"
- [ ] Meses con datos: badge "Confirmado" o "Con diferencia"
- [ ] Contador de confirmados muestra el número correcto

#### Caso 3: Trabajo con año completo

**Setup**: Trabajo con 12 meses guardados

**Resultado Esperado**:

- [ ] Cards muestran totales anuales
- [ ] Todas las filas tienen datos
- [ ] Meses Confirmados: "X / 12" (donde X <= 12)
- [ ] Si todos confirmados: "12 / 12"

---

### 6. Flujo de Guardar → Ver

**Objetivo**: Verificar flujo completo desde guardar hasta visualizar

#### Pasos:

1. Navegar a un trabajo
2. Seleccionar un mes (ej: Enero 2025)
3. Ir a "Mi Admin Ingresos"
4. Importar reporte de Mi Admin
5. Verificar que aparece botón "Guardar en Base"
6. Click en "Guardar en Base"
7. Confirmar guardado
8. Volver al TrabajoDetail
9. Click en "📊 Ver Reporte Anual"

**Resultado Esperado**:

- [ ] El mes recién guardado aparece en la tabla
- [ ] Card de "Meses Confirmados" se incrementa
- [ ] Badge del mes cambia a "Confirmado" o "Con diferencia"
- [ ] Totales se actualizan correctamente

---

### 7. Validaciones de Error

#### Error 1: TrabajId inválido

**Test**: Navegar a `/trabajos/invalid-id/reporte-anual/2025`

**Resultado Esperado**:

- [ ] Página de error aparece
- [ ] Mensaje: "Parámetros inválidos"
- [ ] Botón "Volver a Trabajos" funciona

#### Error 2: Año inválido

**Test**: Navegar a `/trabajos/{id-valido}/reporte-anual/invalid-year`

**Resultado Esperado**:

- [ ] Página de error aparece
- [ ] Mensaje: "Año inválido: 'invalid-year'"
- [ ] Botón "Volver a Trabajos" funciona

#### Error 3: Sin autenticación

**Test**: Logout y navegar directamente a URL del reporte

**Resultado Esperado**:

- [ ] Redirige a página de login
- [ ] No muestra datos sin autenticación

---

### 8. Responsive Design

- [ ] **Desktop (>1024px)**:
  - Cards en grid de 4 columnas
  - Tabla visible completa
- [ ] **Tablet (768px-1024px)**:
  - Cards en grid de 2 columnas
  - Tabla con scroll horizontal si es necesario
- [ ] **Móvil (<768px)**:
  - Cards en 1 columna
  - Tabla con scroll horizontal
  - Botones apilados verticalmente

---

## 🐛 Bugs Potenciales a Verificar

- [ ] Valores null/undefined no causan crashes
- [ ] Formateo de moneda funciona con valores grandes
- [ ] Nombres de meses coinciden con enum del backend
- [ ] Cache de React Query se invalida correctamente al guardar
- [ ] Loading states no quedan atascados
- [ ] Errores de API se manejan gracefully

---

## 📊 Métricas de Performance

- [ ] Tiempo de carga inicial < 2s
- [ ] Respuesta de API < 500ms
- [ ] Actualización de datos < 1s
- [ ] No hay memory leaks al navegar repetidamente

---

## ✅ Confirmación Final

**Checklist de Completitud**:

- [ ] Todas las pruebas básicas pasan
- [ ] Al menos 2 casos de uso específicos verificados
- [ ] Validaciones de error funcionan
- [ ] Responsive design se ve bien en al menos 2 tamaños
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en consola del servidor

---

## 📝 Notas de Prueba

**Fecha**: ****\_****  
**Tester**: ****\_****  
**Versión**: FASE 5 Implementación Inicial

### Observaciones:

```
[Espacio para notas durante pruebas]
```

### Bugs Encontrados:

```
[Lista de bugs encontrados durante pruebas]
```

### Mejoras Sugeridas:

```
[Ideas para mejoras futuras]
```

---

## 🎉 Resultado Final

- [ ] ✅ **APROBADO**: Todas las pruebas críticas pasan
- [ ] ⚠️ **APROBADO CON OBSERVACIONES**: Funciona pero hay mejoras menores
- [ ] ❌ **NO APROBADO**: Bugs críticos encontrados

---

**Firma**: ****\_****  
**Fecha**: ****\_****
