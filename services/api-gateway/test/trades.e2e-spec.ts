import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp, cleanDatabase } from './setup';

const validTrade = {
  externalId: 'e2e-test-001',
  exchange: 'binance',
  baseAsset: 'BTC',
  quoteAsset: 'USDT',
  side: 'BUY',
  amount: '0.5',
  price: '42000.00',
  fee: '0.001',
  feeAsset: 'BTC',
};

describe('Trades (e2e)', () => {
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

  describe('POST /trades', () => {
    it('should create a trade', async () => {
      const res = await request(app.getHttpServer())
        .post('/trades')
        .send(validTrade);

      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.externalId).toBe(validTrade.externalId);
      expect(res.body.exchange).toBe(validTrade.exchange);
      expect(res.body.amount).toBe(validTrade.amount);
    });

    it('should reject a trade with missing required fields', async () => {
      const res = await request(app.getHttpServer())
        .post('/trades')
        .send({ externalId: 'incomplete' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /trades', () => {
    it('should return an empty array when no trades exist', async () => {
      const res = await request(app.getHttpServer()).get('/trades');
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });

    it('should return all trades', async () => {
      await request(app.getHttpServer()).post('/trades').send(validTrade);
      await request(app.getHttpServer()).post('/trades').send({
        ...validTrade,
        externalId: 'e2e-test-002',
      });

      const res = await request(app.getHttpServer()).get('/trades');
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });

    it('should filter trades by exchange', async () => {
      await request(app.getHttpServer()).post('/trades').send(validTrade);
      await request(app.getHttpServer()).post('/trades').send({
        ...validTrade,
        externalId: 'e2e-test-coinbase',
        exchange: 'coinbase',
      });

      const res = await request(app.getHttpServer())
        .get('/trades')
        .query({ exchange: 'binance' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].exchange).toBe('binance');
    });
  });

  describe('GET /trades/:id', () => {
    it('should return a trade by id', async () => {
      const created = await request(app.getHttpServer())
        .post('/trades')
        .send(validTrade);

      const res = await request(app.getHttpServer())
        .get(`/trades/${created.body.id}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(created.body.id);
    });

    it('should return 404 for non-existent trade', async () => {
      const res = await request(app.getHttpServer())
        .get('/trades/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /trades/:id', () => {
    it('should update a trade', async () => {
      const created = await request(app.getHttpServer())
        .post('/trades')
        .send(validTrade);

      const res = await request(app.getHttpServer())
        .put(`/trades/${created.body.id}`)
        .send({ amount: '1.0' });

      expect(res.status).toBe(200);
      expect(res.body.amount).toBe('1.0');
      expect(res.body.externalId).toBe(validTrade.externalId);
    });

    it('should return 404 for non-existent trade', async () => {
      const res = await request(app.getHttpServer())
        .put('/trades/00000000-0000-0000-0000-000000000000')
        .send({ amount: '1.0' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /trades/:id', () => {
    it('should delete a trade', async () => {
      const created = await request(app.getHttpServer())
        .post('/trades')
        .send(validTrade);

      const res = await request(app.getHttpServer())
        .delete(`/trades/${created.body.id}`);

      expect(res.status).toBe(200);

      const check = await request(app.getHttpServer())
        .get(`/trades/${created.body.id}`);
      expect(check.status).toBe(404);
    });

    it('should return 404 for non-existent trade', async () => {
      const res = await request(app.getHttpServer())
        .delete('/trades/00000000-0000-0000-0000-000000000000');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /trades/upsert', () => {
    it('should create a trade if it does not exist', async () => {
      const res = await request(app.getHttpServer())
        .post('/trades/upsert')
        .send(validTrade);

      expect(res.status).toBe(201);
      expect(res.body.externalId).toBe(validTrade.externalId);
    });

    it('should not duplicate on second upsert with same externalId+exchange', async () => {
      await request(app.getHttpServer())
        .post('/trades/upsert')
        .send(validTrade);

      await request(app.getHttpServer())
        .post('/trades/upsert')
        .send(validTrade);

      const all = await request(app.getHttpServer()).get('/trades');
      expect(all.body).toHaveLength(1);
    });
  });
});
