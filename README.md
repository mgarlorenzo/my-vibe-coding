# My Vibe Coding

Proyectos desarrollados con vibe coding (AI-assisted development).

## Proyectos

### [datagrid](./datagrid)

Employee Manager - Aplicación full-stack de gestión de empleados con React + Spring Boot + GraphQL.

**Features:**
- CRUD de empleados con soft-delete
- GraphQL con subscriptions para updates en tiempo real
- Data Grid custom con virtualización, inline editing, sorting, filtering y grouping
- Clean Architecture (DDD-light)

**Tech Stack:**
- Frontend: React 18, TypeScript, Apollo Client, MUI, Vite
- Backend: Java 17, Spring Boot 3.2, Spring WebFlux, R2DBC, H2
- Testing: Vitest, Playwright, JUnit 5

## Prompts

La carpeta [`/prompts`](./prompts) contiene los prompts utilizados durante el desarrollo.

## Requisitos

- Node.js 18+
- Java 17+

## Quick Start

```bash
# Backend
cd datagrid/backend
./mvnw spring-boot:run

# Frontend (en otra terminal)
cd datagrid/frontend
npm install
npm run dev
```

## License

MIT
