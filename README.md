# Crypto Reconciliation Platform

A full-stack platform for ingesting, normalizing, and reconciling cryptocurrency trades across multiple exchanges (Binance, Coinbase, Kraken).

## Architecture

```
┌──────────────────┐
│    Dashboard      │  (Next.js - port 3002)
└────────┬─────────┘
         │
┌────────▼─────────┐     ┌──────────────────┐
│   API Gateway     │◄────│   Ingestion       │
│   (port 3000)     │     │   (port 3001)     │
└────────┬─────────┘     └──────┬───────────┘
         │                       │
┌────────▼─────────┐     ┌──────▼───────────┐
│   PostgreSQL      │     │  Binance API      │
│   (port 5432)     │     │  Coinbase API     │
└──────────────────┘     │  Kraken API       │
                          └──────────────────┘
```

## Tech Stack

- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL
- **Frontend**: Next.js, React, Tailwind CSS
- **Infrastructure**: Docker Compose, GitHub Actions CI
- **Monorepo**: pnpm workspaces

## Project Structure

```
crypto-reconciliation-platform/
├── apps/
│   └── dashboard/              # Next.js web dashboard
├── packages/
│   └── shared/                 # Shared types & DTOs
├── services/
│   ├── api-gateway/            # REST API — CRUD, reconciliation
│   └── ingestion/              # Multi-exchange trade ingestion
├── docker-compose.yml
└── .github/workflows/ci.yml
```

## Features

### Multi-Exchange Ingestion
- Fetches real trades from **Binance**, **Coinbase**, and **Kraken** APIs
- Unified symbol format (`BTC-USDT`) across all exchanges
- Abstract `BaseExchangeService` class — each exchange implements only `getRecentTrades()` and `normalizeTrades()`
- Upsert logic to avoid duplicate trades
- Error handling with proper HTTP status codes

### Trade Management
- Full CRUD API for trades
- Filtering by exchange, base asset, quote asset, side
- Validation via DTOs and class-validator

### CSV Reconciliation
- Upload a CSV file and compare with database trades
- Tolerance-based matching on amounts and prices (±0.0001)
- Categorizes trades as **matched**, **mismatched**, or **missing**
- Saves reconciliation reports to database
- Report history with detail view

### Web Dashboard
- **Home** — Overview with trade count, report count, exchange count
- **Trades** — Table of all ingested trades with color-coded BUY/SELL
- **Ingestion** — Select exchange and symbol, trigger ingestion from UI
- **Reports** — Upload CSV, view reconciliation history, drill into report details

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Docker & Docker Compose

### Run with Docker

```bash
# Start API Gateway + PostgreSQL
docker-compose up --build

# Start the dashboard (in another terminal)
cd apps/dashboard && npm run dev -- -p 3002
```

- API Gateway: http://localhost:3000
- Ingestion Service: http://localhost:3001
- Dashboard: http://localhost:3002

### API Endpoints

**Trades**
```
GET    /trades                  # List all trades (supports filters)
GET    /trades/:id              # Get trade by ID
POST   /trades                  # Create trade
POST   /trades/upsert           # Create or update trade
PUT    /trades/:id              # Update trade
DELETE /trades/:id              # Delete trade
```

**Ingestion**
```
GET    /binance/trades?symbol=BTC-USDT      # Fetch trades from Binance
POST   /binance/ingest?symbol=BTC-USDT      # Ingest Binance trades to DB
GET    /coinbase/trades?symbol=BTC-USD       # Fetch trades from Coinbase
POST   /coinbase/ingest?symbol=BTC-USD       # Ingest Coinbase trades to DB
GET    /kraken/trades?symbol=BTC-USD         # Fetch trades from Kraken
POST   /kraken/ingest?symbol=BTC-USD         # Ingest Kraken trades to DB
```

**Reconciliation**
```
POST   /reconciliation/upload                # Upload CSV and reconcile
GET    /reconciliation/reports               # List all reports
GET    /reconciliation/reports/:id           # Get report with details
```

### CSV Format

```csv
externalId,exchange,amount,price,side
6108653502,binance,0.04330000,71701.74000000,SELL
```

## Key Design Decisions

- **Abstract class for exchanges** — `BaseExchangeService` provides `saveTrades()` and `ingestTrades()`. Each exchange only implements API-specific logic. Adding a new exchange takes ~30 lines of code.
- **Unified symbol format** — All exchanges use `BASE-QUOTE` (e.g., `BTC-USDT`). Each service converts to the exchange's native format internally.
- **Tolerance-based reconciliation** — Compares amounts/prices as floats with ±0.0001 tolerance instead of exact string matching, accounting for decimal formatting differences.
- **Reconciliation kept in API Gateway** — Direct database access avoids unnecessary inter-service calls. Pragmatic choice given project scope.
- **Upsert for deduplication** — Composite unique constraint on `(externalId, exchange)` prevents duplicate trades on re-ingestion.

## Testing

```bash
# Unit tests
cd services/api-gateway && npm test
```

Tests cover TradeService (CRUD operations) and TradeController (HTTP layer, 404 handling).

CI runs automatically on every push via GitHub Actions.

## Roadmap

- [ ] End-to-end tests
- [ ] Scheduled ingestion (cron jobs)
- [ ] gRPC communication between services
- [ ] Advanced reconciliation (timestamp matching, confidence scoring)
- [ ] Authentication (JWT)

## License

MIT

