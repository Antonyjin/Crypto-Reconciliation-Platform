import { Test, TestingModule } from '@nestjs/testing';
import { ScheduledIngestionService } from './scheduled-ingestion.service';
import { BinanceService } from './binance.service';
import { CoinbaseService } from './coinbase.service';
import { KrakenService } from './kraken.service';

describe('ScheduledIngestionService', () => {
  let service: ScheduledIngestionService;
  let binanceService: BinanceService;
  let coinbaseService: CoinbaseService;
  let krakenService: KrakenService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduledIngestionService,
        {
          provide: BinanceService,
          useValue: { ingestTrades: jest.fn().mockResolvedValue({ saved: 5, failed: 0 }) },
        },
        {
          provide: CoinbaseService,
          useValue: { ingestTrades: jest.fn().mockResolvedValue({ saved: 3, failed: 0 }) },
        },
        {
          provide: KrakenService,
          useValue: { ingestTrades: jest.fn().mockResolvedValue({ saved: 2, failed: 0 }) },
        },
      ],
    }).compile();

    service = module.get(ScheduledIngestionService);
    binanceService = module.get(BinanceService);
    coinbaseService = module.get(CoinbaseService);
    krakenService = module.get(KrakenService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call ingestTrades on all exchanges', async () => {
    await service.handleScheduledIngestion();

    expect(binanceService.ingestTrades).toHaveBeenCalled();
    expect(coinbaseService.ingestTrades).toHaveBeenCalled();
    expect(krakenService.ingestTrades).toHaveBeenCalled();
  });

  it('should call ingestTrades with each configured symbol', async () => {
    await service.handleScheduledIngestion();

    expect(binanceService.ingestTrades).toHaveBeenCalledWith('BTC-USDT');
    expect(binanceService.ingestTrades).toHaveBeenCalledWith('ETH-USDT');
    expect(coinbaseService.ingestTrades).toHaveBeenCalledWith('BTC-USD');
    expect(coinbaseService.ingestTrades).toHaveBeenCalledWith('ETH-USD');
    expect(krakenService.ingestTrades).toHaveBeenCalledWith('BTC-USD');
    expect(krakenService.ingestTrades).toHaveBeenCalledWith('ETH-USD');
  });

  it('should continue ingesting other exchanges if one fails', async () => {
    (binanceService.ingestTrades as jest.Mock).mockRejectedValue(new Error('Binance API down'));

    await service.handleScheduledIngestion();

    expect(binanceService.ingestTrades).toHaveBeenCalled();
    expect(coinbaseService.ingestTrades).toHaveBeenCalled();
    expect(krakenService.ingestTrades).toHaveBeenCalled();
  });

  it('should continue ingesting other symbols if one fails', async () => {
    (binanceService.ingestTrades as jest.Mock)
      .mockRejectedValueOnce(new Error('BTC failed'))
      .mockResolvedValueOnce({ saved: 5, failed: 0 });

    await service.handleScheduledIngestion();

    expect(binanceService.ingestTrades).toHaveBeenCalledTimes(2);
  });
});
