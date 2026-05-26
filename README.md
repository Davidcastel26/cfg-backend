# CFG Tickets API

> Purchase‑ticket management backend — **Prueba técnica CFG**.
> Node.js · Express · TypeScript · PostgreSQL · Sequelize · Docker · OpenAPI 3.0

A REST API that ingests purchase tickets from an Excel export, stores them in a
normalized (3NF) PostgreSQL schema, and exposes full CRUD plus a **weekly
payment summary** aggregation. Built with a pragmatic, functional
**Service‑Repository (MVC)** architecture.

![Node](https://img.shields.io/badge/node-%E2%89%A520-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![OpenAPI](https://img.shields.io/badge/OpenAPI-3.0-6BA539?logo=openapiinitiative&logoColor=white)

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Importing the dataset](#importing-the-dataset)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Key design decisions](#key-design-decisions)
- [Testing & quality](#testing--quality)
- [npm scripts](#npm-scripts)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- **Full ticket CRUD** with line items (header/line split), pagination and filtering.
- **Catalog endpoints** for suppliers, lands and products.
- **Idempotent Excel import** — re‑running the same file converges to the same state.
- **Weekly payment summary** (bonus) — tickets aggregated by supplier for an ISO week.
- **Monetary safety** — `DECIMAL(14,4)` columns with exact, float‑noise‑free arithmetic.
- **OpenAPI 3.0 docs** served via Swagger UI.
- **Dockerized** — one command brings up the database + API with migrations applied.

## Tech stack

| Concern | Choice |
|---|---|
| Runtime | Node.js ≥ 20 |
| Language | TypeScript (CommonJS, `node16` resolution) |
| HTTP | Express 5 |
| ORM / DB | Sequelize 6 · PostgreSQL 16 |
| Validation | Zod |
| Dates | date-fns (ISO‑week resolution) |
| Excel | `xlsx` |
| Logging | pino / pino-http |
| Docs | swagger-jsdoc + swagger-ui-express |
| Tests | Jest + ts-jest |
| Dev runner | tsx |

## Architecture

A flat, functional **Service‑Repository (MVC)** layout. The request flow is
strictly one‑directional:

```
HTTP → routes → controllers → services → repositories → models (Sequelize) → PostgreSQL
                    │             │            │
              extract input   business     query logic
              format JSON      logic +     (data access)
                               transactions
```

- **routes** — Express routers; map endpoints, attach Zod validation, carry OpenAPI annotations.
- **controllers** — thin: read validated input, call a service, send JSON. No business logic.
- **services** — business logic, transactions, the functional Excel import, and the weekly aggregation.
- **repositories** — direct Sequelize data access (queries only); transaction‑aware.
- **models** — the 5 Sequelize models, associations, hooks, and the DB config.
- **validators** — Zod request schemas. **utils** — money/date/error/serialization helpers.

## Prerequisites

- **Docker** + **Docker Compose** (recommended path), **or**
- **Node.js ≥ 20** and a reachable **PostgreSQL 16** instance (local path).

## Quick start (Docker)

This is the fastest way to get a running API with the schema migrated.

```bash
# 1. From the cfg-backend/ directory, create your env file
cp .env.example .env

# 2. Build and start the database + API (migrations run automatically on boot)
docker compose up -d --build

# 3. Load the dataset (see "Importing the dataset" for the file path)
curl --data-binary @../tickets-prueba.xlsx \
     -H 'Content-Type: application/octet-stream' \
     http://localhost:3000/api/v1/import/excel

# 4. Explore — open Swagger UI in your browser, then try the bonus endpoint
#    http://localhost:3000/api-docs
curl "http://localhost:3000/api/v1/payments/weekly?isoYear=2023&isoWeek=5"
```

Stop everything with `docker compose down` (add `-v` to also wipe the database volume).

> The API container waits for PostgreSQL to be healthy, runs `db:migrate`, and
> (when `RUN_SEED=true`) runs the demo seeders before starting.

## Local development

```bash
# 1. Configure env to point at your local PostgreSQL
cp .env.example .env          # then edit DB_* as needed

# 2. Install dependencies (if not already installed)
npm install

# 3. Apply migrations
npm run db:migrate

# 4. (optional) Load demo fixtures, or import the full dataset
npm run seed                          # small demo catalog + sample tickets
npm run import:excel -- ../tickets-prueba.xlsx   # full dataset

# 5. Run with hot reload
npm run dev                           # tsx watch → http://localhost:3000
```

Production build:

```bash
npm run build      # compiles TypeScript to dist/
npm start          # node dist/server.js
```

## Environment variables

Copy `.env.example` to `.env` and adjust. All values have sane defaults except the DB credentials.

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` \| `test` \| `production` |
| `PORT` | `3000` | Port the API listens on |
| `DB_HOST` | `localhost` | PostgreSQL host (`db` inside Docker) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `secret_password` | Database password |
| `DB_NAME` | `cfg_tickets_db` | Database name |
| `RUN_SEED` | `false` | When `true`, the Docker entrypoint runs seeders on boot |
| `API_PORT` | `3000` | Host port mapped to the API container |
| `LOG_LEVEL` | `info` | pino log level |

## Importing the dataset

The source file `tickets-prueba.xlsx` lives in the repository root (one level
above `cfg-backend/`). Ingestion is **idempotent** — suppliers/lands/products
are found‑or‑created and tickets are upserted by code.

Two equivalent entry points, both backed by the same service:

```bash
# A) CLI / seed path — reads the file directly
npm run import:excel -- ../tickets-prueba.xlsx

# B) HTTP path — send the raw .xlsx bytes as the request body
curl --data-binary @../tickets-prueba.xlsx \
     -H 'Content-Type: application/octet-stream' \
     http://localhost:3000/api/v1/import/excel
```

A successful import returns a summary:

```json
{ "sheetName": "export_202603201609", "totalRows": 751,
  "created": 367, "updated": 0, "skipped": 0, "errors": [] }
```

> **Note:** the upload accepts the raw file body (`application/octet-stream`),
> not `multipart/form-data`, since no multipart parser is bundled.

## API reference

Base path: **`/api/v1`**. Interactive docs at **`/api-docs`**; raw spec at **`/api-docs.json`**.
Errors use the envelope `{ "error": { "code", "message", "details?" } }`.

### Tickets
| Method | Path | Description |
|---|---|---|
| `GET` | `/tickets` | List (query: `page`, `pageSize`, `supplierId`, `productId`, `landId`, `dateFrom`, `dateTo`, `code`, `sortBy`, `sortOrder`) |
| `POST` | `/tickets` | Create a ticket with items |
| `GET` | `/tickets/:id` | Get one ticket with all items |
| `PUT` | `/tickets/:id` | Replace header + items |
| `PATCH` | `/tickets/:id` | Partial header update |
| `DELETE` | `/tickets/:id` | Delete (cascades items) |
| `POST` | `/tickets/:id/items` | Append a line item |
| `DELETE` | `/tickets/:id/items/:itemId` | Remove one line item |

### Catalog
| Method | Path | Description |
|---|---|---|
| `GET` · `POST` | `/suppliers` | List / create |
| `GET` · `PUT` · `DELETE` | `/suppliers/:id` | Detail / update / delete (delete guarded if referenced) |
| `GET` | `/lands`, `/lands/:id` | List / detail |
| `GET` | `/products`, `/products/:id` | List / detail |

### Import & Payments (bonus)
| Method | Path | Description |
|---|---|---|
| `POST` | `/import/excel` | Idempotent Excel ingestion |
| `GET` | `/payments/weekly?isoYear=&isoWeek=` | Weekly summary aggregated by supplier |
| `GET` | `/payments/weekly/:isoYear/:isoWeek/suppliers/:supplierId` | Single‑supplier drill‑down |
| `GET` | `/payments/weeks?from=YYYY-WW&to=YYYY-WW` | Weeks that contain tickets |
| `GET` | `/health` | Liveness + DB readiness probe |

> The bundled dataset spans **ISO weeks 1–9 of 2023**. Example:
> `GET /api/v1/payments/weekly?isoYear=2023&isoWeek=5`.

## Data model

Five tables, third normal form. `land` belongs to the **line item**, not the
ticket header. `iso_year`/`iso_week` are denormalized onto `tickets` (set by a
model hook) so the weekly query is an indexed seek.

```
suppliers ──1:N── tickets ──1:N── ticket_items ──N:1── products
                                         └──────────N:1── lands
```

| Table | Notable columns |
|---|---|
| `suppliers` / `lands` / `products` | `code` (VARCHAR UNIQUE), `name` |
| `tickets` | `code` (VARCHAR(32) UNIQUE), `date`, `supplier_id` FK, `iso_year`, `iso_week` |
| `ticket_items` | `ticket_id` FK (CASCADE), `product_id`/`land_id` FK (RESTRICT), `total_qty`, `price` `DECIMAL(14,4)`, `total` `DECIMAL(14,4)`, `total_calculated` |

## Key design decisions

- **`ticket.code` is `VARCHAR(32)`, not `BIGINT`** — the dataset contains an
  alphanumeric code (`GPE01`), so an integer column would reject real rows.
- **Excel dates are serial integers** (e.g. `44933`) — converted deterministically
  in UTC to `YYYY-MM-DD` (no timezone shift).
- **Monetary safety** — values are handled as scaled integers (× 10⁴) in
  `src/utils/decimal.ts`; parsing rounds away IEEE‑754 noise and `total` is always
  recomputed as `qty × price` on write (DB hook + service), never trusted from input.
- **Idempotency** — catalog rows via `findOrCreate`, tickets via upsert‑by‑code;
  line items (which have no natural key) are replaced wholesale per ticket.

## Testing & quality

```bash
npm test            # Jest unit tests (pure utils: money + ISO week)
npm run typecheck   # tsc --noEmit
npm run lint        # ESLint (see note below)
npm run test:openapi # generate the OpenAPI doc and lint it with redocly
```

> `npm run lint` requires the dev dependency `typescript-eslint`
> (`npm i -D typescript-eslint`). Until installed it no‑ops with a warning
> rather than failing.

## npm scripts

| Script | Purpose |
|---|---|
| `build` | Compile TypeScript → `dist/` |
| `start` | Run the compiled server (`dist/server.js`) |
| `dev` | Run with hot reload (`tsx watch`) |
| `typecheck` | Type‑check without emitting |
| `lint` | ESLint |
| `test` / `test:watch` | Jest |
| `db:migrate` / `db:migrate:undo` / `db:migrate:undo:all` | Migrations |
| `db:seed` / `seed` / `db:seed:undo` | Seeders |
| `import:excel -- <path>` | Import an `.xlsx` via the CLI |
| `openapi:generate` | Write `openapi.json` |
| `test:openapi` | Generate + lint the OpenAPI document |

## Project structure

```
cfg-backend/
├── src/
│   ├── server.ts            # entry: connect DB, start HTTP, handle signals
│   ├── app.ts               # Express app factory (middleware, routes, Swagger)
│   ├── importExcel.ts       # CLI import entry
│   ├── openapiGen.ts        # writes openapi.json
│   ├── env.ts               # typed env (zod)
│   ├── models/              # Sequelize models, associations, hooks, config
│   │   ├── index.ts
│   │   ├── config.ts
│   │   ├── migrations/      # sequelize-cli migrations (timestamped)
│   │   └── seeders/         # demo fixtures
│   ├── repositories/        # data-access functions
│   ├── services/            # business logic, transactions, Excel import, aggregation
│   ├── controllers/         # HTTP handlers
│   ├── routes/              # Express routers + OpenAPI annotations
│   ├── validators/          # Zod schemas
│   └── utils/               # decimal, isoWeek, errors, http, logger, swagger, serialize
├── tests/unit/              # Jest unit tests
├── Dockerfile               # multi-stage build (deps → builder → runtime)
├── docker-compose.yml       # db + api services
├── scripts/entrypoint.sh    # waits for DB, migrates, optional seed, starts API
├── .sequelizerc             # points sequelize-cli at src/ (dev) or dist/ (prod)
├── .env.example
└── package.json
```

## Troubleshooting

- **`password authentication failed` on migrate** — ensure `.env` exists and
  `DB_*` match your PostgreSQL instance (the CLI reads `.env`).
- **`ECONNREFUSED` / DB not reachable** — start PostgreSQL (or use the Docker
  path); confirm `DB_HOST`/`DB_PORT`.
- **Import returns `skipped > 0`** — check the `errors[]` array in the response
  for per‑row messages (e.g. missing required columns).
- **No data in weekly summary** — the dataset is for **2023**; query weeks 1–9.

## License

ISC. Prepared as a technical assessment for CFG.
