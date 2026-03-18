import { TradeService } from './trade.service';

describe('TradeService', () => {
  let tradeService: TradeService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      trade: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        update: jest.fn(),

      },
    };
    tradeService = new TradeService(mockPrisma);
  });

  const mockTrade = {
    exchange: 'binance' as const,
    externalId: '1',
    baseAsset: 'BTC',
    quoteAsset: 'USDT',
    side: 'BUY' as const,
    amount: '0.5',
    price: '45000.00',
  };

  it('getTrades calls prisma.trade.findMany', async () => {
    mockPrisma.trade.findMany.mockResolvedValue([]);
    await tradeService.getTrades();
    expect(mockPrisma.trade.findMany).toHaveBeenCalled();
  });

  it('getTrades calls prisma.trade.findUnique with id', async () => {
    mockPrisma.trade.findUnique.mockResolvedValue([]);
    await tradeService.getTradeById('123');
    expect(mockPrisma.trade.findUnique).toHaveBeenCalledWith({where: {id: '123'}});
  });

  it('createTrade calls prisma.trade.createTrade with data', async () => {
    mockPrisma.trade.create.mockResolvedValue([]);
    await tradeService.createTrade(mockTrade);
    expect(mockPrisma.trade.create).toHaveBeenCalledWith({data: mockTrade});
  });

  it('updateTrade calls prisma.trade.udpateTrade with data', async () => {
    mockPrisma.trade.update.mockResolvedValue([]);
    await tradeService.updateTrade('123', mockTrade);
  expect(mockPrisma.trade.update).toHaveBeenCalledWith({where: {id: '123'}, data: mockTrade});
  });

  it('deleteTrade calls prisma.trade.deleteTrade with data', async () => {
    mockPrisma.trade.delete.mockResolvedValue([]);
    await tradeService.deleteTrade('123');
    expect(mockPrisma.trade.delete).toHaveBeenCalledWith({where: {id: '123'}});
  });
});
