# ✨ Funcionalidades del Sistema

**Última actualización**: 27/12/2025

## 📋 Índice

1. [👨‍💼 Gestión de Usuarios](#gestión-de-usuarios)
2. [👥 Clientes](#clientes)
3. [💼 Trabajos Contables](#trabajos-contables)
4. [📊 Reportes Base Anual](#reportes-base-anual)
5. [📈 Reportes Mensuales](#reportes-mensuales)
6. [✅ Flujo de Aprobaciones](#flujo-de-aprobaciones)
7. [📖 Base de Conocimiento](#base-de-conocimiento)
8. [⏳ Pendientes](#pendientes)

---

## 👨‍💼 Gestión de Usuarios

### ✅ Implementado

**Autenticación JWT**
- Login seguro con email y password
- Generación de token JWT (7 días de expiración)
- Refresh de token automático
- Logout y limpieza de tokens

**Roles y Permisos**
- **Admin**: Acceso completo a todo el sistema
  - CRUD de usuarios
  - CRUD de clientes
  - Ver todos los trabajos
  - Aprobar/rechazar trabajos
- **Gestor**: Gestión de su equipo
  - Ver trabajos de su equipo
  - Crear y editar trabajos
  - Aprobar/rechazar trabajos de su equipo
- **Miembro**: Solo ver/editar sus trabajos asignados
  - Ver solo sus trabajos
  - Actualizar reportes mensuales
  - Enviar a revisión

**Equipos**
- Organización de usuarios en equipos
- Los Gestores pueden ver los trabajos de su equipo
- Asignación de trabajos a miembros del equipo

### 🔐 Seguridad

- Password hasheado con bcrypt
- JWT con secret mínimo 32 caracteres
- Rate limiting en login (prevenir fuerza bruta)
- Validación de email con class-validator

---

## 👥 Clientes

### ✅ Implementado

**CRUD Completo**
- **Crear**: Agregar nuevos clientes
  - Nombre, RFC, Razón Social
  - Dirección, Contacto Principal
  - Metadatos flexibles (JSON)
- **Listar**: Ver todos los clientes
  - Búsqueda en tiempo real
  - Paginación
  - Filros por nombre/RFC
- **Editar**: Actualizar información de clientes
- **Eliminar**: Eliminar clientes (con protección si tienen trabajos)

**Validación**
- RFC único (no duplicados)
- Nombre requerido
- Email de contacto validado

**Integración**
- Los clientes se asignan a trabajos
- Histórico de trabajos por cliente

---

## 💼 Trabajos Contables

### ✅ Implementado

**CRUD Completo**

**Crear Trabajo**
- Seleccionar cliente de la lista
- Asignar año fiscal
- Asignar miembro del equipo (opcional)
- Asignar gestor responsable (opcional)
- Configurar visibilidad (equipo/privado)
- Estado inicial: EN_PROGRESO

**Ver Trabajo**
- Información del cliente y año
- Estado de aprobación
- Gestor responsable
- Miembro asignado
- Progreso de meses completados
- Visibilidad (equipo/privado)

**Editar Trabajo**
- Cambiar cliente
- Reasignar miembro
- Reasignar gestor
- Cambiar visibilidad
- Cambiar estado de aprobación (solo Admin)

**Eliminar Trabajo**
- Eliminar trabajo, meses y reportes relacionados
- Protección contra eliminación accidental
- Confirmación doble

**Meses Automáticos**
- Al crear trabajo, se generan automáticamente los 12 meses
- Cada mes tiene 3 reportes mensuales vacíos:
  - INGRESOS
  - INGRESOS_AUXILIAR
  - INGRESOS_MI_ADMIN

**Gestión de Meses**
- Ver estado de cada mes (EN_EDICION, ENVIADO, APROBADO)
- Enviar a revisión (solo Miembros y Gestores)
- Aprobar mes (solo Gestores y Admins)
- Solicitar cambios (Admin/Gestor)
- Reabrir trabajo (solo Admin/Gestor responsable)

**Reabrir Trabajo Aprobado**
- Los Gestores responsables pueden reabrir trabajos
- Cambia estado de APROBADO a REABIERTO
- Habilita edición de reportes

---

## 📊 Reportes Base Anual

### ✅ Implementado

**Importación de Excel**
- Subir archivo Excel (.xlsx)
- El archivo puede tener múltiples hojas
- Cada hoja se importa como un reporte separado
- Ejemplo de hojas:
  - Resumen Anual
  - Ingresos Consolidados
  - Comparativas

**Almacenamiento**
- Datos almacenados en formato JSON
- Cada hoja tiene:
  - Nombre de la hoja
  - Datos en formato de celdas (arrays bidimensionales)
  - Ejemplo: `datos: [[celda1, celda2], [celda3, celda4]]`

**Actualización de Ventas**
- Actualizar ventas mensuales en el reporte base anual
- Buscar fila "Ventas" y columna del mes
- Actualizar celda específica
- Útil para corregir datos importados

**Visualización**
- Ver todas las hojas del reporte base anual
- Navegar entre hojas
- Fecha de última actualización
- Indicador de progreso (meses completados)

---

## 📈 Reportes Mensuales

### ✅ Implementado

**3 Tipos de Reportes por Mes**
1. **INGRESOS**: Reporte principal de ingresos
2. **INGRESOS_AUXILIAR**: Reporte auxiliar con datos complementarios
3. **INGRESOS_MI_ADMIN**: Reporte para administración MI

**Importación de Excel**
- Importar archivo Excel por cada reporte
- Los datos se parsean y almacenan
- Formato flexible de Excel

**Procesamiento y Cálculos**
- **Procesar y Guardar**: Ejecutar cálculos automáticos
  - Sumas de columnas
  - Cálculos de porcentajes
  - Consolidación de datos
  - Fórmulas personalizadas
- Los cálculos se guardan en la base de datos
- No se pierden al recargar

**Visualización de Datos**
- Ver datos importados (formato de tabla)
- Ver datos procesados (resultados de cálculos)
- Formato responsivo para pantallas grandes
- Scroll horizontal para muchas columnas

**Limpieza de Datos**
- **Limpiar Datos**: Reiniciar reporte a estado vacío
- Eliminar datos importados
- Eliminar datos procesados
- Volver a importar desde cero

**Historial de Importación**
- Fecha de importación
- Fecha de procesamiento
- Estado del reporte (SIN_IMPORTAR, IMPORTADO, PROCESADO, ERROR)
- URL del archivo original

---

## ✅ Flujo de Aprobaciones

### ✅ Implementado

**Estados del Mes**
1. **EN_EDICION**: El Miembro está editando el reporte
2. **ENVIADO**: El Miembro envió a revisión del Gestor
3. **APROBADO**: El Gestor aprobó el reporte
4. **CAMBIOS_SOLICITADOS**: El Gestor solicitó cambios

**Flujo por Rol**

**Miembro**
1. Importar o editar reporte mensual
2. Procesar y guardar (ejecutar cálculos)
3. Enviar a revisión (cambia estado a ENVIADO)
4. Esperar aprobación o solicitud de cambios

**Gestor**
1. Ver reportes enviados por su equipo
2. Revisar datos procesados
3. Aprobar (cambia estado a APROBADO) o
4. Solicitar cambios (cambia estado a CAMBIOS_SOLICITADOS)
5. Agregar comentarios al solicitar cambios

**Admin**
1. Puede ver y aprobar trabajos de cualquier equipo
2. Puede reabrir trabajos aprobados
3. Tiene acceso completo al sistema

**Indicadores Visuales**
- Badges con colores según estado:
  - 🟢 APROBADO
  - 🟡 ENVIADO
  - 🔵 EN_EDICION
  - 🟠 CAMBIOS_SOLICITADOS
- Menú contextual en la tarjeta del mes
- Acciones disponibles según rol y estado

**Comentarios de Revisión**
- Comentarios al aprobar
- Comentarios al solicitar cambios
- Historial visible en la UI

---

## 📖 Base de Conocimiento

### ✅ Implementado

**Gestión de Artículos**
- Crear artículos
- Editar artículos
- Eliminar artículos
- Buscar artículos

**Contenido de Artículos**
- Título
- Categoría
- Contenido (markdown o HTML)
- Etiquetas
- Fecha de creación/actualización

**Búsqueda**
- Búsqueda en tiempo real
- Filros por categoría
- Filros por etiquetas

**Propósito**
- Documentar procesos contables
- Instruciones para el sistema
- Preguntas frecuentes
- Guías de uso

---

## ⏳ Pendientes

### Corto Plazo (Próximas 2-4 semanas)

**Importación Mejorada**
- Nueva UI para importar reportes
- Drag & drop de archivos
- Preview del archivo antes de importar
- Validación de estructura de Excel

**Edición de Celdas**
- Editar celdas directamente en la UI
- No solo ver la tabla
- Guardar cambios en tiempo real

**Exportación**
- Exportar a Excel
- Exportar a PDF
- Generar reportes personalizados

**Navegación con Teclado**
- Atajos de teclado para navegar
- Arrow keys para moverse entre celdas
- Enter para editar

### Medio Plazo (1-2 meses)

**Gráficas y Análisis**
- Gráfica de ventas mensuales
- Comparativas entre meses
- Análisis de tendencias
- Exportar gráficas

**Colaboración**
- Múltiples usuarios editando el mismo trabajo
- Notificaciones en tiempo real
- Comentarios en reportes

**Notificaciones**
- Notificaciones push
- Email al aprobar/rechazar
- Alerts en la UI

### Largo Plazo (3-6 meses)

**Dashboard Avanzado**
- KPIs en tiempo real
- Widgets personalizables
- Reportes automáticos

**Móvil**
- App móvil para Miembros
- Edición de reportes en móvil
- Notificaciones push

**Integraciones**
- Integración con otros sistemas contables
- API para terceros
- Webhooks

---

## 📊 Métricas de Uso

**Actualmente en Producción**

- ✅ Usuarios: Sistema completo de autenticación
- ✅ Clientes: CRUD completo
- ✅ Trabajos: CRUD completo con 12 meses automáticos
- ✅ Reportes Base Anual: Importación y visualización
- ✅ Reportes Mensuales: 3 tipos, importación, procesamiento
- ✅ Aprobaciones: Flujo completo con 4 estados
- ✅ Base de Conocimiento: CRUD de artículos
- ✅ Seguridad: Rate limiting, headers, sanitización

**Progreso del Sistema**: ~85% completado
**Próximo release grande**: Importación mejorada + Edición de celdas

---

**Última actualización**: 27/12/2025
**Versión**: 2.0.0
**Estado**: ✅ Funcionalidades documentadas
