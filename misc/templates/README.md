# 📂 Templates de Código

Colección de templates y componentes reutilizables para acelerar el desarrollo con patrones y mejores prácticas establecidas.

## 📋 Categorías Disponibles

| Categoría            | Descripción                     | Archivos                     | Uso                      |
| -------------------- | ------------------------------- | ---------------------------- | ------------------------ |
| 🧩 **Components**    | Componentes UI reutilizables    | React, Flutter widgets       | Frontend development     |
| 🌐 **API**           | Templates de APIs y servicios   | REST, GraphQL endpoints      | Backend development      |
| 🎨 **Styling**       | Sistemas de diseño y temas      | CSS, SCSS, styled-components | UI/UX implementation     |
| 📊 **Database**      | Modelos y schemas de datos      | SQL, NoSQL, migrations       | Data modeling            |
| 🧪 **Testing**       | Templates de tests              | Unit, integration, E2E       | Quality assurance        |
| 🔧 **Configuration** | Configuraciones de herramientas | ESLint, Prettier, Docker     | Development setup        |
| 📱 **Mobile**        | Componentes y screens móviles   | Flutter, React Native        | Mobile development       |
| 🛠️ **Utilities**     | Funciones y helpers útiles      | TypeScript, Dart, Python     | Cross-platform utilities |

## 🚀 Uso de Templates

### Estructura de Naming

```
templates/
├── components/
│   ├── react/
│   │   ├── Button.template.tsx
│   │   ├── Form.template.tsx
│   │   └── Modal.template.tsx
│   └── flutter/
│       ├── CustomButton.template.dart
│       └── CustomForm.template.dart
├── api/
│   ├── controllers/
│   ├── services/
│   └── middleware/
├── database/
│   ├── models/
│   └── migrations/
└── testing/
    ├── unit/
    ├── integration/
    └── e2e/
```

### Convención de Archivos

- **Nombre**: `[ComponentName].template.[ext]`
- **Descripción**: Comentario superior explicando el propósito
- **Variables**: Usar `{{variable}}` para elementos customizables
- **Instrucciones**: Comentarios inline para guiar la implementación

## 📝 Templates Principales

### React Components

- **Button**: Botón configurable con variantes y estados
- **Form**: Formulario con validación y manejo de errores
- **Modal**: Modal responsive con overlay
- **DataTable**: Tabla con paginación y filtros
- **Card**: Tarjeta de contenido flexible
- **Navigation**: Sistema de navegación responsive

### Flutter Widgets

- **CustomButton**: Widget de botón personalizable
- **FormField**: Campo de formulario con validación
- **ListItem**: Item de lista con acciones
- **ScreenTemplate**: Template base para screens
- **AnimatedContainer**: Contenedor con animaciones
- **NetworkImage**: Image con loading y error states

### API Templates

- **Controller**: Controlador REST con CRUD operations
- **Service**: Servicio de lógica de negocio
- **Middleware**: Middleware de autenticación y validación
- **Repository**: Patrón repository para datos
- **ErrorHandler**: Manejo centralizado de errores
- **Validation**: Esquemas de validación

### Database Models

- **User**: Modelo de usuario completo
- **BaseModel**: Modelo base con timestamps
- **Relationship**: Relaciones entre modelos
- **Migration**: Template de migración
- **Seeder**: Datos de prueba iniciales

## 🎨 Design System Templates

### Color Palette Template

```css
/* colors.template.css */
:root {
  /* Primary Colors */
  --color-primary-50: {{primary-50}};
  --color-primary-100: {{primary-100}};
  --color-primary-500: {{primary-500}};
  --color-primary-900: {{primary-900}};

  /* Secondary Colors */
  --color-secondary-50: {{secondary-50}};
  --color-secondary-500: {{secondary-500}};

  /* Neutral Colors */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-900: #111827;

  /* Semantic Colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### Typography Template

```css
/* typography.template.css */
:root {
  /* Font Families */
  --font-primary: {{primary-font}}, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-secondary: {{secondary-font}}, Georgia, serif;
  --font-mono: {{mono-font}}, 'Monaco', 'Courier New', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}
```

## 🔧 Configuration Templates

### ESLint Template

```json
// .eslintrc.template.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2022,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-var": "error"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### Docker Template

```dockerfile
# Dockerfile.template
FROM node:{{node-version}}-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:{{node-version}}-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE {{port}}

CMD ["node", "dist/server.js"]
```

## 📱 Mobile Templates

### Flutter Screen Template

```dart
// screen.template.dart
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class {{ScreenName}}Screen extends StatefulWidget {
  const {{ScreenName}}Screen({Key? key}) : super(key: key);

  @override
  State<{{ScreenName}}Screen> createState() => _{{ScreenName}}ScreenState();
}

class _{{ScreenName}}ScreenState extends State<{{ScreenName}}Screen> {
  @override
  void initState() {
    super.initState();
    // Initialize screen data
    context.read<{{ScreenName}}Bloc>().add({{ScreenName}}LoadEvent());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('{{Screen Title}}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _refreshData(),
          ),
        ],
      ),
      body: BlocBuilder<{{ScreenName}}Bloc, {{ScreenName}}State>(
        builder: (context, state) {
          if (state is {{ScreenName}}Loading) {
            return const Center(child: CircularProgressIndicator());
          } else if (state is {{ScreenName}}Error) {
            return _buildErrorWidget(state.message);
          } else if (state is {{ScreenName}}Loaded) {
            return _buildContent(state.data);
          }
          return const SizedBox.shrink();
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _onFloatingActionPressed(),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildContent({{DataType}} data) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header section
          _buildHeaderSection(data),

          const SizedBox(height: 16),

          // Main content
          Expanded(
            child: _buildMainContent(data),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderSection({{DataType}} data) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(
              Icons.{{icon}},
              size: 32,
              color: Theme.of(context).colorScheme.primary,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '{{Header Title}}',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  Text(
                    '{{Subtitle}}',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMainContent({{DataType}} data) {
    return ListView.builder(
      itemCount: data.items.length,
      itemBuilder: (context, index) {
        final item = data.items[index];
        return Card(
          margin: const EdgeInsets.only(bottom: 8.0),
          child: ListTile(
            leading: CircleAvatar(
              child: Text(item.id.substring(0, 1)),
            ),
            title: Text(item.title),
            subtitle: Text(item.subtitle),
            trailing: IconButton(
              icon: const Icon(Icons.more_vert),
              onPressed: () => _showItemOptions(item),
            ),
            onTap: () => _onItemTap(item),
          ),
        );
      },
    );
  }

  Widget _buildErrorWidget(String message) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline,
            size: 64,
            color: Colors.red,
          ),
          const SizedBox(height: 16),
          Text(
            'Error',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _refreshData(),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  void _refreshData() {
    context.read<{{ScreenName}}Bloc>().add({{ScreenName}}RefreshEvent());
  }

  void _onFloatingActionPressed() {
    // Handle floating action button press
    Navigator.pushNamed(context, '/{{route}}');
  }

  void _onItemTap({{ItemType}} item) {
    // Handle item tap
    Navigator.pushNamed(
      context,
      '/{{detail-route}}',
      arguments: item,
    );
  }

  void _showItemOptions({{ItemType}} item) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.edit),
              title: const Text('Edit'),
              onTap: () => _editItem(item),
            ),
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('Delete'),
              onTap: () => _deleteItem(item),
            ),
          ],
        ),
      ),
    );
  }

  void _editItem({{ItemType}} item) {
    Navigator.pop(context); // Close bottom sheet
    // Navigate to edit screen
  }

  void _deleteItem({{ItemType}} item) {
    Navigator.pop(context); // Close bottom sheet
    // Show confirmation dialog and delete
  }
}
```

## 🧪 Testing Templates

### Integration Test Template

```typescript
// integration.template.test.ts
import { describe, test, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app';
import { setupTestDatabase, cleanupTestDatabase } from '../helpers/database';
import { createTestUser, getAuthToken } from '../helpers/auth';

describe('{{Feature}} Integration Tests', () => {
  let authToken: string;
  let testUser: any;

  beforeAll(async () => {
    await setupTestDatabase();
    testUser = await createTestUser({ role: 'admin' });
    authToken = await getAuthToken(testUser);
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(async () => {
    // Reset test data before each test
    await {{Model}}.deleteMany({});
  });

  describe('GET /api/{{endpoint}}', () => {
    test('should return {{resource}} list for authenticated user', async () => {
      // Arrange
      const test{{Resource}} = await {{Model}}.create({
        {{field1}}: 'test value',
        {{field2}}: 'another value',
        userId: testUser.id
      });

      // Act
      const response = await request(app)
        .get('/api/{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].{{field1}}).toBe('test value');
    });

    test('should return 401 for unauthenticated requests', async () => {
      const response = await request(app)
        .get('/api/{{endpoint}}')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('token');
    });

    test('should support pagination', async () => {
      // Create multiple test items
      for (let i = 0; i < 15; i++) {
        await {{Model}}.create({
          {{field1}}: `test value ${i}`,
          userId: testUser.id
        });
      }

      const response = await request(app)
        .get('/api/{{endpoint}}?page=2&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.total).toBe(15);
    });
  });

  describe('POST /api/{{endpoint}}', () => {
    const valid{{Resource}}Data = {
      {{field1}}: 'New {{resource}}',
      {{field2}}: 'Description here',
      {{field3}}: true
    };

    test('should create {{resource}} with valid data', async () => {
      const response = await request(app)
        .post('/api/{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(valid{{Resource}}Data)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.{{field1}}).toBe(valid{{Resource}}Data.{{field1}});
      expect(response.body.data.userId).toBe(testUser.id);

      // Verify in database
      const created{{Resource}} = await {{Model}}.findById(response.body.data.id);
      expect(created{{Resource}}).not.toBeNull();
    });

    test('should validate required fields', async () => {
      const invalidData = { {{field2}}: 'Only description' };

      const response = await request(app)
        .post('/api/{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: '{{field1}}',
          message: expect.any(String)
        })
      );
    });

    test('should handle business logic validation', async () => {
      // Create constraint that would be violated
      await {{Model}}.create({
        {{field1}}: valid{{Resource}}Data.{{field1}},
        userId: testUser.id
      });

      const response = await request(app)
        .post('/api/{{endpoint}}')
        .set('Authorization', `Bearer ${authToken}`)
        .send(valid{{Resource}}Data)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('PUT /api/{{endpoint}}/:id', () => {
    let existing{{Resource}}: any;

    beforeEach(async () => {
      existing{{Resource}} = await {{Model}}.create({
        {{field1}}: 'Original value',
        {{field2}}: 'Original description',
        userId: testUser.id
      });
    });

    test('should update {{resource}} with valid data', async () => {
      const updateData = {
        {{field1}}: 'Updated value',
        {{field2}}: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/{{endpoint}}/${existing{{Resource}}.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.{{field1}}).toBe(updateData.{{field1}});

      // Verify in database
      const updated{{Resource}} = await {{Model}}.findById(existing{{Resource}}.id);
      expect(updated{{Resource}}.{{field1}}).toBe(updateData.{{field1}});
    });

    test('should return 404 for non-existent {{resource}}', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .put(`/api/{{endpoint}}/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ {{field1}}: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should prevent unauthorized updates', async () => {
      const otherUser = await createTestUser({ role: 'user' });
      const otherUserToken = await getAuthToken(otherUser);

      const response = await request(app)
        .put(`/api/{{endpoint}}/${existing{{Resource}}.id}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({ {{field1}}: 'Unauthorized update' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/{{endpoint}}/:id', () => {
    let existing{{Resource}}: any;

    beforeEach(async () => {
      existing{{Resource}} = await {{Model}}.create({
        {{field1}}: 'To be deleted',
        userId: testUser.id
      });
    });

    test('should delete {{resource}} successfully', async () => {
      const response = await request(app)
        .delete(`/api/{{endpoint}}/${existing{{Resource}}.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify deletion in database
      const deleted{{Resource}} = await {{Model}}.findById(existing{{Resource}}.id);
      expect(deleted{{Resource}}).toBeNull();
    });

    test('should return 404 for non-existent {{resource}}', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const response = await request(app)
        .delete(`/api/{{endpoint}}/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
```

## 📚 Cómo Usar los Templates

### 1. Selección de Template

```bash
# Buscar template apropiado
find templates/ -name "*Button*" -type f

# Copiar template al proyecto
cp templates/components/react/Button.template.tsx src/components/Button.tsx
```

### 2. Customización

```bash
# Reemplazar variables del template
sed -i 's/{{ComponentName}}/CustomButton/g' src/components/Button.tsx
sed -i 's/{{primary-color}}/#3b82f6/g' src/styles/colors.css
```

### 3. Validación

```bash
# Verificar sintaxis
npm run lint src/components/Button.tsx

# Ejecutar tests
npm test src/components/Button.test.tsx
```

## 🔧 Template Generator (Script)

```bash
#!/bin/bash
# generate-template.sh

TEMPLATE_TYPE=$1
COMPONENT_NAME=$2
OUTPUT_DIR=$3

if [ -z "$TEMPLATE_TYPE" ] || [ -z "$COMPONENT_NAME" ]; then
  echo "Usage: ./generate-template.sh <type> <name> [output-dir]"
  echo "Types: component, api, screen, test"
  exit 1
fi

OUTPUT_DIR=${OUTPUT_DIR:-"src/"}

case $TEMPLATE_TYPE in
  "component")
    cp templates/components/react/Component.template.tsx "${OUTPUT_DIR}/${COMPONENT_NAME}.tsx"
    sed -i "s/{{ComponentName}}/${COMPONENT_NAME}/g" "${OUTPUT_DIR}/${COMPONENT_NAME}.tsx"
    ;;
  "api")
    cp templates/api/controller.template.ts "${OUTPUT_DIR}/${COMPONENT_NAME}Controller.ts"
    sed -i "s/{{ResourceName}}/${COMPONENT_NAME}/g" "${OUTPUT_DIR}/${COMPONENT_NAME}Controller.ts"
    ;;
  "screen")
    cp templates/mobile/screen.template.dart "${OUTPUT_DIR}/${COMPONENT_NAME}Screen.dart"
    sed -i "s/{{ScreenName}}/${COMPONENT_NAME}/g" "${OUTPUT_DIR}/${COMPONENT_NAME}Screen.dart"
    ;;
  "test")
    cp templates/testing/unit.template.test.ts "${OUTPUT_DIR}/${COMPONENT_NAME}.test.ts"
    sed -i "s/{{TestName}}/${COMPONENT_NAME}/g" "${OUTPUT_DIR}/${COMPONENT_NAME}.test.ts"
    ;;
  *)
    echo "Unknown template type: $TEMPLATE_TYPE"
    exit 1
    ;;
esac

echo "Template generated: ${OUTPUT_DIR}/${COMPONENT_NAME}"
```

---

_Templates - Acelerando el desarrollo con patrones probados_ 📂
