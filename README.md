# Crypto Reconciliation Platform

A comprehensive data reconciliation platform for cryptocurrency exchanges that ingests, normalizes, and reconciles trading data from multiple sources (Coinbase, Binance, Kraken).

## 🎯 Overview

This platform addresses the complex challenge of reconciling cryptocurrency trading data across multiple exchanges with external accounting systems. It provides:

- **Multi-exchange integration** - Unified API abstraction for major exchanges
- **Data normalization** - Standardized data format across all sources
- **Automated ingestion** - Scheduled data collection and storage
- **Reconciliation engine** - Compare exchange data with external CSV reports
- **REST/gRPC APIs** - Modern service architecture
- **Web dashboard** - Visual interface for monitoring and analysis

## 🏗️ Architecture

### Core Components

```
┌─────────────────┐
│  Web Dashboard  │ (Next.js)
└────────┬────────┘
         │
┌────────▼────────┐
│  API Gateway    │ (REST + gRPC)
└────────┬────────┘
         │
    ┌────┴────────────────────┐
    │                         │
┌───▼──────────┐    ┌────────▼─────────┐
│  Ingestion   │    │  Reconciliation  │
│   Pipeline   │    │     Service      │
└───┬──────────┘    └────────┬─────────┘
    │                        │
    │    ┌──────────────────┐│
    │    │                  ││
┌───▼────▼─────┐    ┌───────▼▼─────────┐
│   Exchange   │    │   Normalizer     │
│     SDK      │    │                  │
└──────┬───────┘    └──────────────────┘
       │
┌──────▼────────────────────┐
│  Coinbase │ Binance │ Kraken
└───────────────────────────┘
```

## 📦 Project Structure

```
crypto-reconciliation-platform/
├── packages/
│   ├── exchange-sdk/          # Exchange API integrations
│   ├── normalizer/             # Data transformation layer
│   └── shared/                 # Shared types & utilities
├── services/
│   ├── ingestion/              # Data collection service
│   ├── reconciliation/         # Reconciliation engine
│   └── api-gateway/            # REST/gRPC gateway
├── apps/
│   └── dashboard/              # Web UI (Next.js)
└── infrastructure/
    ├── database/               # Postgres schemas & migrations
    └── docker/                 # Container configurations
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- pnpm (or npm/yarn)
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install dependencies
pnpm install

# Setup database
pnpm db:setup

# Run migrations
pnpm db:migrate

# Start development services
pnpm dev
```

### Environment Configuration

Create a `.env` file in the root:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/crypto_recon

# Exchange API Keys
COINBASE_API_KEY=your_key
COINBASE_API_SECRET=your_secret

BINANCE_API_KEY=your_key
BINANCE_API_SECRET=your_secret

KRAKEN_API_KEY=your_key
KRAKEN_API_SECRET=your_secret

# Service Configuration
INGESTION_CRON_SCHEDULE="0 */6 * * *"
API_GATEWAY_PORT=3000
RECONCILIATION_SERVICE_PORT=50051
```

## 📚 Core Concepts

### 1. Exchange SDK (`@app/exchange-sdk`)

Unified interface for interacting with exchange APIs:

```typescript
import { ExchangeSDK } from '@app/exchange-sdk';

const sdk = new ExchangeSDK({
  exchange: 'binance',
  apiKey: process.env.BINANCE_API_KEY,
  apiSecret: process.env.BINANCE_API_SECRET,
});

// Fetch trades
const trades = await sdk.getTrades({
  symbol: 'BTC-USD',
  from: '2024-01-01',
  to: '2024-01-31',
});

// Fetch balances
const balances = await sdk.getBalances();

// Fetch orders
const orders = await sdk.getOrders({ status: 'filled' });
```

**Features:**
- Automatic pagination handling
- Rate limiting & retry logic
- Error normalization
- TypeScript-first design

### 2. Normalizer (`@app/normalizer`)

Transforms exchange-specific data into a common format:

```typescript
type NormalizedTrade = {
  id: string;
  exchange: 'binance' | 'coinbase' | 'kraken';
  baseAsset: string;
  quoteAsset: string;
  side: 'BUY' | 'SELL';
  amount: string;           // Decimal string for precision
  price: string;
  fee?: string;
  feeAsset?: string;
  timestamp: string;        // ISO 8601
  rawData: Record<string, any>;  // Original response
};
```

**Example:**

```typescript
import { normalize } from '@app/normalizer';

const binanceTrade = { /* raw Binance response */ };
const normalizedTrade = normalize('binance', 'trade', binanceTrade);

// Now it's in standard format regardless of source
console.log(normalizedTrade.baseAsset);  // 'BTC'
console.log(normalizedTrade.side);       // 'BUY'
```

### 3. Ingestion Pipeline

Automated data collection service:

- **Scheduled jobs**: Configurable cron schedule
- **Incremental updates**: Only fetch new data since last sync
- **Dual storage**: Raw + normalized data for audit trail
- **Error handling**: Retry logic, failure notifications

**Database Tables:**
```sql
-- Raw exchange data (audit trail)
raw_trades
raw_balances
raw_orders

-- Normalized data (for queries)
normalized_trades
normalized_balances
normalized_orders

-- Metadata
ingestion_runs
ingestion_errors
```

### 4. Reconciliation Service

Compares exchange data with external CSV files:

```typescript
// Upload a CSV for reconciliation
POST /reconciliations
Content-Type: multipart/form-data

{
  file: accounting_export.csv,
  config: {
    dateColumn: "Date",
    amountColumn: "Amount",
    assetColumn: "Currency",
    tolerance: 0.0001  // Matching tolerance for amounts
  }
}

// Response
{
  reportId: "rec_12345",
  status: "processing"
}
```

**Matching Algorithm:**
1. Parse CSV rows
2. For each row, search normalized_trades by:
   - Timestamp (±5min tolerance)
   - Amount (±tolerance)
   - Asset
3. Classify as:
   - `matched`: Found corresponding trade(s)
   - `unmatched`: No match in exchange data
   - `discrepancy`: Found but with differences
4. Store results in reconciliation tables

**Results:**

```typescript
GET /reconciliations/:reportId

{
  reportId: "rec_12345",
  status: "completed",
  summary: {
    totalRows: 150,
    matched: 142,
    unmatched: 5,
    discrepancies: 3
  },
  items: [
    {
      csvRow: { date: "2024-01-15", amount: "1.5", asset: "BTC" },
      matchedTrade: { id: "trade_xyz", ... },
      status: "matched",
      confidence: 1.0
    },
    // ...
  ]
}
```

### 5. API Gateway

Single entry point for all client applications:

**REST Endpoints:**
```
GET    /api/trades
GET    /api/balances
GET    /api/orders
POST   /api/reconciliations
GET    /api/reconciliations/:id
GET    /api/ingestion/status
POST   /api/ingestion/trigger
```

**gRPC Services** (optional):
```protobuf
service ReconciliationService {
  rpc CreateReconciliation(ReconciliationRequest) returns (ReconciliationResponse);
  rpc GetReconciliation(GetReconciliationRequest) returns (Reconciliation);
  rpc StreamReconciliationStatus(GetReconciliationRequest) returns (stream ReconciliationStatus);
}
```

### 6. Web Dashboard

Next.js application for visualization and management:

**Features:**
- **Dashboard**: Overview of all exchanges, recent trades, sync status
- **Trades View**: Filter and search normalized trades
- **Reconciliation**: Upload CSVs, view reports, drill into discrepancies
- **Ingestion Status**: Monitor sync jobs, view errors
- **Settings**: Manage API keys, configure sync schedules

## 🔄 Data Flow

### Ingestion Flow

```
1. Cron Trigger
   ↓
2. Exchange SDK → Fetch raw data
   ↓
3. Store raw data (audit trail)
   ↓
4. Normalizer → Transform to standard format
   ↓
5. Store normalized data
   ↓
6. Update sync metadata
```

### Reconciliation Flow

```
1. Upload CSV
   ↓
2. Parse & validate CSV
   ↓
3. For each row:
   ├─ Query normalized_trades
   ├─ Apply matching algorithm
   └─ Classify result
   ↓
4. Store reconciliation report
   ↓
5. Return report ID & summary
```

## 🗄️ Database Schema

### Core Tables

```sql
-- Normalized data model
CREATE TABLE normalized_trades (
  id UUID PRIMARY KEY,
  exchange VARCHAR(20) NOT NULL,
  base_asset VARCHAR(10) NOT NULL,
  quote_asset VARCHAR(10) NOT NULL,
  side VARCHAR(4) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  price DECIMAL(20, 8) NOT NULL,
  fee DECIMAL(20, 8),
  fee_asset VARCHAR(10),
  timestamp TIMESTAMPTZ NOT NULL,
  raw_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_trades_exchange (exchange),
  INDEX idx_trades_timestamp (timestamp),
  INDEX idx_trades_assets (base_asset, quote_asset)
);

-- Reconciliation reports
CREATE TABLE reconciliation_reports (
  id UUID PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  total_rows INT NOT NULL,
  matched_rows INT NOT NULL,
  unmatched_rows INT NOT NULL,
  discrepancy_rows INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Reconciliation items (detailed matches)
CREATE TABLE reconciliation_items (
  id UUID PRIMARY KEY,
  report_id UUID REFERENCES reconciliation_reports(id),
  csv_row JSONB NOT NULL,
  matched_trade_id UUID REFERENCES normalized_trades(id),
  status VARCHAR(20) NOT NULL,
  confidence DECIMAL(3, 2),
  notes TEXT
);
```

## 🛠️ Development

### Running Services Individually

```bash
# Exchange SDK tests
pnpm --filter @app/exchange-sdk test

# Ingestion service
pnpm --filter ingestion-service dev

# Reconciliation service
pnpm --filter reconciliation-service dev

# API Gateway
pnpm --filter api-gateway dev

# Dashboard
pnpm --filter dashboard dev
```

### Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Integration tests
pnpm test:integration
```

### Database Management

```bash
# Create migration
pnpm db:migration:create add_user_table

# Run migrations
pnpm db:migrate

# Rollback
pnpm db:rollback

# Seed data
pnpm db:seed
```

## 📊 Use Cases

### 1. Automated Compliance Reporting
- Ingest all trades daily
- Generate reconciliation reports for accounting
- Export to external systems

### 2. Multi-Exchange Portfolio Tracking
- Unified view of all holdings
- Historical P&L calculations
- Asset allocation analysis

### 3. Tax Preparation
- Complete transaction history
- Cost basis calculations
- Reconcile with tax software exports

### 4. Audit Trail
- Immutable raw data storage
- Transformation lineage
- Reconciliation history

## 🚢 Deployment

### Docker Compose

```bash
docker-compose up -d
```

### Kubernetes

```bash
kubectl apply -f infrastructure/k8s/
```

### Environment-specific Configs

- `dev`: Local development with hot reload
- `staging`: Mimics production, test data
- `production`: Full monitoring, backups, HA

## 🔐 Security Considerations

- **API Keys**: Store in secure vault (e.g., AWS Secrets Manager)
- **Database**: Encrypted at rest, SSL connections
- **API Gateway**: Rate limiting, authentication (JWT)
- **Audit Logging**: All reconciliation actions logged
- **Data Privacy**: PII handling compliance (GDPR, etc.)

## 📈 Future Enhancements

- [ ] Support for DeFi protocols (Uniswap, Aave, etc.)
- [ ] Machine learning for intelligent matching
- [ ] Real-time WebSocket feeds
- [ ] Multi-currency conversion & reporting
- [ ] Advanced analytics & dashboards
- [ ] Webhook notifications
- [ ] Export to accounting software (QuickBooks, Xero)
- [ ] Mobile application

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

## 🙋 Support

- Documentation: [docs/](./docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/crypto-reconciliation-platform/issues)
- Discord: [Join our community](#)

---

**Built with**: TypeScript, Node.js, NestJS, PostgreSQL, gRPC, Next.js

**Perfect for showcasing**: Backend architecture, data engineering, API integration, system design
