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
    it('should reconcile a matched trade', async () => {
      // Seed a trade in DB
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
      expect(res.body.report).toBeDefined();
      expect(res.body.report.matchedCount).toBe(1);
    });

    it('should detect a mismatched trade (different amount)', async () => {
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
      expect(res.body.summary.matched).toBe(0);
      expect(res.body.summary.mismatched).toBe(1);
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
