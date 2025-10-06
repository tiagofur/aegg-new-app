# 🤝 Contribuir al Template

¡Gracias por tu interés en contribuir a este template de desarrollo con agentes IA! Este documento te guiará sobre cómo puedes ayudar a mejorar el proyecto.

## 🎯 Cómo Puedes Contribuir

### 1. 🐛 Reportar Bugs

- Usa el [issue tracker](../../issues) para reportar bugs
- Incluye pasos para reproducir el problema
- Especifica tu entorno (SO, versiones, etc.)
- Proporciona logs o capturas si es relevante

### 2. 💡 Sugerir Mejoras

- Propón nuevas funcionalidades o mejoras
- Explica el caso de uso y beneficios
- Discute la implementación en los issues

### 3. 📝 Mejorar Documentación

- Corrige errores tipográficos
- Mejora explicaciones existentes
- Añade ejemplos o casos de uso
- Traduce contenido a otros idiomas

### 4. 🔧 Contribuir Código

- Agrega nuevos templates
- Mejora agentes existentes
- Optimiza workflows
- Añade tests o validaciones

## 📋 Proceso de Contribución

### 1. Fork y Setup

```bash
# 1. Fork el repositorio en GitHub
# 2. Clona tu fork
git clone https://github.com/tu-usuario/template.git
cd template

# 3. Configura el upstream
git remote add upstream https://github.com/original-owner/template.git

# 4. Crea una branch para tu contribución
git checkout -b feature/mi-nueva-funcionalidad
```

### 2. Desarrollo

```bash
# Realiza tus cambios
# Sigue las convenciones establecidas
# Añade tests si es aplicable
# Actualiza documentación relevante
```

### 3. Commit y Push

```bash
# Commit con mensaje descriptivo
git add .
git commit -m "feat(agente): descripción de la mejora"

# Push a tu fork
git push origin feature/mi-nueva-funcionalidad
```

### 4. Pull Request

- Crea un PR desde tu fork al repositorio principal
- Usa el template de PR proporcionado
- Enlaza issues relacionados
- Espera feedback y realiza ajustes si es necesario

## 🎨 Convenciones de Código

### Naming Conventions

```markdown
# Archivos

- Templates: `component-name.template.ext`
- Agentes: `agent-role.md`
- Documentación: `kebab-case.md`

# Commits

[scope] type(area): description

Ejemplos:
feat(agent): add DevOps engineer agent
docs(readme): improve setup instructions
fix(template): correct React component syntax
```

### Estructura de Archivos

```markdown
# Nuevos agentes

agents/
├── nuevo-agente.md
└── README.md (actualizar lista)

# Nuevos templates

templates/
├── categoria/
│ ├── template-name.template.ext
│ └── README.md (documentar uso)

# Nueva documentación

docs/
├── nueva-categoria/
│ ├── README.md
│ └── contenido.md
```

## 📝 Templates para Contribuciones

### Template de Issue

```markdown
## 🐛 Bug Report / 💡 Feature Request

### Description

[Descripción clara del problema o funcionalidad]

### Current Behavior

[Comportamiento actual si es un bug]

### Expected Behavior

[Comportamiento esperado]

### Steps to Reproduce (si es bug)

1. [Primer paso]
2. [Segundo paso]
3. [Ver error]

### Environment

- OS: [Windows/Mac/Linux]
- Agent: [Nombre del agente]
- Template Version: [versión]

### Additional Context

[Screenshots, logs, o contexto adicional]
```

### Template de Pull Request

```markdown
## 🎯 Purpose

[Descripción de qué logra este PR]

## 🔗 Related Issues

- Closes #[issue-number]
- Related to #[issue-number]

## 📋 Changes Made

- [ ] [Cambio 1]
- [ ] [Cambio 2]
- [ ] [Cambio 3]

## 🧪 Testing

- [ ] Tested locally
- [ ] Added/updated tests
- [ ] Documentation updated
- [ ] Examples work correctly

## 📚 Documentation

- [ ] README updated if needed
- [ ] Agent documentation updated
- [ ] Template documentation added
- [ ] CHANGELOG updated

## 📷 Screenshots/Examples

[Si aplica, añade capturas o ejemplos]

## ✅ Checklist

- [ ] Code follows project conventions
- [ ] Commit messages are descriptive
- [ ] No breaking changes (or noted)
- [ ] All tests pass
- [ ] Documentation is complete
```

## 🎯 Áreas de Contribución Prioritarias

### 1. 🤖 Nuevos Agentes

Agentes que serían valiosos para el template:

- **DevOps Engineer**: CI/CD, infraestructura, monitoring
- **Data Analyst**: Analytics, métricas, insights
- **Security Engineer**: Seguridad, auditorías, compliance
- **Technical Writer**: Documentación técnica especializada

### 2. 🔧 Nuevos MCPs

MCPs que ampliarían las capacidades:

- **Slack/Discord MCP**: Notificaciones y comunicación
- **Jira/Linear MCP**: Gestión de proyectos
- **AWS/GCP MCP**: Servicios cloud
- **Docker MCP**: Containerización

### 3. 📂 Templates Adicionales

Templates que faltan en el ecosistema:

- **GraphQL APIs**: Resolvers y schemas
- **WebSocket handlers**: Real-time communication
- **Machine Learning**: ML workflows y pipelines
- **Microservices**: Service mesh y communication

### 4. 📚 Documentación

Mejoras de documentación necesarias:

- **Guías de troubleshooting**
- **Videos explicativos**
- **Casos de uso específicos por industria**
- **Mejores prácticas avanzadas**

## 🛡️ Criterios de Calidad

### Para Agentes

- [ ] Documentación completa con templates
- [ ] Responsabilidades claramente definidas
- [ ] Flujo de trabajo estructurado
- [ ] Coordinación con otros agentes
- [ ] Criterios de calidad específicos

### Para Templates

- [ ] Código bien comentado
- [ ] Variables parametrizables
- [ ] Instrucciones de uso claras
- [ ] Ejemplos de implementación
- [ ] Tests o validaciones incluidas

### Para Documentación

- [ ] Estructura consistente
- [ ] Lenguaje claro y conciso
- [ ] Ejemplos prácticos
- [ ] Enlaces y referencias actualizadas
- [ ] Formato markdown correcto

## 🎉 Reconocimiento

### Contributors

Todos los contributors aparecerán en:

- Lista de contributors en README
- Release notes para cambios significativos
- Agradecimientos especiales para mejoras mayores

### Types of Contributions

- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation
- 🎨 Design improvements
- 🧪 Testing
- 🔧 Tools and infrastructure

## 📞 Soporte

### Canales de Comunicación

- **Issues**: Para bugs y feature requests formales
- **Discussions**: Para preguntas y discusiones generales
- **Email**: Para consultas privadas o sensibles

### Tiempos de Respuesta

- **Issues críticos**: 24-48 horas
- **Feature requests**: 3-7 días
- **Pull requests**: 3-5 días
- **Documentación**: 1-3 días

## 📜 Código de Conducta

### Nuestros Valores

- **Respeto**: Trata a todos con respeto y profesionalismo
- **Inclusión**: Bienvenida a colaboradores de todos los backgrounds
- **Colaboración**: Trabaja constructivamente con otros
- **Calidad**: Mantén altos estándares en contribuciones
- **Transparencia**: Comunica abiertamente sobre cambios y decisiones

### Comportamiento Esperado

- Usar lenguaje welcoming e inclusivo
- Respetar diferentes puntos de vista
- Aceptar crítica constructiva gracefully
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros

### Comportamiento Inaceptable

- Uso de lenguaje o imagery sexualizada
- Trolling, insultos o ataques personales
- Harassment público o privado
- Publishing información privada sin permiso
- Otra conducta que sea inapropiada profesionalmente

---

## 🙏 Agradecimientos

Gracias por considerar contribuir a este proyecto. Cada contribución, sin importar su tamaño, ayuda a mejorar la experiencia de desarrollo para toda la comunidad.

¿Tienes preguntas? No dudes en abrir un issue o iniciar una discussion. ¡Estamos aquí para ayudar!

---

_Contribuir - Construyendo juntos el futuro del desarrollo con IA_ 🤝
