import { Test } from '@nestjs/testing';
import { TradeController } from './trade.controller';
import { TradeService } from './trade.service';
import { NotFoundException } from '@nestjs/common';

describe('TradeController', () => {
  let controller: TradeController;
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
    };

    const mockTradeUpdated = { ...mockTrade, amount: '2.0' }

  beforeEach(async () => {
    mockTradeService = {
      getTrades: jest.fn(),
      getTradeById: jest.fn(),
      createTrade: jest.fn(),
      updateTrade: jest.fn(),
      deleteTrade: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [TradeController],
      providers: [
        { provide: TradeService, useValue: mockTradeService },
      ],
    }).compile();

    controller = module.get(TradeController);
  });

  it('getTrades returns the list of trades', async () => {
    mockTradeService.getTrades.mockResolvedValue([]);
    const result = await controller.getTrades({});
    expect(result).toEqual([]);
    expect(mockTradeService.getTrades).toHaveBeenCalled();
  });

  it('getTradeById returns an error code with wrong ID', async () => {
    mockTradeService.getTradeById.mockResolvedValue(null);
    await expect(controller.getTradeById('123')).rejects.toThrow(NotFoundException);
    expect(mockTradeService.getTradeById).toHaveBeenCalled();
  });

  it('createTrade returns the good trade', async () => {
    mockTradeService.createTrade.mockResolvedValue(mockTrade);
    const result = await controller.createTrade(mockTrade);
    expect(result).toEqual(mockTrade);
    expect(mockTradeService.createTrade).toHaveBeenCalled();
  });

  it('updateTrade updates a good trade', async () => {
    mockTradeService.getTradeById.mockResolvedValue(mockTrade);
    mockTradeService.updateTrade.mockResolvedValue(mockTradeUpdated);
    const result = await controller.updateTrade('1', { amount: '2.0' });
    expect(result).toEqual(mockTradeUpdated);
    expect(mockTradeService.updateTrade).toHaveBeenCalledWith('1', { amount: '2.0' });
  });

  it('updateTrade returns error with bad id', async () => {
    mockTradeService.getTradeById.mockResolvedValue(null);
    await expect(controller.updateTrade('50', { amount: '2.0' })).rejects.toThrow(NotFoundException);
  });

  it('deleteTrade deletes a good trade', async () => {
    mockTradeService.getTradeById.mockResolvedValue(mockTrade);
    mockTradeService.deleteTrade.mockResolvedValue(mockTrade);
    const result = await controller.deleteTrade('1');
    expect(result).toEqual(mockTrade);
    expect(mockTradeService.deleteTrade).toHaveBeenCalledWith('1');
  });

  it('deleteTrade returns error with bad id', async () => {
    mockTradeService.getTradeById.mockResolvedValue(null);
    await expect(controller.deleteTrade('10')).rejects.toThrow(NotFoundException);
  });
});
