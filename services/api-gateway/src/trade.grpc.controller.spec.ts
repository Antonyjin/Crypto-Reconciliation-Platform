import { Test } from '@nestjs/testing';
import { TradeGrpcController } from './trade.grpc.controller';
import { TradeService } from './trade.service';

describe('TradeGrpcController', () => {
  let controller: TradeGrpcController;
  let mockTradeService: any;

  const mockTrade = {
    id: '1',
    externalId: '1',
    exchange: 'binance' as const,
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    side: 'BUY' as const,
    amount: '0.5',
    price: '45000.00',
    timestamp: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
  };

  beforeEach(async () => {
    mockTradeService = {
      upsertTrade: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [TradeGrpcController],
      providers: [
        { provide: TradeService, useValue: mockTradeService },
      ],
    }).compile();

    controller = module.get(TradeGrpcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('upsertTrade should call tradeService.upsertTrade with data', async () => {
    mockTradeService.upsertTrade.mockResolvedValue(mockTrade);

    const data = {
      externalId: '1',
      exchange: 'binance',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      side: 'BUY',
      amount: '0.5',
      price: '45000.00',
    };

    const result = await controller.upsertTrade(data);

    expect(mockTradeService.upsertTrade).toHaveBeenCalledWith(data);
    expect(result.id).toBe('1');
    expect(result.timestamp).toBe('2026-01-01T00:00:00.000Z');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
