# AICN Development Guidelines

## Build & Development Commands
- **Start development**: `pnpm dev` (runs all packages in parallel)
- **Run backend only**: `cd packages/backend && clojure -M:run-m`
- **Build all packages**: `pnpm build`
- **Run tests**: `pnpm test`
- **Run backend tests**: `cd packages/backend && clojure -T:build test`
- **Build backend uberjar**: `cd packages/backend && clojure -T:build ci`
- **Start/restart REPL**: `(go)`, `(reset)`, `(halt)` in backend REPL

## Code Style Guidelines
- **Clojure**: Use kebab-case for functions/vars, follow namespace hierarchy
- **TypeScript/React**: Use camelCase for variables/functions, PascalCase for components/classes
- **Imports**: Sort imports alphabetically, group by type (core libs first)
- **Error handling**: Use descriptive error messages, proper exception handling
- **Documentation**: Document public functions with docstrings
- **Types**: Use strong typing in TypeScript, Malli schemas in Clojure
- **Component structure**: Follow Integrant component pattern in backend

## Database
- Local PostgreSQL via Docker: `docker-compose up -d`
- Database name: `aicn_db`, user: `postgres`, password: `postgres`

## Database Migrations
- Run migrations: `cd packages/backend && clojure -M:migrate`
- Rollback last migration: `cd packages/backend && clojure -M:rollback`
- Create new migration: `cd packages/backend && clojure -M:cli create my-migration-name`
- Migration files are stored in `packages/backend/resources/migrations/`