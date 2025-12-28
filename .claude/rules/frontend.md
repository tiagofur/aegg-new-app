# Frontend Rules (Next.js)

**Specific rules for `apps/web` (Next.js 15 + React 19)**

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [App Router Rules](#app-router-rules)
3. [Component Rules](#component-rules)
4. [State Management](#state-management)
5. [Styling Rules](#styling-rules)
6. [Data Fetching](#data-fetching)
7. [Testing Rules](#testing-rules)
8. [Performance Rules](#performance-rules)
9. [Accessibility Rules](#accessibility-rules)

---

## 🏗️ Project Structure

```
apps/web/
├── app/                      # App Router (Next.js 15)
│   ├── (auth)/              # Auth routes group
│   ├── (dashboard)/         # Dashboard routes group
│   ├── api/                 # Route handlers (if needed)
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── providers/           # Context providers
│   └── [feature]/           # Feature-specific components
├── lib/
│   ├── api-client.ts        # Axios configuration
│   ├── api-hooks.ts         # React Query hooks
│   └── utils.ts             # Utility functions
├── styles/
│   └── globals.css          # Global styles
└── public/                  # Static assets
```

### Rule 1: Use App Router (Not Pages Router)

```typescript
// ✅ CORRECT: App Router structure
app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── register/
│       └── page.tsx
├── (dashboard)/
│   ├── layout.tsx          # Shared layout for dashboard
│   ├── page.tsx            # /dashboard
│   └── tasks/
│       ├── page.tsx        # /dashboard/tasks
│       └── [id]/
│           └── page.tsx    # /dashboard/tasks/[id]
└── layout.tsx              # Root layout

// ❌ WRONG: Pages Router (deprecated)
pages/
├── _app.tsx
├── index.tsx
└── tasks/
    └── [id].tsx
```

---

## 🚀 App Router Rules

### Rule 2: Server Components by Default

**Use Server Components unless you need interactivity:**

```typescript
// ✅ CORRECT: Server Component (default)
// app/tasks/page.tsx
import { tasksAPI } from '@ordo-todo/api-client';

export default async function TasksPage() {
  // Direct data fetching in Server Component
  const tasks = await tasksAPI.getAll();

  return (
    <div>
      <h1>Tasks</h1>
      <TaskList tasks={tasks} />
    </div>
  );
}

// ✅ CORRECT: Client Component for interactivity
// components/task-list.tsx
'use client';

import { useState } from 'react';

export function TaskList({ tasks }: { tasks: Task[] }) {
  const [filter, setFilter] = useState('all');

  return (
    <div>
      <Filter value={filter} onChange={setFilter} />
      {tasks.filter(/* ... */).map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
```

### Rule 3: Use Server Actions for Mutations

```typescript
// ✅ CORRECT: Server Actions for mutations
// app/actions/tasks.ts
'use server';

import { revalidatePath } from 'next/cache';
import { tasksAPI } from '@ordo-todo/api-client';

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;

  if (!title || title.length < 3) {
    return { error: 'Title must be at least 3 characters' };
  }

  const task = await tasksAPI.create({ title });

  revalidatePath('/dashboard/tasks');
  return { success: true, task };
}

// ✅ CORRECT: Use in Client Component
// components/create-task-form.tsx
'use client';

import { useFormState } from 'react-dom';
import { createTask } from '@/app/actions/tasks';

export function CreateTaskForm() {
  const [state, formAction] = useFormState(createTask, initialState);

  return (
    <form action={formAction}>
      <input name="title" required minLength={3} />
      {state.error && <span>{state.error}</span>}
      <button type="submit">Create</button>
    </form>
  );
}
```

### Rule 4: Route Groups for Layouts

```typescript
// ✅ CORRECT: Route groups for shared layouts
app/
├── (auth)/              # Group name in parentheses = not in URL
│   ├── layout.tsx       # Shared auth layout (nav, footer)
│   ├── login/
│   │   └── page.tsx     # /login
│   └── register/
│       └── page.tsx     # /register
│
├── (dashboard)/         # Dashboard routes
│   ├── layout.tsx       # Sidebar, header
│   ├── page.tsx         # /dashboard
│   └── tasks/
│       └── page.tsx     # /dashboard/tasks
```

---

## 🧩 Component Rules

### Rule 5: Use Shared Components from packages/ui

**If component is used by 2+ features, move to packages/ui:**

```typescript
// ✅ CORRECT: Import from packages/ui
import { Button, Card, Input } from '@ordo-todo/ui';
import { TaskCard } from '@ordo-todo/ui';

export function TasksPage() {
  return (
    <div>
      <Button>Create Task</Button>
      <TaskCard task={task} />
    </div>
  );
}

// ❌ WRONG: Local duplicates
// Don't create Button in apps/web/components if it exists in packages/ui
```

### Rule 6: Platform-Agnostic Components

**Components in packages/ui MUST be platform-agnostic:**

```typescript
// ✅ CORRECT: Platform-agnostic (packages/ui)
interface TaskCardProps {
  task: Task;                          // Data from parent
  onTaskClick: (id: string) => void;   // Callback from parent
  labels?: {                           // i18n from parent
    complete?: string;
    delete?: string;
  };
}

export function TaskCard({ task, onTaskClick, labels }: TaskCardProps) {
  return (
    <Card onClick={() => onTaskClick(task.id)}>
      <h3>{task.title}</h3>
    </Card>
  );
}

// ❌ WRONG: Uses hooks (not platform-agnostic)
import { useTasks } from '@ordo-todo/hooks';  // WRONG!
import { useTranslation } from 'next-intl';   // WRONG!
```

### Rule 7: Container/Presentational Pattern

```typescript
// ✅ CORRECT: Container (apps/web/components/tasks)
'use client';

import { useTasks } from '@ordo-todo/hooks';
import { TaskCard } from '@ordo-todo/ui';

export function TaskListContainer() {
  const { data: tasks, isLoading, error } = useTasks();

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div>
      {tasks?.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onTaskClick={(id) => router.push(`/tasks/${id}`)}
          onComplete={(id) => completeTask.mutate(id)}
          labels={{ complete: 'Complete', delete: 'Delete' }}
        />
      ))}
    </div>
  );
}

// ✅ CORRECT: Presentational (packages/ui)
export function TaskCard({ task, onTaskClick, onComplete, labels }: TaskCardProps) {
  return <Card>...</Card>;
}
```

---

## 📊 State Management

### Rule 8: Use React Query for Server State

```typescript
// ✅ CORRECT: React Query from packages/hooks
import { useTasks, useCreateTask, useDeleteTask } from '@ordo-todo/hooks';

export function TaskList() {
  const { data: tasks, isLoading, error } = useTasks();
  const createTask = useCreateTask();
  const deleteTask = useDeleteTask();

  return (
    <div>
      {tasks?.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onDelete={() => deleteTask.mutate(task.id)}
        />
      ))}
    </div>
  );
}
```

### Rule 9: Use Zustand for Client State

```typescript
// ✅ CORRECT: Zustand store from packages/stores
import { useUIStore } from '@ordo-todo/stores';

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside className={`${sidebarCollapsed ? 'w-16' : 'w-64'}`}>
      <button onClick={toggleSidebar}>Toggle</button>
    </aside>
  );
}
```

---

## 🎨 Styling Rules

### Rule 10: NO Transparencies

**Backgrounds MUST be solid colors:**

```tsx
// ✅ CORRECT: Solid colors
<div className="bg-white dark:bg-gray-900">
  <Button className="bg-blue-500 hover:bg-blue-600 text-white">
    Click me
  </Button>
</div>

// ❌ WRONG: Transparencies
<div className="bg-white/80 dark:bg-gray-900/90">
<Button className="bg-blue-500/90">
```

### Rule 11: NO Gradients

**Use solid colors only:**

```tsx
// ✅ CORRECT: Solid color
<div className="bg-blue-500 text-white">Button</div>

// ❌ WRONG: Gradients
<div className="bg-gradient-to-r from-blue-500 to-purple-500">
```

### Rule 12: Perfect Responsiveness

**ALL components MUST support mobile, tablet, desktop:**

```tsx
// ✅ CORRECT: Mobile-first responsive
<div className="
  grid
  grid-cols-1          /* Mobile: 320px - 640px */
  md:grid-cols-2       /* Tablet: 641px - 1024px */
  lg:grid-cols-3       /* Desktop: 1025px+ */
  gap-4
">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>

// ✅ CORRECT: Responsive text
<h1 className="text-2xl md:text-3xl lg:text-4xl">
  Heading
</h1>

// ✅ CORRECT: Responsive spacing
<div className="p-4 md:p-6 lg:p-8">
  Content
</div>

// ✅ CORRECT: Show/hide elements
<div className="hidden md:block">
  {/* Only visible on tablet and desktop */}
</div>
```

### Rule 13: Dark Mode Support

**ALL components MUST work in dark mode:**

```tsx
// ✅ CORRECT: Dark mode classes
<div className="
  bg-white dark:bg-gray-900
  text-gray-900 dark:text-gray-100
  border-gray-200 dark:border-gray-700
">
  Content
</div>

// ✅ CORRECT: Dark mode for components
<Card className="bg-white dark:bg-gray-800">
  <h3 className="text-gray-900 dark:text-gray-100">Title</h3>
</Card>
```

---

## 📡 Data Fetching

### Rule 14: Use React Query Hooks

**Import from packages/hooks:**

```typescript
// ✅ CORRECT: Use hooks from packages/hooks
import { useTasks, useCreateTask } from '@ordo-todo/hooks';

export function TaskList() {
  const { data: tasks, isLoading } = useTasks();
  const createTask = useCreateTask();

  return (
    <div>
      {tasks?.map(task => <TaskCard key={task.id} task={task} />)}
    </div>
  );
}

// ❌ WRONG: Don't create local React Query hooks
// They should be in packages/hooks
```

### Rule 15: API Client Configuration

**Use centralized api-client:**

```typescript
// ✅ CORRECT: Use api-client from packages/api-client
import { apiClient } from '@ordo-todo/api-client';

const { data } = await apiClient.tasks.getAll();

// ❌ WRONG: Don't use fetch directly
const response = await fetch('/api/tasks');
```

---

## 🧪 Testing Rules

### Rule 16: Test Components with React Testing Library

```typescript
// components/tasks/__tests__/task-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '../task-card';

describe('TaskCard', () => {
  it('renders task information', () => {
    render(
      <TaskCard
        task={{ id: '1', title: 'Test Task' }}
        onTaskClick={vi.fn()}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('calls onTaskClick when clicked', () => {
    const onTaskClick = vi.fn();
    render(
      <TaskCard
        task={{ id: '1', title: 'Test Task' }}
        onTaskClick={onTaskClick}
      />
    );

    fireEvent.click(screen.getByText('Test Task'));
    expect(onTaskClick).toHaveBeenCalledWith('1');
  });
});
```

### Rule 17: E2E Tests with Playwright

```typescript
// e2e/tasks.spec.ts
import { test, expect } from '@playwright/test';

test('should create a task', async ({ page }) => {
  await page.goto('/dashboard/tasks');

  await page.click('button:has-text("New Task")');
  await page.fill('input[name="title"]', 'E2E Test Task');
  await page.click('button:has-text("Create")');

  await expect(page.locator('text=E2E Test Task')).toBeVisible();
});
```

---

## ⚡ Performance Rules

### Rule 18: Optimize Images

```tsx
// ✅ CORRECT: Use next/image
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="Logo"
  width={400}
  height={300}
  priority          // For above-fold images
  loading="lazy"    // For below-fold images
  placeholder="blur"
/>

// ❌ WRONG: Regular img tag
<img src="/logo.png" alt="Logo" />
```

### Rule 19: Code Splitting

```tsx
// ✅ CORRECT: Dynamic imports for heavy components
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <Skeleton />,
  ssr: false,  // Client-side only
});

// ✅ CORRECT: Lazy load modals
const TaskModal = dynamic(() => import('./TaskModal'));
```

### Rule 20: Web Vitals Targets

**ALL pages MUST meet:**
- **LCP** < 2.5s (Largest Contentful Paint)
- **FID** < 100ms (First Input Delay)
- **CLS** < 0.1 (Cumulative Layout Shift)

---

## ♿ Accessibility Rules

### Rule 21: WCAG AA Compliance

**ALL components MUST:**
1. Support keyboard navigation
2. Have ARIA labels
3. Meet color contrast (4.5:1)
4. Have visible focus indicators

```tsx
// ✅ CORRECT: Accessible button
<button
  type="button"
  onClick={handleClick}
  aria-label="Close dialog"
  className="focus:ring-2 focus:ring-blue-500"
>
  <XIcon />
</button>

// ✅ CORRECT: Accessible form
<label htmlFor="email">Email</label>
<input
  id="email"
  type="email"
  required
  aria-required="true"
/>
```

### Rule 22: Semantic HTML

```tsx
// ✅ CORRECT: Semantic elements
<header>
  <nav>
    <ul>
      <li><a href="/dashboard">Dashboard</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>Task Title</h1>
    <p>Task description</p>
  </article>
</main>

<footer>
  <p>&copy; 2025 Ordo-Todo</p>
</footer>

// ❌ WRONG: Div soup
<div class="header">
  <div class="nav">...</div>
</div>
<div class="main">...</div>
```

---

## 🎯 Quality Checklist

Before completing any frontend task:

```bash
# Run in order:
npm run lint           # ✅ Must pass (0 errors, 0 warnings)
npm run check-types    # ✅ Must pass (0 type errors)
npm run test           # ✅ Must pass (100% success)
npm run build          # ✅ Must succeed
npm run start          # ✅ Dev server runs without errors
```

**Additional checks:**
- [ ] Component works on mobile (320px - 640px)
- [ ] Component works on tablet (641px - 1024px)
- [ ] Component works on desktop (1025px+)
- [ ] Dark mode works correctly
- [ ] No transparencies used
- [ ] No gradients used
- [ ] Accessibility: keyboard navigation works
- [ ] Accessibility: ARIA labels present
- [ ] Accessibility: color contrast sufficient
- [ ] Performance: Lighthouse score >90
- [ ] Components from packages/ui (not local duplicates)
- [ ] Tests pass (unit + E2E)

---

## 📦 Using Shared Packages

### packages/ui (Components)
```tsx
import { Button, Card, Input, Modal } from '@ordo-todo/ui';
import { TaskCard, ProjectBoard } from '@ordo-todo/ui';
```

### packages/hooks (Data Fetching)
```tsx
import { useTasks, useCreateTask, useProjects } from '@ordo-todo/hooks';
```

### packages/stores (State Management)
```tsx
import { useUIStore, useTaskStore } from '@ordo-todo/stores';
```

### packages/i18n (Translations)
```tsx
import { useTranslations } from 'next-intl';
const t = useTranslations('TaskCard');
```

### packages/api-client (API Calls)
```tsx
import { apiClient } from '@ordo-todo/api-client';
```

---

**Built with ❤️ for Ordo-Todo Frontend**

*Follow these rules to maintain consistency, performance, and accessibility across the Next.js web app.*
