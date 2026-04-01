import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './setup';

const seedTrade = {
  externalId: 'recon-001',
  exchange: 'binance',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  side: 'BUY',
  amount: '1.0',
  price: '50000.00',
  fee: '0.001',
  feeAsset: 'BTC',
};

function buildCsv(rows: Record<string, string>[]): Buffer {
  const headers = Object.keys(rows[0]).join(',');
  const lines = rows.map((r) => Object.values(r).join(','));
  return Buffer.from([headers, ...lines].join('\n'));
}

describe('Reconciliation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await cleanDatabase(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /reconciliation/upload', () => {
    it('should reconcile a matched trade with confidence score', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.matched).toBe(1);
      expect(res.body.summary.mismatched).toBe(0);
      expect(res.body.summary.missing).toBe(0);
      expect(res.body.matched[0].confidence).toBeGreaterThanOrEqual(80);
      expect(res.body.matched[0].matchType).toBe('exact');
      expect(res.body.matched[0].breakdown).toBeDefined();
      expect(res.body.report.matchedCount).toBe(1);
    });

    it('should return confidence breakdown fields', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      const breakdown = res.body.matched[0].breakdown;
      expect(breakdown.amount).toBe(30);
      expect(breakdown.price).toBe(30);
      expect(breakdown.side).toBe(20);
    });

    it('should detect a mismatched trade (different amount) with low confidence', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '2.0',
          price: '50000.00',
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.mismatched).toBe(1);
      expect(res.body.mismatched[0].confidence).toBeLessThan(80);
      expect(res.body.mismatched[0].breakdown.amount).toBe(0);
    });

    it('should detect a mismatched trade (different side)', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'SELL',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.mismatched).toBe(1);
      expect(res.body.mismatched[0].breakdown.side).toBe(0);
    });

    it('should detect a missing trade', async () => {
      const csv = buildCsv([
        {
          externalId: 'does-not-exist',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.missing).toBe(1);
    });

    it('should handle mixed results (matched + mismatched + missing)', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);
      await request(app.getHttpServer()).post('/trades').send({
        ...seedTrade,
        externalId: 'recon-002',
        amount: '3.0',
      });

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
        {
          externalId: 'recon-002',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '5.0',
          price: '50000.00',
        },
        {
          externalId: 'recon-003',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.total).toBe(3);
      expect(res.body.summary.matched).toBe(1);
      expect(res.body.summary.mismatched).toBe(1);
      expect(res.body.summary.missing).toBe(1);
    });

    it('should fuzzy match by timestamp when externalId not found', async () => {
      const now = new Date();
      await request(app.getHttpServer()).post('/trades').send({
        ...seedTrade,
        externalId: 'db-id-123',
        timestamp: now.toISOString(),
      });

      const csvTime = new Date(now.getTime() + 2000); // 2 seconds later
      const csv = buildCsv([
        {
          externalId: 'csv-id-different',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
          timestamp: csvTime.toISOString(),
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.matched).toBe(1);
      expect(res.body.matched[0].matchType).toBe('fuzzy');
      expect(res.body.matched[0].confidence).toBeGreaterThanOrEqual(50);
    });

    it('should not fuzzy match when timestamp is too far apart', async () => {
      const now = new Date();
      await request(app.getHttpServer()).post('/trades').send({
        ...seedTrade,
        externalId: 'db-id-123',
        timestamp: now.toISOString(),
      });

      const csvTime = new Date(now.getTime() + 60000); // 1 minute later
      const csv = buildCsv([
        {
          externalId: 'csv-id-different',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
          timestamp: csvTime.toISOString(),
        },
      ]);

      const res = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      expect(res.status).toBe(201);
      expect(res.body.summary.missing).toBe(1);
    });

    it('should store confidence and matchType in report items', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const uploadRes = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      const reportId = uploadRes.body.report.id;

      const res = await request(app.getHttpServer())
        .get(`/reconciliation/reports/${reportId}`);

      expect(res.status).toBe(200);
      expect(res.body.items[0].confidence).toBeGreaterThanOrEqual(80);
      expect(res.body.items[0].matchType).toBe('exact');
    });
  });

  describe('GET /reconciliation/reports', () => {
    it('should return empty array when no reports', async () => {
      const res = await request(app.getHttpServer())
        .get('/reconciliation/reports');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return reports after reconciliation', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      const res = await request(app.getHttpServer())
        .get('/reconciliation/reports');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].items).toBeDefined();
      expect(res.body[0].matchedCount).toBe(1);
    });
  });

  describe('GET /reconciliation/reports/:id', () => {
    it('should return a report by id with items', async () => {
      await request(app.getHttpServer()).post('/trades').send(seedTrade);

      const csv = buildCsv([
        {
          externalId: 'recon-001',
          exchange: 'binance',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          side: 'BUY',
          amount: '1.0',
          price: '50000.00',
        },
      ]);

      const uploadRes = await request(app.getHttpServer())
        .post('/reconciliation/upload')
        .attach('file', csv, 'trades.csv');

      const reportId = uploadRes.body.report.id;

      const res = await request(app.getHttpServer())
        .get(`/reconciliation/reports/${reportId}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(reportId);
      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].status).toBe('matched');
    });

    it('should return 404 for non-existent report', async () => {
      const res = await request(app.getHttpServer())
        .get('/reconciliation/reports/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });
});
