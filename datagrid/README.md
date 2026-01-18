# Employee Manager

A full-stack employee management application with React frontend and Spring Boot backend using GraphQL.

## Features

- **CRUD Operations**: Create, Read, Update, and soft-delete (terminate) employees
- **Real-time Updates**: GraphQL subscriptions for live data updates
- **Advanced Data Grid**: MUI X Data Grid with sorting, filtering, pagination, and column management
- **Reactive Backend**: Spring WebFlux with R2DBC for non-blocking database access
- **Clean Architecture**: DDD-light approach with clear separation of concerns

## Tech Stack

### Frontend
- React 18 + TypeScript
- Apollo Client (GraphQL)
- MUI X Data Grid
- MUI CssBaseline + ThemeProvider (global styles and theming)
- Vite

### Backend
- Java 17 + Spring Boot 3.2
- Spring for GraphQL
- Spring WebFlux (Reactive)
- R2DBC + H2 (in-memory database)
- Lombok

### Testing
- Backend: JUnit 5 + Spring Boot Test
- Frontend: Vitest + React Testing Library
- E2E: Playwright

## Requirements

- Java 17+
- Node.js 18+
- npm 9+

## Quick Start

### 1. Start the Backend

```bash
cd backend
./mvnw spring-boot:run
```

The backend will start at `http://localhost:8080`

- GraphQL endpoint: `http://localhost:8080/graphql`
- GraphiQL playground: `http://localhost:8080/graphiql`

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

## Running Tests

### Backend Tests

```bash
cd backend
./mvnw test
```

### Frontend Tests

```bash
cd frontend
npm install
npm test
```

### E2E Tests

```bash
cd e2e
npm install
npx playwright install chromium
npx playwright test
```

### Run All Tests

```bash
./run-tests.sh
```

## API Examples

### GraphQL Queries

#### List Employees

```graphql
query {
  employees(
    filter: { includeTerminated: true }
    paging: { offset: 0, limit: 10 }
    sorting: { field: "last_name", direction: "ASC" }
  ) {
    items {
      id
      company_id
      first_name
      last_name
      email
      start_date
      termination_date
      updated_at
    }
    totalCount
    hasNextPage
  }
}
```

#### Get Single Employee

```graphql
query {
  employee(id: "1") {
    id
    company_id
    first_name
    last_name
    email
    country
    phone_number
    city
    start_date
    termination_date
    updated_at
  }
}
```

### GraphQL Mutations

#### Create Employee

```graphql
mutation {
  createEmployee(input: {
    company_id: 1
    first_name: "John"
    last_name: "Doe"
    email: "john.doe@example.com"
    country: "Spain"
    phone_number: "+34 600 000 000"
    city: "Madrid"
  }) {
    id
    first_name
    last_name
    email
    updated_at
  }
}
```

#### Update Employee

```graphql
mutation {
  updateEmployee(id: "1", input: {
    last_name: "Smith"
    email: "john.smith@example.com"
  }) {
    id
    first_name
    last_name
    email
    updated_at
  }
}
```

#### Terminate Employee

```graphql
mutation {
  terminateEmployee(id: "1", input: {
    termination_reason: "Voluntary resignation"
    termination_reason_type: "VOLUNTARY"
    termination_observations: "Left for new opportunity"
  }) {
    id
    first_name
    last_name
    termination_date
    termination_reason
    termination_reason_type
  }
}
```

#### Unterminate Employee

```graphql
mutation {
  unterminateEmployee(id: "1") {
    id
    first_name
    last_name
    termination_date
    untermination_date
  }
}
```

### GraphQL Subscription

```graphql
subscription {
  employeeChanged {
    eventType
    employee {
      id
      first_name
      last_name
      email
      termination_date
    }
    timestamp
  }
}
```

## Project Structure

```
employee-manager/
├── backend/
│   ├── src/main/java/com/example/employeemanager/
│   │   ├── domain/           # Domain entities
│   │   ├── application/      # Business logic services
│   │   ├── infrastructure/   # Repository, config
│   │   └── api/graphql/      # GraphQL resolvers
│   ├── src/main/resources/
│   │   ├── graphql/          # GraphQL schema
│   │   ├── schema.sql        # Database schema
│   │   └── data.sql          # Seed data
│   └── src/test/             # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── graphql/          # GraphQL queries/mutations
│   │   ├── hooks/            # Custom hooks
│   │   └── types/            # TypeScript types
│   └── src/__tests__/        # Frontend tests
├── e2e/
│   └── tests/                # Playwright E2E tests
├── run-tests.sh              # Full test suite script
└── README.md
```

## Useful Commands

### Development

```bash
# Start backend (port 8081)
cd backend && ./mvnw spring-boot:run

# Start frontend (port 5173/5174)
cd frontend && npm run dev

# Start Storybook (port 6006)
cd frontend && npm run storybook
```

### Testing

```bash
# Run backend tests
cd backend && ./mvnw test

# Run frontend unit tests (68 tests)
cd frontend && npm test

# Run frontend tests in watch mode
cd frontend && npm run test:watch

# Run E2E tests (44 tests)
cd e2e && npx playwright test

# Run E2E tests with UI
cd e2e && npx playwright test --headed

# Run all tests
./run-tests.sh
```

### Building

```bash
# Build frontend for production
cd frontend && npm run build

# Build Storybook static site
cd frontend && npm run build-storybook

# Build backend JAR
cd backend && ./mvnw package
```

### Linting & Formatting

```bash
# Lint frontend code
cd frontend && npm run lint
```

## FactorialDataGrid Component

A custom data grid built from scratch with the following features:

- **Virtualized rendering** - Handles large datasets efficiently
- **Inline cell editing** - Double-click to edit, Enter to save, Escape to cancel
- **Sorting** - Click column headers to sort
- **Filtering** - Quick filter and column filters
- **Grouping** - Drag & drop grouping with aggregations (sum, avg, count, min, max)
- **Selection** - Checkbox row selection
- **Keyboard navigation** - Arrow keys, Enter, F2, Escape
- **Real-time updates** - GraphQL subscription integration
- **Customizable** - Custom cell renderers and editors

### Storybook Stories

Run `npm run storybook` in the frontend directory to see interactive examples:

| Story | Description |
|-------|-------------|
| Basic | Minimal configuration |
| FullFeatured | All options enabled |
| InlineEditing | Edit cells with callbacks |
| GroupBySingleField | Grouping by department |
| GroupByMultipleFields | Nested grouping |
| SubscriptionUpdates | Real-time updates simulation |
| ServerMode | Server-side pagination |
| DensityOptions | Compact/Standard/Comfortable |
| CustomRenderers | Custom cell rendering |
| EmptyState | Empty grid |
| LoadingState | Loading spinner |
| LargeDataset | 1,000 rows virtualized |

## Configuration

### Backend (application.yml)

- Server port: 8081
- H2 in-memory database
- CORS enabled for localhost:5173, localhost:5174, and localhost:3000
- GraphiQL enabled at /graphiql

### Frontend (vite.config.ts)

- Dev server port: 5173
- Proxy to backend for GraphQL

## Seed Data

The application comes with pre-loaded sample employees from Spain and UK for testing purposes.

## License

MIT
