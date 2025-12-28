# Shared Packages Rules

**Specific rules for packages in `packages/` directory**

## 📦 Available Packages

```
packages/
├── core/          # Domain logic, entities, use cases
├── db/            # Prisma schema & migrations
├── ui/            # Shared React components
├── hooks/         # React Query hooks factory
├── stores/        # Zustand stores
├── api-client/    # REST API client
├── i18n/          # Translations (3 languages)
├── styles/        # Shared Tailwind config
├── config/        # Shared configs (ESLint, TypeScript)
├── eslint-config/ # ESLint configuration
└── typescript-config/ # TypeScript configuration
```

---

## 🎨 packages/ui (Shared Components)

### Rule 1: Component Location

```
packages/ui/src/
├── components/
│   ├── ui/              # Base components (Button, Input, Card, etc.)
│   ├── task/            # Task-specific components
│   ├── project/         # Project-specific components
│   ├── workspace/       # Workspace-specific components
│   ├── analytics/       # Analytics components
│   ├── shared/          # Other shared components
│   └── index.ts         # Barrel exports
├── lib/
│   └── utils.ts         # Shared utilities
└── index.ts             # Main barrel export
```

### Rule 2: Platform-Agnostic Components

**Components MUST NOT:**
- ❌ Use platform-specific hooks (`useRouter`, `useSearchParams`)
- ❌ Use platform-specific APIs (`fetch`, `window`)
- ❌ Import from apps (`@ordo-todo/web`, `@ordo-todo/mobile`)
- ❌ Use environment variables

**Components MUST:**
- ✅ Accept data via props
- ✅ Accept callbacks via props
- ✅ Be usable in web, mobile, desktop
- ✅ Accept i18n labels via props (optional)

```typescript
// ✅ CORRECT: Platform-agnostic
interface TaskCardProps {
  task: Task;                          // Data from parent
  onTaskClick: (id: string) => void;   // Callback from parent
  onDelete?: (id: string) => void;     // Optional callback
  labels?: {                           // i18n from parent
    complete?: string;
    delete?: string;
  };
  className?: string;                  // Styling
}

export function TaskCard({
  task,
  onTaskClick,
  onDelete,
  labels = {},
  className = '',
}: TaskCardProps) {
  return (
    <Card
      onClick={() => onTaskClick(task.id)}
      className={className}
    >
      <h3>{task.title}</h3>
      {onDelete && (
        <Button onClick={() => onDelete(task.id)}>
          {labels.delete ?? 'Delete'}
        </Button>
      )}
    </Card>
  );
}

// ❌ WRONG: Platform-specific
import { useRouter } from 'next/navigation';  // WRONG!
import { useTasks } from '@ordo-todo/hooks';   // WRONG!
import { useTranslation } from 'next-intl';    // WRONG!
```

### Rule 3: Component Exports

**Export from barrel files:**

```typescript
// packages/ui/src/components/task/index.ts
export { TaskCard } from './task-card';
export { TaskList } from './task-list';
export { TaskForm } from './task-form';

// packages/ui/src/components/index.ts
export * from './ui';
export * from './task';
export * from './project';
export * from './workspace';

// packages/ui/src/index.ts
export * from './components';
export * from './lib';
```

### Rule 4: Use TypeScript Types

**All components must have proper types:**

```typescript
// ✅ CORRECT: Properly typed
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
```

### Rule 5: Styling Consistency

**Use TailwindCSS + class-variance-authority:**

```typescript
// ✅ CORRECT: CVA for variants
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-500 text-white hover:bg-gray-600",
        outline: "border border-gray-300 bg-transparent hover:bg-gray-100",
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);
```

---

## 🪝 packages/hooks (React Query Hooks)

### Rule 6: Hook Factory Pattern

**Provide factory functions, not direct hooks:**

```typescript
// ✅ CORRECT: Hook factory
// packages/hooks/src/tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function createTaskHooks(apiClient: ApiClient) {
  return {
    useTasks: () =>
      useQuery({
        queryKey: ['tasks'],
        queryFn: apiClient.tasks.getAll,
        staleTime: 5 * 60 * 1000, // 5 minutes
      }),

    useTask: (id: string) =>
      useQuery({
        queryKey: ['tasks', id],
        queryFn: () => apiClient.tasks.getOne(id),
        enabled: !!id,
      }),

    useCreateTask: () =>
      useMutation({
        mutationFn: apiClient.tasks.create,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
      }),

    useUpdateTask: () =>
      useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) =>
          apiClient.tasks.update(id, data),
        onSuccess: (_, variables) => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['tasks', variables.id] });
        },
      }),

    useDeleteTask: () =>
      useMutation({
        mutationFn: apiClient.tasks.delete,
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
        },
      }),
  };
}
```

### Rule 7: Usage in Apps

```typescript
// ✅ CORRECT: Initialize in app
// apps/web/src/lib/api-hooks.ts
import { createTaskHooks, createProjectHooks } from '@ordo-todo/hooks';
import { apiClient } from '@/lib/api-client';

export const useTasks = createTaskHooks(apiClient).useTasks;
export const useCreateTask = createTaskHooks(apiClient).useCreateTask;
export const useProjects = createProjectHooks(apiClient).useProjects;

// ✅ CORRECT: Use in component
import { useTasks, useCreateTask } from '@/lib/api-hooks';

export function TaskList() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();

  return (
    <div>
      {tasks?.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}
```

---

## 🗄️ packages/stores (Zustand Stores)

### Rule 8: Store Structure

```typescript
// ✅ CORRECT: Zustand store with persistence
// packages/stores/src/ui.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // State
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;

  // Actions
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setLanguage: (language: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      sidebarCollapsed: false,
      theme: 'system',
      language: 'en',

      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'ui-storage', // localStorage key
    }
  )
);
```

### Rule 9: Store Slices

**Split large stores into slices:**

```typescript
// packages/stores/src/index.ts
export { useUIStore } from './ui';
export { useTaskStore } from './task';
export { useProjectStore } from './project';
```

---

## 💾 packages/core (Domain Logic)

### Rule 10: Pure Domain Logic

**packages/core MUST:**
- ✅ Contain ONLY domain entities and use cases
- ✅ Have NO external dependencies (except testing libs)
- ✅ Be platform-agnostic
- ✅ Be testable without infrastructure

```typescript
// ✅ CORRECT: Pure domain entity
// packages/core/src/task/entities/task.entity.ts
export class Task extends Entity<TaskProps> {
  constructor(props: TaskProps, mode: EntityMode = "valid") {
    super(props, mode);
    // Validation happens in constructor when mode is "valid"
  }

  // Domain logic (business rules)
  complete(): Task {
    return this.clone({ status: TaskStatus.DONE, completedAt: new Date() });
  }

  assign(userId: string): Task {
    return this.clone({ assignedTo: userId });
  }

  isOverdue(): boolean {
    return this.dueDate ? new Date() > this.dueDate : false;
  }
}

// ✅ CORRECT: Use case
// packages/core/src/task/use-cases/create-task.use-case.ts
export class CreateTaskUseCase implements UseCase<CreateTaskInput, Task> {
  constructor(private readonly taskRepo: TaskRepository) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    // Domain validation
    const task = new Task({
      title: input.title,
      status: TaskStatus.TODO,
      userId: input.userId,
    });

    // Persistence via repository
    await this.taskRepo.save(task);

    return task;
  }
}
```

### Rule 11: NO Infrastructure in Core

```typescript
// ❌ WRONG: Infrastructure dependencies
import { Prisma } from '@prisma/client';  // WRONG!
import { Inject } from '@nestjs/common';  // WRONG!
import axios from 'axios';                 // WRONG!

// ✅ CORRECT: Pure TypeScript
export class Task extends Entity<TaskProps> {
  // Pure domain logic
}
```

---

## 🗃️ packages/db (Database)

### Rule 12: Schema Location

**ALL database schema changes in packages/db:**

```prisma
// packages/db/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  engineType = "library"
}

datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model Task {
  id          String   @id @default(cuid())
  title       String
  status      TaskStatus @default(TODO)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([status])
}
```

### Rule 13: Migrations

**Run migrations from packages/db:**

```bash
cd packages/db
npx prisma migrate dev --name add_task_completed_at
npx prisma migrate deploy          # For production
npx prisma generate                # After schema changes
```

---

## 🌐 packages/i18n (Translations)

### Rule 14: Translation Structure

```
packages/i18n/src/
├── locales/
│   ├── en.json          # English
│   ├── es.json          # Spanish
│   └── pt.json          # Portuguese
└── index.ts
```

### Rule 15: Translation Keys

**Use nested structure:**

```json
// locales/en.json
{
  "task": {
    "title": "Task",
    "create": "Create Task",
    "delete": "Delete Task",
    "complete": "Complete Task"
  },
  "project": {
    "title": "Project",
    "create": "Create Project"
  }
}
```

### Rule 16: Usage in Apps

```typescript
// ✅ CORRECT: Use next-intl in web app
import { useTranslations } from 'next-intl';

export function TaskForm() {
  const t = useTranslations('task');

  return (
    <form>
      <h2>{t('create')}</h2>
      <button>{t('complete')}</button>
    </form>
  );
}

// ✅ CORRECT: Pass to components from packages/ui
<TaskCard
  task={task}
  onTaskClick={handleClick}
  labels={{
    complete: t('complete'),
    delete: t('delete'),
  }}
/>
```

---

## 📡 packages/api-client (REST Client)

### Rule 17: Centralized API Client

```typescript
// ✅ CORRECT: Centralized axios instance
// packages/api-client/src/index.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor (add auth token)
apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor (handle errors)
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const tasksAPI = {
  getAll: () => apiClient.get('/tasks'),
  getOne: (id: string) => apiClient.get(`/tasks/${id}`),
  create: (data: CreateTaskDto) => apiClient.post('/tasks', data),
  update: (id: string, data: UpdateTaskDto) => apiClient.patch(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete(`/tasks/${id}`),
};

export const projectsAPI = {
  getAll: () => apiClient.get('/projects'),
  create: (data: CreateProjectDto) => apiClient.post('/projects', data),
  // ...
};
```

---

## 🎨 packages/styles (Shared Styles)

### Rule 18: Tailwind Configuration

```typescript
// packages/styles/tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../../apps/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
```

---

## 🧪 Testing Rules for Packages

### Rule 19: All Packages Must Have Tests

```bash
# Every package must have:
npm run test           # Unit tests
npm run test:coverage  # With coverage report
```

### Rule 20: Test packages/ui Components

```typescript
// packages/ui/src/components/task/__tests__/task-card.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskCard } from '../task-card';

describe('TaskCard', () => {
  it('renders task title', () => {
    render(
      <TaskCard
        task={{ id: '1', title: 'Test Task' }}
        onTaskClick={vi.fn()}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

### Rule 21: Test packages/hooks

```typescript
// packages/hooks/src/__tests__/tasks.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { createTaskHooks } from '../tasks';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('createTaskHooks', () => {
  it('fetches tasks', async () => {
    const queryClient = new QueryClient();
    const apiClient = {
      tasks: { getAll: vi.fn().mockResolvedValue([{ id: '1', title: 'Test' }]) },
    };

    const { result } = renderHook(
      () => createTaskHooks(apiClient).useTasks(),
      { wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      )}
    );

    await waitFor(() => expect(result.current.data).toEqual([{ id: '1', title: 'Test' }]));
  });
});
```

---

## 🎯 Quality Checklist for Packages

Before completing any package work:

```bash
# Run in package directory:
npm run lint           # ✅ Must pass
npm run check-types    # ✅ Must pass
npm run test           # ✅ Must pass
npm run build          # ✅ Must succeed
```

**Additional checks:**
- [ ] Component is platform-agnostic (for packages/ui)
- [ ] Hook factory returns proper hooks (for packages/hooks)
- [ ] Store has proper TypeScript types (for packages/stores)
- [ ] Domain logic has no infrastructure deps (for packages/core)
- [ ] Schema changes include migrations (for packages/db)
- [ ] Translations exist for all 3 languages (for packages/i18n)
- [ ] API endpoints are typed (for packages/api-client)

---

## 📦 Import Rules

### Rule 22: Use Workspace Protocol

```typescript
// ✅ CORRECT: Workspace protocol
import { Button } from '@ordo-todo/ui';
import { useTasks } from '@ordo-todo/hooks';
import { Task } from '@ordo-todo/core';
import { apiClient } from '@ordo-todo/api-client';

// ❌ WRONG: Relative imports
import { Button } from '../../../ui/src/components/button';
```

### Rule 23: No Circular Dependencies

**Packages must NOT depend on each other in cycles:**

```
✅ ALLOWED:
packages/ui → packages/core
packages/hooks → packages/api-client
packages/api-client → packages/core

❌ FORBIDDEN:
packages/core → packages/ui (domain logic shouldn't depend on UI)
packages/ui → packages/hooks (UI shouldn't depend on data fetching)
```

---

**Built with ❤️ for Ordo-Todo Packages**

*Follow these rules to maintain consistency and reusability across shared packages.*
