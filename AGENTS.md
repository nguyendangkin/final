# Agent Guidelines: SukaSuka Project

This repository contains a NestJS backend and a Next.js frontend for a car marketplace.

## 🛠 Commands

### Backend (NestJS)
- **Install**: `npm install` (in `backend/`)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Format**: `npm run format`
- **Test (All)**: `npm test`
- **Test (Single)**: `npx jest path/to/file.spec.ts`
- **Test (Watch)**: `npm run test:watch`
- **Dev**: `npm run start:dev`

### Frontend (Next.js)
- **Install**: `npm install` (in `frontend/`)
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Dev**: `npm run dev`

---

## 🎨 Code Style & Guidelines

### 1. General Principles
- Use **TypeScript** for everything.
- Prefer **functional programming** patterns over complex class hierarchies (except where NestJS requires classes).
- Maintain a clean separation between business logic (Services) and transport logic (Controllers).
- **Formatting**: Use single quotes (`'`), trailing commas (`all`), and 2-space indentation (standard Prettier config).

### 2. Naming Conventions
- **Files**: `kebab-case.ts` or `kebab-case.tsx` (e.g., `car-feed.tsx`, `cars.service.ts`).
- **Classes/Interfaces/Types**: `PascalCase` (e.g., `CarsService`, `CreateCarDto`).
- **Variables/Functions**: `camelCase` (e.g., `const carData = ...`).
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `const MAX_UPLOAD_SIZE = ...`).
- **Entities/Tables**: Singular `PascalCase` (e.g., `Car`, `User`).

### 3. Imports
- **Backend**: Use relative imports (`../`, `./`). Avoid deep nesting if possible.
- **Frontend**: Use the `@/` alias to refer to the root of the `frontend/` directory (e.g., `import { Button } from '@/components/ui/button'`).
- Always group imports: built-ins first, then third-party libraries, then internal modules.

### 4. Types & Interfaces
- Define clear interfaces for all data structures.
- Avoid `any` where possible, though the project current config allows it (`@typescript-eslint/no-explicit-any: off`).
- Use DTOs (Data Transfer Objects) for all API payloads in the backend with `class-validator` decorators.

### 5. Backend (NestJS)
- **Validation**: Every DTO should use `class-validator` decorators. `main.ts` enforces `whitelist: true`.
- **Database**: Use TypeORM with Repository pattern. Complex queries should use the Query Builder.
- **Logging**: Use the built-in `Logger` from `@nestjs/common`.
- **Error Handling**: Throw standard NestJS exceptions (`NotFoundException`, `BadRequestException`, `ForbiddenException`).

### 6. Frontend (Next.js)
- **Components**: Use Server Components by default. Use `'use client'` only when necessary (state, effects, event listeners).
- **Data Fetching**: Use standard `fetch`. Prefer server-side fetching in `page.tsx` and passing data to client components.
- **Styling**: Use **Tailwind CSS**. Follow existing patterns for spacing and colors.
- **Icons**: Use `lucide-react`.
- **State**: Use React hooks (`useState`, `useReducer`, `useContext`) for local/global state.

### 7. Authentication & Authorization
- **Backend**: Uses JWT with Passport.js. `JwtStrategy` handles validation. `AdminGuard` protects admin routes.
- **Frontend**: Stores JWT in `localStorage` as `jwt_token`. Use `TokenHandler` component to manage tokens.
- **OAuth**: Google OAuth 2.0 is used for authentication.

---

## 📂 Project Structure

- `backend/src/`: NestJS source code.
    - `module/`: Feature-based modules (e.g., `cars/`, `auth/`, `payment/`).
    - `entities/`: Database models.
    - `dto/`: Data Transfer Objects.
- `frontend/app/`: Next.js App Router pages.
- `frontend/components/`: Reusable React components.
- `frontend/services/`: API client services.
- `nginx/`: Nginx configuration for proxying.
- `docker-compose.yml`: Production/Staging orchestration.

---

## 🔒 Security & Integrations
- Never commit `.env` files.
- **Payment**: Uses **PayOS** for transaction processing.
- **Validation**: Use `ValidationPipe` in NestJS to sanitize inputs.
- **Headers**: Use `helmet` for security headers in the backend.
- **CORS**: Strictly configured in `main.ts` for local and production origins.

---

## 🧪 Testing
- **Unit Tests**: Place `.spec.ts` files next to the source file.
- **E2E Tests**: Found in `backend/test/`.
- Mock external dependencies (like PayOS or database) in unit tests.
- Run a single test file using: `npx jest path/to/file.spec.ts`
