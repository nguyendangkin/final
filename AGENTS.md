# Agentic Coding Guidelines for 4Gach JDM

This document provides essential information for AI agents working on the 4Gach JDM project.

## 1. Project Overview
- **Backend**: NestJS (TypeScript) with TypeORM and PostgreSQL. It follows a modular architecture where each domain (e.g., `cars`, `users`) is encapsulated in its own module.
- **Frontend**: Next.js (TypeScript) with Tailwind CSS and Lucide-React. It uses the App Router and focuses on performance through Server Components and efficient client-side state management.
- **Architecture**: Monorepo-style with separate `backend/` and `frontend/` directories. Nginx acts as a reverse proxy for both services.
- **Target Audience**: JDM car enthusiasts and sellers in Vietnam.

## 2. Commands

### Backend (`/backend`)
- **Build**: `npm run build` - Generates the production build in the `dist/` directory.
- **Lint**: `npm run lint` - Runs ESLint with `--fix` to automatically correct common style issues.
- **Format**: `npm run format` - Runs Prettier to ensure consistent code formatting across all files.
- **Tests**:
  - All tests: `npm run test` - Executes all unit tests using Jest.
  - Single test: `npm run test -- <path_to_spec_file>` - Runs a specific test file.
  - E2E tests: `npm run test:e2e` - Executes end-to-end tests in a simulated environment.
  - Coverage: `npm run test:cov` - Generates a test coverage report.
- **Development**: `npm run start:dev` - Starts the backend in watch mode for a better development experience.

### Frontend (`/frontend`)
- **Build**: `npm run build` - Creates an optimized production build of the Next.js application.
- **Lint**: `npm run lint` - Checks for linting errors in the frontend codebase.
- **Development**: `npm run dev` - Starts the development server with Hot Module Replacement (HMR).

## 3. Code Style Guidelines

### General
- Use **TypeScript** for all new code.
- Follow **PascalCase** for classes and interfaces, **camelCase** for variables and functions, and **UPPER_SNAKE_CASE** for constants.
- Prefer **functional components** in React (Frontend).
- Use **async/await** for asynchronous operations; avoid `.then()`.

### Backend (NestJS)
- **Modules**: Keep modules cohesive. Group by feature (e.g., `cars`, `users`, `auth`). Each feature should have its own module, controller, and service.
- **Services**: All business logic must reside in Services. Avoid putting business logic in controllers or entities. Use dependency injection to share logic between services.
- **Controllers**: Keep Controllers thin; they should only handle request routing, parameter extraction, and DTO validation.
- **DTOs**: Use `class-validator` decorators in DTOs for input validation. Always use `@IsString()`, `@IsNumber()`, `@IsOptional()`, etc., to ensure type safety and security.
- **Entities**: Use TypeORM decorators. Keep entities clean of business logic. Define relationships clearly (e.g., `@ManyToOne`, `@OneToMany`).
- **Transactional Logic**: Use `DataSource.transaction` for operations involving multiple repository calls that must be atomic.
- **Naming**:
  - `feature.service.ts` -> `FeatureService`
  - `feature.controller.ts` -> `FeatureController`
  - `feature.entity.ts` -> `Feature`
  - `create-feature.dto.ts` -> `CreateFeatureDto`
- **Error Handling**: Use built-in NestJS exceptions (e.g., `NotFoundException`, `BadRequestException`, `ForbiddenException`). Custom exceptions should extend `HttpException`.
- **Logging**: Use the `Logger` from `@nestjs/common`. Initialize it with the class name: `private readonly logger = new Logger(FeatureService.name)`.
- **Imports**: Group imports for better readability:
  1. NestJS/External libraries (e.g., `@nestjs/common`, `typeorm`)
  2. Local Services/Modules
  3. Local Entities/DTOs/Interfaces

### Frontend (Next.js)
- **App Router**: Use the `app/` directory for pages and layouts. Prefer Server Components for data fetching to improve performance and SEO.
- **Components**: Place reusable components in `components/`. Organize by feature or UI type (e.g., `components/ui` for basic elements).
- **Hooks**: Use standard React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`) for client-side logic. Create custom hooks in `hooks/` if logic is reused.
- **State Management**: Use React state and context; avoid heavy state management libraries unless justified by complex global state requirements.
- **Styling**: Use **Tailwind CSS**. Avoid global CSS unless necessary. Use the `cn` utility for conditional classes.
- **Client Components**: Mark with `'use client';` only when necessary (e.g., using interactive state, browser APIs, or React hooks).
- **Icons**: Use `lucide-react`. Standard size for most icons is `w-4 h-4` or `w-5 h-5`.
- **Fetching**: Use `fetch` or `axios`. Prefer server components for initial data fetching. In client components, handle loading and error states gracefully.
- **Naming**: Components should be **PascalCase** (e.g., `CarCard.tsx`). Helpers and hooks should be **camelCase**.
- **Imports**: Use the `@/` alias for root-level imports (e.g., `@/components/...`, `@/lib/...`).

## 4. Security
- **Backend**: Always use Guards for protected routes (e.g., `JwtAuthGuard`, `AdminGuard`).
- **Validation**: Validate all inputs using DTOs and `ValidationPipe`.
- **Secrets**: Never expose API keys or secrets in the client-side code. Use environment variables.
- **Database**: Use TypeORM's query builder or repository methods to prevent SQL injection. Avoid raw queries.

## 5. Database Management
- **TypeORM**: Use migrations for schema changes in production.
- **Naming Strategy**: Table names are usually singular (e.g., `Car`, `User`).
- **Relationships**: Define relationships (`OneToMany`, `ManyToOne`, etc.) clearly in entities.

## 6. Environment Variables
- **Backend**: Configured via `@nestjs/config` and `.env` file.
- **Frontend**: Configured via `.env.local` and `NEXT_PUBLIC_` prefix for client-side access.

## 7. Common Project Patterns

### Image Handling
- Car images are stored in the `uploads/` directory on the server.
- Thumbnails are used extensively for listings to optimize performance.
- Frontend uses a helper `getImgUrl` to resolve image paths against the backend URL.
- Logic for deleting images is centralized in `CarsService.deleteCarImages` with safety checks for directory traversal.

### Notifications
- System uses a centralized `NotificationsService` for user alerts.
- Notification types include `POST_APPROVED`, `POST_REJECTED`, `POST_DELETED`, etc.
- Unread counts are fetched and displayed in the `Header` component.

### Filtering (SmartFilter)
- Advanced filtering logic (`SmartFilter`) is implemented in both backend services and frontend components.
- Smart filters dynamically update available options based on currently selected criteria to prevent "zero results" states.
- Search queries (`q`) are integrated with smart filters for unified search experience.

### API Communication
- Frontend communicates with the backend via the `NEXT_PUBLIC_API_URL` environment variable.
- Authentication tokens (JWT) are stored in `localStorage` as `jwt_token`.
- Axios or Fetch is used for requests; server components are preferred for initial data fetching.

## 8. Development Workflow
- **Monorepo Management**: Run backend and frontend independently during development.
- **Database**: Ensure PostgreSQL is running (via Docker) before starting the backend.
- **Assets**: Use the `uploads/` directory for car images; ensure it has proper write permissions.

## 9. Deployment
- The project uses Docker. Refer to `docker-compose.yml` for service definitions.
- Nginx is used as a reverse proxy to handle SSL and routing between frontend and backend.
- Database migrations should be run as part of the deployment pipeline.

---
*Generated for AI agents to ensure consistency and quality across the codebase.*
