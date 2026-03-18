# Crypto Reconciliation Platform

A multi-exchange cryptocurrency data platform that ingests trades from Binance, Coinbase and Kraken, normalizes them into a unified format, and reconciles them against external CSV reports.

## Architecture

```
┌──────────────────────┐       ┌──────────────────────┐
│   Ingestion Service  │──────▶│     API Gateway       │
│      (port 3001)     │       │      (port 3000)      │
│                      │       │                       │
│  Binance  Coinbase   │       │  CRUD  Reconciliation │
│       Kraken         │       │                       │
└──────────────────────┘       └───────────┬───────────┘
                                           │
                                  ┌────────▼────────┐
                                  │   PostgreSQL     │
                                  │   (port 5432)    │
                                  └─────────────────┘
```

**Ingestion Service** fetches real trades from exchange APIs, normalizes them and sends them to the API Gateway for storage.

**API Gateway** provides a REST API for trade management (CRUD), upsert with deduplication, and CSV reconciliation (matched / mismatched / missing).

## Tech Stack

| Category       | Technology                          |
|----------------|-------------------------------------|
| Language       | TypeScript                          |
| Runtime        | Node.js 20                          |
| Framework      | NestJS                              |
| Database       | PostgreSQL 16                       |
| ORM            | Prisma 7                            |
| HTTP Client    | Axios                               |
| Validation     | class-validator                     |
| Testing        | Jest                                |
| Monorepo       | pnpm workspaces                     |
| Containers     | Docker & Docker Compose             |
| CI/CD          | GitHub Actions                      |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- Docker & Docker Compose

### Run with Docker Compose

```bash
docker compose up --build
```

This starts all 3 services:
- **PostgreSQL** on port 5432
- **API Gateway** on port 3000 (runs migrations automatically)
- **Ingestion Service** on port 3001

### Run locally

```bash
# Install dependencies
pnpm install

# Build shared package
pnpm --filter @app/shared build

# Generate Prisma client & run migrations
cd services/api-gateway
npx prisma generate
npx prisma migrate dev
cd ../..

# Start services (in separate terminals)
pnpm --filter @app/api-gateway dev
pnpm --filter @app/ingestion-service dev
```

## API Endpoints

### API Gateway (port 3000)

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/health`               | Health check                         |
| GET    | `/trades`               | List trades (supports filters)       |
| GET    | `/trades/:id`           | Get trade by ID                      |
| POST   | `/trades`               | Create a trade                       |
| POST   | `/trades/upsert`        | Create or update (deduplication)     |
| PUT    | `/trades/:id`           | Update a trade                       |
| DELETE | `/trades/:id`           | Delete a trade                       |
| POST   | `/reconciliation/upload`| Upload CSV and reconcile             |

**Filters** (query params on `GET /trades`): `exchange`, `baseAsset`, `quoteAsset`, `side`

### Ingestion Service (port 3001)

| Method | Endpoint                           | Description                    |
|--------|------------------------------------|--------------------------------|
| GET    | `/binance/trades?symbol=BTC-USDT`  | Fetch recent Binance trades    |
| POST   | `/binance/ingest?symbol=BTC-USDT`  | Ingest Binance trades to DB    |
| GET    | `/coinbase/trades?symbol=BTC-USD`  | Fetch recent Coinbase trades   |
| POST   | `/coinbase/ingest?symbol=BTC-USD`  | Ingest Coinbase trades to DB   |
| GET    | `/kraken/trades?symbol=BTC-USD`    | Fetch recent Kraken trades     |
| POST   | `/kraken/ingest?symbol=BTC-USD`    | Ingest Kraken trades to DB     |

## Project Structure

```
crypto-reconciliation-platform/
├── packages/
│   └── shared/                 # Shared types & DTOs (Trade, CreateTradeDto, FiltersDto)
├── services/
│   ├── api-gateway/            # REST API, CRUD, reconciliation, Prisma
│   └── ingestion/              # Exchange integrations (Binance, Coinbase, Kraken)
├── docker-compose.yml
└── .github/workflows/ci.yml    # CI pipeline (build + tests)
```

## Key Design Decisions

- **Abstract BaseExchangeService** — Common logic (save, ingest) is shared; each exchange only implements `getRecentTrades()` and `normalizeTrades()`
- **Unified symbol format** — All exchanges use `BASE-QUOTE` format (e.g. `BTC-USDT`), each service converts to the exchange-specific format internally
- **Upsert with composite unique key** — `(externalId, exchange)` prevents duplicate trades on repeated ingestion
- **Error handling** — Ingestion distinguishes client errors (bad symbol -> 400) from server errors (API down -> 500), and tracks saved/failed counts per ingestion

## Testing

```bash
# Run unit tests
pnpm --filter @app/api-gateway test
```

Tests cover:
- **TradeService** — CRUD operations with mocked Prisma
- **TradeController** — HTTP layer, 404 handling, request validation

## CI/CD

GitHub Actions pipeline runs on every push:
1. Install dependencies
2. Build shared package + API Gateway
3. Run unit tests

## Roadmap

- [ ] Web dashboard (Next.js)
- [ ] Scheduled ingestion (cron jobs)
- [ ] Integration / e2e tests
- [ ] Support for more exchanges
- [ ] Real-time WebSocket feeds
- [ ] Export to accounting software

---

Built with TypeScript, NestJS, Prisma, PostgreSQL, Docker

