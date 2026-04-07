# Crypto Reconciliation Platform

A full-stack platform for ingesting, normalizing, and reconciling cryptocurrency trades across multiple exchanges (Binance, Coinbase, Kraken).

## Architecture

```
                         ┌─────────────────────┐
                         │      Dashboard       │
                         │   Next.js :3002      │
                         └──────────┬──────────┘
                                    │ HTTP
                                    │
              ┌─────────────────────▼──────────────────────┐
              │              API Gateway                    │
              │            NestJS :3000 (HTTP)              │
              │            NestJS :5050 (gRPC)              │
              │                                             │
              │  • Trades CRUD                              │
              │  • Reconciliation engine                    │
              │  • Confidence scoring + fuzzy matching      │
              └──────────┬───────────────────────┬─────────┘
                         │                       ▲
                         │ Prisma                │ gRPC
                         ▼                       │ (UpsertTrade)
                ┌────────────────┐    ┌──────────┴──────────┐
                │   PostgreSQL   │    │     Ingestion        │
                │     :5432      │    │   NestJS :3001       │
                └────────────────┘    │                      │
                                      │  • Cron scheduler    │
                                      │  • Binance / Coinbase│
                                      │    / Kraken adapters │
                                      └──────────┬──────────┘
                                                 │ HTTPS
                                                 ▼
                                      ┌──────────────────────┐
                                      │   Exchange APIs       │
                                      │ Binance · Coinbase    │
                                      │      Kraken           │
                                      └──────────────────────┘
```

**How data flows:**
1. The **ingestion service** polls exchange APIs on a cron schedule (or on-demand via REST)
2. It normalizes the raw trades into a unified format (`BASE-QUOTE` symbol, common fields)
3. It sends each trade to the **API Gateway** via **gRPC** (typed contract, not HTTP)
4. The API Gateway upserts the trade into PostgreSQL via Prisma (deduped by `externalId + exchange`)
5. Users can upload a CSV through the **dashboard**, which calls the API Gateway's reconciliation endpoint
6. The reconciliation engine compares CSV trades against the DB with confidence scoring and fuzzy matching

## Tech Stack

- **Backend**: NestJS, TypeScript, Prisma ORM, PostgreSQL
- **Inter-service**: gRPC with shared protobuf contracts
- **Frontend**: Next.js 16, React 19, Tailwind CSS v4
- **Infrastructure**: Docker Compose, GitHub Actions CI
- **Monorepo**: pnpm workspaces

## Project Structure

```
crypto-reconciliation-platform/
├── apps/
│   └── dashboard/              # Next.js web dashboard
├── packages/
│   └── shared/
│       ├── src/                # Shared types & DTOs
│       └── proto/              # gRPC protobuf contracts
├── services/
│   ├── api-gateway/            # REST API + gRPC server, reconciliation engine
│   └── ingestion/              # Multi-exchange polling + cron + gRPC client
├── docker-compose.yml          # Full stack: db + api + ingestion + dashboard
├── docker-compose.test.yml     # Isolated PostgreSQL for e2e tests
└── .github/workflows/ci.yml
```

## Features

### Multi-Exchange Ingestion
- Fetches real trades from **Binance**, **Coinbase**, and **Kraken** APIs
- Unified symbol format (`BTC-USDT`) across all exchanges
- Abstract `BaseExchangeService` class — each exchange implements only `getRecentTrades()` and `normalizeTrades()` (~30 lines per new exchange)
- gRPC upsert to API Gateway with composite unique constraint `(externalId, exchange)` for deduplication
- **Scheduled ingestion** via cron (default: every 5 minutes)
- Resilient: errors on one exchange/symbol don't block the others

### Trade Management
- Full CRUD API for trades
- Filtering by exchange, base asset, quote asset, side
- Validation via DTOs and class-validator

### CSV Reconciliation
- Upload a CSV file and compare with database trades
- **Two-step matching**:
  1. Exact match by `externalId + exchange`
  2. Fuzzy match by timestamp proximity (±5s window) when no exact match found
- **Confidence scoring** (0-100%) with breakdown by field:
  - Amount: 30 points
  - Price: 30 points
  - Side (BUY/SELL): 20 points
  - Timestamp: 20 points
- Trades scoring ≥80% are **matched**, below are **mismatched**, no match found are **missing**
- Saves reconciliation reports with confidence scores and match type (`exact` / `fuzzy`) to database
- Report history with detail view and full breakdown per trade

### Web Dashboard
- **Home** — Overview cards (trade count, report count, exchange count) with loading skeletons
- **Trades** — Filterable table (by exchange, by side) with badges, monospace pricing, empty states
- **Ingestion** — Toggle-button exchange selector, auto-updating default symbol, animated loading
- **Reports** — Drag-and-drop CSV upload, report history with match-rate per row, detail view with:
  - Status badges (matched/mismatched/missing)
  - Match type badges (exact in blue / fuzzy in purple)
  - Animated confidence bars per item
  - Side-by-side CSV vs DB comparison with red highlighting on differences

## Getting Started

### Prerequisites
- Node.js 20+
- pnpm
- Docker & Docker Compose

### Run with Docker

One command starts the entire stack:

```bash
docker-compose up --build
```

This brings up:

| Service | URL |
|---|---|
| API Gateway (HTTP) | http://localhost:3000 |
| API Gateway (gRPC) | localhost:5050 |
| Ingestion Service | http://localhost:3001 |
| Dashboard | http://localhost:3002 |
| PostgreSQL | localhost:5432 |

### API Endpoints

**Trades**
```
GET    /trades                  # List all trades (supports filters: exchange, side, baseAsset, etc.)
GET    /trades/:id              # Get trade by ID
POST   /trades                  # Create trade
POST   /trades/upsert           # Create or update trade (used by gRPC under the hood)
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
GET    /reconciliation/reports/:id           # Get report with details (includes confidence + matchType per item)
```

**gRPC (internal)**
```
TradeService.UpsertTrade         # Used by ingestion service to save trades
```

### CSV Format

```csv
externalId,exchange,baseAsset,quoteAsset,side,amount,price,timestamp
6108653502,binance,BTC,USDT,SELL,0.04330000,71701.74000000,2026-04-01T12:34:56Z
```

The `timestamp` column is optional but enables fuzzy matching when external IDs don't line up between systems.

## Key Design Decisions

- **Abstract class for exchanges** — `BaseExchangeService` provides `saveTrades()` and `ingestTrades()`. Each exchange only implements API-specific logic. Adding a new exchange takes ~30 lines.
- **Unified symbol format** — All exchanges use `BASE-QUOTE` (e.g., `BTC-USDT`). Each adapter converts to the exchange's native format internally.
- **gRPC for inter-service communication** — The ingestion service communicates with the API Gateway via gRPC instead of HTTP, using a shared protobuf contract (`packages/shared/proto/trades.proto`). Typed at compile time, faster, and the contract lives in one place.
- **Tolerance + confidence scoring for reconciliation** — Compares amounts/prices as floats with ±0.0001 tolerance. Confidence breakdown helps prioritize which mismatches to investigate first.
- **Two-phase matching** — Exact match by ID first, then fuzzy match by timestamp. Catches cases where systems use different IDs for the same trade.
- **Reconciliation kept in API Gateway** — Direct database access avoids unnecessary inter-service calls. Pragmatic choice given project scope.
- **Upsert for deduplication** — Composite unique constraint on `(externalId, exchange)` prevents duplicate trades on re-ingestion. Idempotent by design.
- **Monorepo with pnpm workspaces** — DTOs, types, and protobuf contracts are shared between services without publishing packages.

## Testing

```bash
# Unit tests (api-gateway + ingestion)
pnpm test
```

**Coverage (19 unit tests):**
- `TradeService` and `TradeController` (CRUD + 404 handling)
- `TradeGrpcController` (gRPC method + date serialization)
- `ScheduledIngestionService` (cron handler + error resilience)

### End-to-End Tests

E2E tests run against a real PostgreSQL database — no mocks. They exercise the full HTTP → NestJS → Prisma → DB stack.

```bash
# Start the isolated test database (port 5433, in-memory tmpfs)
docker compose -f docker-compose.test.yml up -d

# Run e2e tests
DATABASE_URL="postgresql://antonyjin:password@localhost:5433/crypto_recon_test" pnpm test:e2e

# Stop the test database
docker compose -f docker-compose.test.yml down
```

**Coverage (28 e2e tests):**
- **Health** — Server boot, `/health` endpoint
- **Trades** — Full CRUD, query filters, upsert deduplication, validation (400), not found (404)
- **Reconciliation** — Exact matching, fuzzy matching by timestamp, confidence breakdown verification, mixed results, report persistence and retrieval

CI runs automatically on every push via GitHub Actions.

### Scheduled Ingestion

The ingestion service automatically polls exchanges on a cron schedule (default: every 5 minutes).

Configure via environment variables:

| Variable | Default | Description |
|---|---|---|
| `INGESTION_CRON` | `*/5 * * * *` | Cron expression for ingestion frequency |
| `BINANCE_SYMBOLS` | `BTC-USDT,ETH-USDT` | Comma-separated symbols to ingest from Binance |
| `COINBASE_SYMBOLS` | `BTC-USD,ETH-USD` | Comma-separated symbols to ingest from Coinbase |
| `KRAKEN_SYMBOLS` | `BTC-USD,ETH-USD` | Comma-separated symbols to ingest from Kraken |

### Dashboard Configuration

The dashboard reads API URLs from environment variables (with sensible defaults). Override in `apps/dashboard/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_INGESTION_URL=http://localhost:3001
```

## Roadmap

- [x] End-to-end tests
- [x] Scheduled ingestion (cron jobs)
- [x] gRPC communication between services
- [x] Advanced reconciliation (timestamp matching, confidence scoring)
- [ ] Settlement simulation engine (order → match → clearing → settlement lifecycle)
- [ ] Authentication (JWT)

## License

MIT
