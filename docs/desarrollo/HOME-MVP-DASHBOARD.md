# Home Dashboard MVP Blueprint

## Contexto actual

- El acceso inicial salta directamente a `Trabajos`, dejando sin uso la home existente.
- No existe un lugar centralizado para comunicados, tareas rápidas ni eventos clave.
- La administración de usuarios depende aún del flujo de registro.

## Objetivo MVP

Entregar una home adaptable que sirva como punto de partida para todos los roles, priorizando tres capacidades base: comunicados, calendario inteligente y gestor de tareas operativas. La navegación debe invitar a volver a esta home desde cualquier módulo.

## Navegación prioritaria

1. **Botón / enlace persistente "Inicio"** en la barra superior y menú lateral, destacando la nueva home.
2. **Redirección post-login**: después de autenticarse, los roles con permisos válidos aterrizan en la home antes de ir a otros módulos.
3. **Cards de acceso rápido**: atajos visibles a `Trabajos`, `Reportes` (cuando reaparezca) u otros módulos, configurables por rol.
4. **Breadcrumbs contextuales** que incluyan siempre un enlace de retorno a la home.
5. **Spotlight / buscador global** que permita saltar a recursos, pero conserve un CTA claro de "Ir a Home".

## Capacidades MVP detalladas

### Conceptos clave

- **Home como hub**: layout de tres columnas (comunicados, calendario, tareas) con widgets reordenables por rol para mostrar lo más relevante sin configuraciones complejas.
- **Quick actions**: barra superior con acciones instantáneas según permisos (Admin: crear usuario/comunicado; Gestor: asignar tarea; Miembro: registrar avance) que refuerzan el uso operativo de la home.
- **Estado operativo**: componente de KPIs mínimos (tareas vencidas, comunicados no leídos, eventos de hoy) con semáforos visuales que guían el foco inmediato del usuario.
- **Spotlight inteligente**: buscador global que ofrece navegación, plantillas rápidas (p. ej. “nuevo comunicado urgente”) y recuerda accesos frecuentes.
- **Integraciones livianas**: placeholders para conectar con calendarios externos o notificaciones push, mostrando valor futuro sin bloquear el MVP.
- **Retorno a home**: botón "Inicio" persistente más breadcrumb inicial y modal post-login para elegir widgets iniciales por rol.

### 1. Centro de comunicados

- **Panel principal** con comunicado destacado (texto, imagen o video corto) y botón de ver historial.
- **Listado por prioridad** con filtros por categoría y rol (Admin, Gestor, Miembros).
- **Confirmación de lectura** para comunicados críticos, visible al Admin.
- **Mini analítica**: porcentaje de usuarios que han leído cada comunicado.

### 2. Calendario inteligente

- **Vista mensual + agenda semanal** que muestre eventos corporativos, vencimientos y mantenimientos.
- **Integración con tareas**: al seleccionar un día se sugieren tareas pendientes para ese usuario.
- **Alertas anticipadas**: recordatorios visuales para eventos próximos (48h/24h/1h).
- **Sincronización futura**: preparar hooks para integrar con calendarios externos.

### 3. Gestor de tareas operativo

- **Backlog personal y del equipo** con estados rápido (Pendiente, En progreso, Completada).
- **Creación express** desde la home con asignación por rol (Admin → Gestor → Miembros).
- **Checklist por tarea** para adjuntar evidencia (texto, doc, imagen) según necesidad operativa.
- **Indicadores básicos**: conteo de tareas pendientes, vencidas y completadas.

## Roles y permisos

- **Admin**: crea/edita/elimina usuarios y roles, administra comunicados globales, configura widgets de la home.
- **Gestor**: gestiona tareas del equipo, publica comunicados segmentados, consulta métricas de cumplimiento.
- **Miembro**: recibe agenda diaria, marca avances y revisa comunicados obligatorios.

## Ruta inmediata

1. **Mapear journeys por rol** (Admin, Gestor, Miembro) para definir métricas, acciones críticas y necesidades de información en la home.
2. **Bocetar wireframes** de la home modular (desktop y mobile) y validar con stakeholders clave.
3. **Armar backlog técnico** del MVP, incluyendo endpoints, componentes front y ajustes de navegación.
4. **Plan de iteraciones** posterior: métricas avanzadas, IA asistente, integraciones externas.

## Ejecución inmediata

### 1. Validación con stakeholders

- **Artefactos de entrada**: resumen del MVP (este documento), insights de usuarios actuales y objetivos corporativos.
- **Sesión de trabajo**: workshop 60-90 min con Admin, Gestores representativos y sponsor; priorizar funcionalidades, confirmar dolores y capturar riesgos.
- **Outputs esperados**: matriz de prioridad (must/should/could), acuerdos sobre alcance de la primera release, lista de hipótesis por validar.
- **Acciones posteriores**: documentar decisiones en `docs/soluciones/FIXES-Y-MEJORAS.md`, actualizar roadmap y calendarizar checkpoints.
- **Checklist previo**:
  - Confirmar asistentes clave y disponibilidad.
  - Preparar deck con resumen del MVP, mockups existentes y métricas actuales.
  - Definir encuesta rápida para recoger feedback posterior.
- **Agenda sugerida (70 min)**:
  1.  Contexto y objetivo (10 min).
  2.  Recorrido por la home y capacidades MVP (20 min).
  3.  Priorización colaborativa y matriz MOSCOW (20 min).
  4.  Riesgos, dependencias y próximos hitos (15 min).
  5.  Cierre y acuerdos (5 min).
- **Preguntas guía**:
  - ¿Qué información necesitan ver en los primeros 30 segundos?
  - ¿Qué riesgos operativos se reducen con la home?
  - ¿Qué métricas usarán para evaluar el éxito?
  - ¿Qué tareas deben permanecer fuera del alcance inicial?

### 2. Diseño de wireframes

- **Scope**: layouts para versión desktop y mobile de la home, contemplando variaciones por rol (Admin, Gestor, Miembro).
- **Herramientas**: Figma o herramienta aprobada; crear librería de componentes reutilizables para el dashboard.
- **Entregables clave**: flujo de navegación desde login, estructura de módulos (comunicados, calendario, tareas), prototipo navegable ligero.
- **Validación**: test rápido con 3-5 usuarios representativos; ajustar con feedback antes de pasar a UI final.
- **Checklist previo**:
  - Revisar design system vigente y tokens de UI.
  - Recopilar pantallas actuales de `Trabajos` para alinear navegación.
  - Definir escenarios clave por rol.
- **Tareas principales**:
  - Sketch de wireframes low-fi (día 1-2).
  - Iteración a mid-fi con componentes comunes y estados vacíos (día 3-4).
  - Armado de prototipo navegable y storyline (día 5).
  - Sesión de feedback y ajustes (día 6-7).

### 3. Preparación de backlog técnico

- **Desglose**: historias de usuario por rol, criterios de aceptación y dependencias (front, back, datos).
- **Infraestructura**: definir endpoints API necesarios (comunicados, calendario, tareas), modelos de datos y migraciones.
- **Front-end**: identificar componentes React existentes reutilizables y estimar nuevos (widgets, navegación, spotlight).
- **Plan de pruebas**: criterios de QA, casos de prueba prioritarios, definición de métricas de éxito del MVP.
- **Herramienta de gestión**: cargar el backlog en la herramienta oficial (Jira/Azure Boards/Trello), etiquetando MVP y prioridad.
- **Plantilla recomendada de historia**:
  - _Como [rol]_ quiero _[capacidad]_ para _[beneficio]_.
  - Criterios de aceptación (3-5 bullets testables).
  - Notas técnicas (API, permisos, datos).
- **Checklist previo al grooming**:
  - Revisión de dependencias con otras squads.
  - Estimaciones iniciales (t-shirt size) y riesgos.
  - Identificar quick wins para la primera iteración.

## Seguimiento

- Crear tablero Kanban ad-hoc para visualizar el avance de los tres frentes (Validación, Wireframes, Backlog).
- Designar responsables por frente y definir cadencia de sincronización (p. ej. stand-up bisemanal).
- Actualizar este documento con status (To Do / In Progress / Done) y aprendizajes clave al cierre de cada hito.

## Roadmap extendido

- **Personalización profunda**: widgets rearrastrables, temas corporativos, accesibilidad avanzada, modo offline con sincronización diferida y soporte multilingüe.
- **IA asistente**: recomendaciones de tareas, redacción automática de comunicados, detección de conflictos de agenda y alertas de riesgos operativos.
- **Integraciones colaborativas**: conectores con Teams/Slack/Meet, comentarios en tiempo real, votaciones y espacios compartidos para notas y briefs.
- **Analytics avanzadas**: métricas de cumplimiento, tendencias, dashboards predictivos y KPIs por rol; exportación de reportes y API para BI externo.
- **Marketplace interno**: arquitectura de módulos plug-and-play para extender la home con CRM, ERP, tableros financieros y widgets de partners.
- **Gestión de seguridad reforzada**: auditoría visual, alertas de comportamiento anómalo, inteligencia de contraseñas y cuadro de mando de cumplimiento normativo.
