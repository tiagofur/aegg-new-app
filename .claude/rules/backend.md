# Backend Rules (NestJS)

**Specific rules for `apps/backend` (NestJS REST API)**

## 📋 Table of Contents

1. [Project Structure](#project-structure)
2. [Controller Rules](#controller-rules)
3. [Service Rules](#service-rules)
4. [Repository Rules](#repository-rules)
5. [Validation Rules](#validation-rules)
6. [Error Handling](#error-handling)
7. [Authentication & Authorization](#authentication--authorization)
8. [Testing Rules](#testing-rules)
9. [API Documentation](#api-documentation)

---

## 🏗️ Project Structure

```
apps/backend/src/
├── [domain]/              # Feature-based organization
│   ├── controllers/
│   │   └── [domain].controller.ts
│   ├── services/
│   │   └── [domain].service.ts
│   ├── dto/
│   │   ├── create-[domain].dto.ts
│   │   ├── update-[domain].dto.ts
│   │   └── query-[domain].dto.ts
│   └── [domain].module.ts
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── providers/
├── config/
├── main.ts
└── app.module.ts
```

### Rule 1: Feature-Based Organization

**Organize by domain, NOT by layer:**

```typescript
// ✅ CORRECT: Feature-based
apps/backend/src/
├── tasks/
│   ├── controllers/
│   ├── services/
│   ├── dto/
│   └── tasks.module.ts
├── projects/
│   ├── controllers/
│   ├── services/
│   ├── dto/
│   └── projects.module.ts

// ❌ WRONG: Layer-based
apps/backend/src/
├── controllers/
│   ├── tasks.controller.ts
│   └── projects.controller.ts
├── services/
│   ├── tasks.service.ts
│   └── projects.service.ts
```

---

## 🎮 Controller Rules

### Rule 2: Controller Responsibilities

Controllers MUST:
- Handle HTTP concerns only
- Delegate business logic to services
- Use DTOs for input validation
- Return typed responses

```typescript
// ✅ CORRECT
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiTags('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, type: Task })
  create(
    @CurrentUser() user: RequestUser,
    @Body() dto: CreateTaskDto,
  ): Promise<Task> {
    return this.tasksService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  @ApiResponse({ status: 200, type: [Task] })
  findAll(
    @CurrentUser() user: RequestUser,
    @Query() query: QueryTasksDto,
  ): Promise<PaginatedResult<Task>> {
    return this.tasksService.findAll(user.id, query);
  }
}

// ❌ WRONG: Business logic in controller
@Controller('tasks')
export class TasksController {
  @Post()
  async create(@Body() dto: CreateTaskDto) {
    // Business logic should be in service!
    const task = new Task();
    task.title = dto.title;
    await this.repository.save(task);
    return task;
  }
}
```

### Rule 3: Route Naming

**Use RESTful conventions:**

```typescript
// ✅ CORRECT: RESTful
@Get()           // GET /tasks
@Get(':id')      // GET /tasks/:id
@Post()          // POST /tasks
@Patch(':id')    // PATCH /tasks/:id
@Delete(':id')   // DELETE /tasks/:id

// ✅ CORRECT: Nested routes
@Get(':taskId/comments')           // GET /tasks/:taskId/comments
@Post(':taskId/comments')          // POST /tasks/:taskId/comments

// ❌ WRONG: Non-RESTful
@Get('get-all-tasks')
@Get('get-task-by-id/:id')
@Post('create-task')
```

### Rule 4: Public vs Protected Endpoints

**Mark public endpoints explicitly:**

```typescript
@Controller('auth')
export class AuthController {
  @Public()  // ✅ No auth required
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')  // ✅ Auth required (default)
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: RequestUser) {
    return this.authService.logout(user.id);
  }
}
```

---

## 🔧 Service Rules

### Rule 5: Service Responsibilities

Services MUST:
- Contain business logic
- Be reusable (no HTTP concerns)
- Use domain entities from `@ordo-todo/core`
- Throw domain-specific exceptions

```typescript
// ✅ CORRECT
@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    private readonly taskRepo: TaskRepository,
  ) {}

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    // Use domain entity for validation
    const task = new Task({
      title: dto.title,
      status: dto.status || 'TODO',
      userId,
    });

    // Save via repository
    return await this.taskRepo.save(task);
  }

  async findAll(
    userId: string,
    query: QueryTasksDto,
  ): Promise<PaginatedResult<Task>> {
    return await this.taskRepo.findAll(userId, query);
  }
}

// ❌ WRONG: HTTP concerns in service
@Injectable()
export class TasksService {
  async create(@Res() res: Response) {  // ❌ Response in service!
    const task = await this.prisma.task.create({...});
    return res.status(201).json(task);  // ❌ HTTP logic in service!
  }
}
```

### Rule 6: Use Domain Entities

**Import and use entities from `@ordo-todo/core`:**

```typescript
// ✅ CORRECT
import { Task, TaskStatus } from '@ordo-todo/core';

@Injectable()
export class TasksService {
  async create(dto: CreateTaskDto, userId: string) {
    const task = new Task({  // Domain entity from core
      title: dto.title,
      status: dto.status || TaskStatus.TODO,
      userId,
    });

    return this.prisma.task.create({ data: task });
  }
}

// ❌ WRONG: No domain entity
@Injectable()
export class TasksService {
  async create(dto: CreateTaskDto, userId: string) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        // No validation, no domain logic
      },
    });
  }
}
```

---

## 📦 Repository Rules

### Rule 7: Repository Pattern

**Use PrismaService for data access:**

```typescript
// ✅ CORRECT: Repository for data access
@Injectable()
export class TaskRepository {
  constructor(private prisma: PrismaService) {}

  async save(task: Task): Promise<Task> {
    return this.prisma.task.create({
      data: {
        title: task.title,
        status: task.status,
        userId: task.userId,
      },
    });
  }

  async findById(id: string): Promise<Task | null> {
    return this.prisma.task.findUnique({ where: { id } });
  }

  async findAll(
    userId: string,
    query: QueryTasksDto,
  ): Promise<PaginatedResult<Task>> {
    const [data, total] = await Promise.all([
      this.prisma.task.findMany({
        where: { userId },
        skip: query.page * query.limit,
        take: query.limit,
      }),
      this.prisma.task.count({ where: { userId } }),
    ]);

    return { data, total, page: query.page, limit: query.limit };
  }
}
```

### Rule 8: Database Schema Location

**Schema is in `packages/db`, NOT in backend:**

```typescript
// ✅ CORRECT: Import from packages/db
import { PrismaService } from '@ordo-todo/db';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}
}

// ❌ WRONG: Don't create local PrismaService in backend
```

---

## ✅ Validation Rules

### Rule 9: DTOs with class-validator

**All DTOs MUST use class-validator:**

```typescript
// ✅ CORRECT: Comprehensive validation
export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;
}

// ✅ CORRECT: Update DTO extends create
export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

// ✅ CORRECT: Query DTO with pagination
export class QueryTasksDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;
}
```

### Rule 10: Global Validation Pipe

**Enable in main.ts:**

```typescript
// main.ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,              // Strip non-whitelisted properties
    forbidNonWhitelisted: true,    // Throw error if non-whitelisted
    transform: true,               // Transform types automatically
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

---

## ⚠️ Error Handling

### Rule 11: Use NestJS Built-in Exceptions

```typescript
// ✅ CORRECT: Use built-in exceptions
import {
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

throw new BadRequestException('Title is required');
throw new UnauthorizedException('Invalid credentials');
throw new NotFoundException('Task not found');
throw new ForbiddenException('You do not own this task');
throw new ConflictException('Email already exists');

// ❌ WRONG: Generic errors
throw new Error('Something went wrong');
```

### Rule 12: Exception Filters

**Create custom exception filters for consistent error responses:**

```typescript
// common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const error = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: ctx.getRequest().url,
      message:
        typeof exceptionResponse === 'string'
          ? exceptionResponse
          : (exceptionResponse as any).message,
    };

    response.status(status).json(error);
  }
}

// Use globally in main.ts
app.useGlobalFilters(new HttpExceptionFilter());
```

---

## 🔐 Authentication & Authorization

### Rule 13: JWT Authentication

**Use JWT with passport-jwt:**

```typescript
// ✅ CORRECT: Protected endpoint
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  @Get()
  findAll(@CurrentUser() user: RequestUser) {
    // user.id, user.email available
    return this.tasksService.findAll(user.id);
  }
}

// ✅ CORRECT: Public endpoint
@Controller('auth')
export class AuthController {
  @Public()
  @Post('login')
  login() {
    return this.authService.login();
  }
}
```

### Rule 14: Authorization Checks

**Always verify user owns the resource:**

```typescript
// ✅ CORRECT: Check ownership
@Injectable()
export class TasksService {
  async update(
    id: string,
    dto: UpdateTaskDto,
    userId: string,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.userId !== userId) {
      throw new ForbiddenException('You do not own this task');
    }

    return this.prisma.task.update({
      where: { id },
      data: dto,
    });
  }
}

// ❌ WRONG: No ownership check
async update(id: string, dto: UpdateTaskDto, userId: string) {
  // Anyone can update any task!
  return this.prisma.task.update({ where: { id }, data: dto });
}
```

---

## 🧪 Testing Rules

### Rule 15: Test All Controllers & Services

**Every controller and service MUST have tests:**

```typescript
// tasks.controller.spec.ts
describe('TasksController', () => {
  let controller: TasksController;
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TasksController>(TasksController);
    service = module.get<TasksService>(TasksService);
  });

  describe('create', () => {
    it('should create a task', async () => {
      const dto: CreateTaskDto = { title: 'Test Task' };
      const result = { id: '1', ...dto };

      jest.spyOn(service, 'create').mockResolvedValue(result);

      expect(await controller.create({ id: 'user-1' } as any, dto)).toEqual(result);
      expect(service.create).toHaveBeenCalledWith(dto, 'user-1');
    });
  });
});
```

### Rule 16: Integration Tests with E2E

**Test API endpoints end-to-end:**

```typescript
// tasks.e2e-spec.ts
describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    authToken = await setupTestUser(prisma);
  });

  afterEach(async () => {
    await prisma.task.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  describe('POST /tasks', () => {
    it('should create a task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Test Task' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe('Test Task');
        });
    });
  });
});
```

---

## 📚 API Documentation

### Rule 17: Swagger Documentation

**All endpoints MUST have Swagger docs:**

```typescript
// main.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Ordo API')
  .setDescription('Task management API')
  .setVersion('1.0')
  .addBearerAuth()
  .addTag('tasks')
  .addTag('projects')
  .addTag('workspaces')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api-docs', app, document);
```

```typescript
// ✅ CORRECT: Documented endpoint
@Controller('tasks')
@ApiTags('tasks')
export class TasksController {
  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task created', type: Task })
  @ApiResponse({ status: 400, description: 'Validation error' })
  create(@Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto);
  }
}
```

### Rule 18: Type Definitions

**Use TypeScript interfaces for API responses:**

```typescript
// common/interfaces/paginated-result.interface.ts
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Use in controllers
@Get()
findAll(): Promise<PaginatedResult<Task>> {
  return this.tasksService.findAll();
}
```

---

## 🎯 Quality Checklist

Before completing any backend task:

```bash
# Run in order:
npm run lint           # ✅ Must pass (0 errors, 0 warnings)
npm run check-types    # ✅ Must pass (0 type errors)
npm run test           # ✅ Must pass (100% success)
npm run test:e2e       # ✅ Must pass (all E2E tests)
npm run build          # ✅ Must succeed
```

**Additional checks:**
- [ ] All endpoints have Swagger documentation
- [ ] All DTOs use class-validator
- [ ] All protected endpoints use @UseGuards(JwtAuthGuard)
- [ ] All mutations check ownership/authorization
- [ ] Error handling uses NestJS exceptions
- [ ] Database operations use PrismaService
- [ ] Business logic uses domain entities from @ordo-todo/core

---

**Built with ❤️ for Ordo-Todo Backend**

*Follow these rules to maintain consistency and quality across the NestJS backend.*
