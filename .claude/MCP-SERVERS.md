# MCP Servers Recomendados para Ordo-Todo

**Model Context Protocol servers que mejoran significativamente el desarrollo del proyecto.**

## 📋 Tabla de Contenidos

1. [🌟 Esenciales (Must-Have)](#-esenciales-must-have)
2. [🔧 Desarrollo Backend](#-desarrollo-backend)
3. [🎨 Desarrollo Frontend](#-desarrollo-frontend)
4. [📊 Datos & Base de Datos](#-datos--base-de-datos)
5. [🧪 Testing & QA](#-testing--qa)
6. [📚 Documentación](#-documentación)
7. [🚀 CI/CD & DevOps](#-cicd--devops)
8. [🔍 Búsqueda & Información](#-búsqueda--información)
9. [⚙️ Configuración](#️-configuración)

---

## 🌟 Esenciales (Must-Have)

### 1. **Filesystem MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Operaciones seguras de sistema de archivos

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-filesystem
```

**Configuración:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/path"]
    }
  }
}
```

**Uso en Ordo-Todo:**
- Leer/escribir archivos del proyecto
- Crear nuevos componentes y módulos
- Organizar estructura de directorios
- Backup y migrations automáticas

**Por qué es esencial:**
Permite a los agentes leer y escribir archivos de forma segura, esencial para cualquier tarea de desarrollo.

---

### 2. **GitHub MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Automatización completa de GitHub

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-github
```

**Configuración:**
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_github_token_here"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Crear issues automáticamente cuando fallan tests
- Crear pull requests con descripciones generadas
- Gestionar releases y changelogs
- Automatizar code reviews
- Gestionar branches y workflows

**Ejemplo de uso:**
```bash
# El agente puede:
- Crear issue: "Implement task filtering feature"
- Crear branch: "feature/task-filtering"
- Hacer commit y crear PR
- Actualizar changelog automáticamente
```

**Por qué es esencial:**
Automatiza todo el workflow de GitHub, permitiendo a los agentes gestionar el ciclo de vida completo de features.

---

### 3. **Fetch MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Hacer solicitudes HTTP y web scraping

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-fetch
```

**Configuración:**
```json
{
  "mcpServers": {
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    }
  }
}
```

**Uso en Ordo-Todo:**
- Buscar últimas versiones de packages
- Leer documentación de APIs externas
- Verificar breaking changes
- Obtener ejemplos de código de documentación
- Web scraping para investigación

**Por qué es esencial:**
Permite a los agentes investigar y mantenerse actualizado con las últimas tecnologías y patrones.

---

## 🔧 Desarrollo Backend

### 4. **Postgres MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Interactuar directamente con PostgreSQL

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-postgres
```

**Configuración:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/ordo_todo"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Ejecutar queries directamente para debugging
- Analizar performance de queries
- Verificar datos de prueba
- Generar reportes desde la DB
- Optimizar índices

**Por qué es útil:**
Los agentes pueden analizar y optimizar la base de datos directamente sin necesidad de ir a través de la API.

---

### 5. **Puppeteer MCP Server** ⭐⭐⭐⭐

**Propósito:** Automatización de navegador y E2E testing

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-puppeteer
```

**Configuración:**
```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Uso en Ordo-Todo:**
- Testing visual automatizado
- Verificar funcionalidad E2E
- Capturar screenshots de UI
- Generar PDFs de reportes
- Automatizar tareas web

**Por qué es útil:**
Complemento perfecto para Playwright, permite a los agentes verificar visualmente que la UI funciona correctamente.

---

### 6. **Docker MCP Server** ⭐⭐⭐⭐

**Propósito:** Gestionar contenedores y servicios Docker

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-docker
```

**Configuración:**
```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    }
  }
}
```

**Uso en Ordo-Todo:**
- Gestionar contenedor PostgreSQL
- Reiniciar servicios automáticamente
- Verificar logs de contenedores
- Optimizar recursos de Docker
- Testing con múltiples entornos

**Por qué es útil:**
Automatiza la gestión de servicios de desarrollo, permitiendo a los agentes reiniciar y debugging contenedores.

---

## 🎨 Desarrollo Frontend

### 7. **Brave Search MCP Server** ⭐⭐⭐⭐

**Propósito:** Búsqueda web independiente y actualizada

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-brave-search
```

**Configuración:**
```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_brave_api_key"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Buscar últimas versiones de React/Next.js/NestJS
- Encontrar soluciones a problemas específicos
- Investigar bugs y workarounds
- Buscar ejemplos de código actualizados
- Encontrar mejores prácticas

**Por qué es útil:**
Los agentes pueden investigar y encontrar soluciones actuales en lugar de depender solo de conocimiento entrenado.

---

### 8. **Context7 MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Documentación técnica en tiempo real (by Upstash)

**Instalación:**
```bash
npm install -g @upstash/mcp-server-context7
```

**Configuración:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/mcp-server-context7"],
      "env": {
        "UPSTASH_CONTEXT7_API_KEY": "your_api_key"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Acceder a documentación de React 19 específica
- Documentación de Next.js 15 actualizada
- NestJS 11 docs con ejemplos
- TypeScript 5 patterns
- TailwindCSS 4 utilities

**Por qué es esencial:**
Proporciona documentación siempre actualizada y específica de versión, crucial para usar las últimas features.

---

## 📊 Datos & Base de Datos

### 9. **Supabase MCP Server** ⭐⭐⭐⭐

**Propósito:** Integración completa con Supabase (si lo usas)

**Instalación:**
```bash
npm install -g @supabase/mcp-server
```

**Configuración:**
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "your_supabase_url",
        "SUPABASE_ANON_KEY": "your_anon_key"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Gestionar usuarios y autenticación
- Acceder a base de datos de Supabase
- Usar Edge Functions
- Real-time subscriptions
- Storage management

**Por qué es útil:**
Si usas Supabase como backend, este MCP permite a los agentes gestionar todo el servicio.

---

## 🧪 Testing & QA

### 10. **Sequential Thinking MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Razonamiento complejo paso a paso

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-sequential-thinking
```

**Configuración:**
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Uso en Ordo-Todo:**
- Debugging complejo de bugs
- Análisis de arquitectura
- Planificación de refactorización
- Resolver problemas de performance
- Análisis de dependencias circulares

**Por qué es esencial:**
Ayuda a los agentes a pensar problemas complejos de forma sistemática, paso a paso.

---

## 📚 Documentación

### 11. **Notion MCP Server** ⭐⭐⭐

**Propósito:** Integración con Notion para documentación

**Instalación:**
```bash
npm install -g @notionhq/mcp-server
```

**Configuración:**
```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/mcp-server"],
      "env": {
        "NOTION_API_KEY": "your_notion_integration_token"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Documentar features en Notion
- Crear páginas de documentación
- Gestionar knowledge base
- Sync con notas de desarrollo
- Documentación de arquitectura

**Por qué es útil:**
Mantiene la documentación del proyecto sincronizada y organizada en Notion.

---

## 🚀 CI/CD & DevOps

### 12. **Slack MCP Server** ⭐⭐⭐⭐

**Propósito:** Notificaciones y comunicación en Slack

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-slack
```

**Configuración:**
```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-slack"],
      "env": {
        "SLACK_TOKEN": "xoxb-your-token",
        "SLACK_CHANNEL": "#development"
      }
    }
  }
}
```

**Uso en Ordo-Todo:**
- Notificar cuando tests fallan
- Alertas de deployments
- Notificar features completadas
- Compartir métricas de coverage
- Coordinación en equipo

**Por qué es útil:**
Mantiene al equipo informado automáticamente del progreso y problemas.

---

## 🔍 Búsqueda & Información

### 13. **Memory MCP Server** ⭐⭐⭐⭐⭐

**Propósito:** Memoria persistente entre sesiones

**Instalación:**
```bash
npm install -g @modelcontextprotocol/server-memory
```

**Configuración:**
```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```

**Uso en Ordo-Todo:**
- Recordar decisiones de arquitectura
- Guardar patrones usados en el proyecto
- Recordar contexto del proyecto
- Aprender preferencias del equipo
- Memoria de bugs resueltos

**Por qué es esencial:**
Permite a los agentes "aprender" sobre tu proyecto y recordar contexto entre sesiones.

---

## ⚙️ Configuración

### Instalación Completa

**1. Instalar todos los MCPs:**
```bash
# Esenciales
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-fetch

# Backend
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-puppeteer
npm install -g @modelcontextprotocol/server-docker

# Frontend
npm install -g @modelcontextprotocol/server-brave-search
npm install -g @upstash/mcp-server-context7

# Testing
npm install -g @modelcontextprotocol/server-sequential-thinking
npm install -g @modelcontextprotocol/server-memory

# Herramientas
npm install -g @notionhq/mcp-server
npm install -g @modelcontextprotocol/server-slack
```

**2. Configurar en Claude Desktop:**

Editar archivo de configuración:
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:\\Users\\Usuario\\source\\repos"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your_token_here"
      }
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://user:pass@localhost:5432/ordo_todo"
      }
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "your_key_here"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/mcp-server-context7"],
      "env": {
        "UPSTASH_CONTEXT7_API_KEY": "your_key_here"
      }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**3. Reiniciar Claude Desktop:**
Cerrar y volver a abrir Claude Desktop para que cargue los MCPs.

---

## 🎯 Uso Recomendado

### Para Desarrollo Backend

```bash
"Use the nestjs-backend agent with postgres MCP to create a tasks API
 with database integration, tests, and documentation"
```

**MCPs usados:**
- `filesystem` - Leer/escribir código
- `postgres` - Crear y optimizar tablas
- `github` - Crear PR con cambios
- `context7` - Documentación de NestJS 11
- `memory` - Recordar decisiones

### Para Desarrollo Frontend

```bash
"Use the nextjs-frontend agent with context7 and brave-search MCPs
 to build a task list component with latest React 19 patterns"
```

**MCPs usados:**
- `filesystem` - Crear componentes
- `context7` - Documentación de Next.js 15
- `brave-search` - Buscar ejemplos actualizados
- `memory` - Recordar preferencias UI

### Para Testing

```bash
"Use the testing-specialist agent with puppeteer and sequential-thinking MCPs
 to write comprehensive E2E tests and debug failures"
```

**MCPs usados:**
- `filesystem` - Escribir tests
- `puppeteer` - Verificar UI visualmente
- `sequential-thinking` - Debugging complejo
- `github` - Crear issues si tests fallan

---

## 📊 Comparativa de MCPs

| MCP | Prioridad | Uso Principal | Dificultad |
|-----|-----------|---------------|------------|
| **Filesystem** | ⭐⭐⭐⭐⭐ | Operaciones archivos | Fácil |
| **GitHub** | ⭐⭐⭐⭐⭐ | Automatización GitHub | Media |
| **Fetch** | ⭐⭐⭐⭐⭐ | HTTP requests | Fácil |
| **Postgres** | ⭐⭐⭐⭐⭐ | DB operations | Media |
| **Memory** | ⭐⭐⭐⭐⭐ | Persistencia | Fácil |
| **Context7** | ⭐⭐⭐⭐⭐ | Docs en tiempo real | Media |
| **Sequential Thinking** | ⭐⭐⭐⭐⭐ | Razonamiento complejo | Fácil |
| **Brave Search** | ⭐⭐⭐⭐ | Búsqueda web | Fácil |
| **Puppeteer** | ⭐⭐⭐⭐ | Browser automation | Media |
| **Docker** | ⭐⭐⭐⭐ | Gestión contenedores | Media |
| **Slack** | ⭐⭐⭐ | Notificaciones | Fácil |
| **Notion** | ⭐⭐⭐ | Documentación | Media |

---

## 🔧 Troubleshooting

### MCP no aparece en Claude

**Solución:**
1. Verificar que el archivo de configuración sea válido JSON
2. Reiniciar Claude Desktop completamente
3. Verificar logs en `~/Library/Logs/Claude/`

### Error de autenticación GitHub

**Solución:**
1. Crear token en GitHub Settings → Developer settings → Personal access tokens
2. Dar permisos: `repo`, `issues`, `pull_requests`
3. Actualizar config con nuevo token

### PostgreSQL connection refused

**Solución:**
1. Verificar que PostgreSQL esté corriendo: `docker ps`
2. Verificar connection string
3. Asegurar que la DB acepte conexiones locales

---

## 📚 Recursos

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Awesome MCP Servers (GitHub)](https://github.com/wong2/awesome-mcp-servers)
- [Top 10 MCP Servers 2025](https://www.intuz.com/blog/best-mcp-servers)
- [MCP for Frontend Developers](https://medium.com/inspire-otivate/top-15-model-context-protocol-mcp-servers-for-frontend-developers-2025-8ba53ae8953c)
- [Technical Comparison](https://graphite.com/guides/mcp-server-comparison-2025)

---

## 🎓 Conclusión

**MCPs Esenciales Mínimos (Start Here):**
1. ✅ Filesystem
2. ✅ GitHub
3. ✅ Fetch
4. ✅ Memory
5. ✅ Context7

**MCPs Recomendados (Add Later):**
6. PostgreSQL
7. Brave Search
8. Sequential Thinking
9. Puppeteer
10. Docker

**Estos MCPs transformarán tus agentes de Claude Code en verdaderos autómatas inteligentes capaces de:**
- 📖 Aprender sobre tu proyecto (Memory)
- 🔍 Investigar soluciones actuales (Fetch + Brave Search)
- 📚 Usar documentación actualizada (Context7)
- 💻 Escribir y modificar código (Filesystem)
- 🤖 Automatizar GitHub completo (GitHub)
- 🗄️ Optimizar base de datos (PostgreSQL)
- 🧪 Debugging complejo (Sequential Thinking)

---

**Built with ❤️ for Ordo-Todo**

*Configura estos MCPs y verás cómo la productividad de tus agentes se dispara 🚀*
