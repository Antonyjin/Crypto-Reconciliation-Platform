import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BinanceService } from './binance.service';
import { CoinbaseService } from './coinbase.service';
import { KrakenService } from './kraken.service';

interface ExchangeConfig {
  name: string;
  service: { ingestTrades(symbol: string): Promise<any> };
  symbols: string[];
}

@Injectable()
export class ScheduledIngestionService {
  private readonly logger = new Logger(ScheduledIngestionService.name);
  private readonly exchanges: ExchangeConfig[];

  constructor(
    private readonly binanceService: BinanceService,
    private readonly coinbaseService: CoinbaseService,
    private readonly krakenService: KrakenService,
  ) {
    this.exchanges = [
      {
        name: 'binance',
        service: this.binanceService,
        symbols: (process.env.BINANCE_SYMBOLS || 'BTC-USDT,ETH-USDT').split(','),
      },
      {
        name: 'coinbase',
        service: this.coinbaseService,
        symbols: (process.env.COINBASE_SYMBOLS || 'BTC-USD,ETH-USD').split(','),
      },
      {
        name: 'kraken',
        service: this.krakenService,
        symbols: (process.env.KRAKEN_SYMBOLS || 'BTC-USD,ETH-USD').split(','),
      },
    ];
  }

  @Cron(process.env.INGESTION_CRON || CronExpression.EVERY_5_MINUTES)
  async handleScheduledIngestion() {
    this.logger.log('Starting scheduled ingestion...');

    for (const exchange of this.exchanges) {
      for (const symbol of exchange.symbols) {
        try {
          const result = await exchange.service.ingestTrades(symbol);
          this.logger.log(
            `[${exchange.name}] ${symbol}: saved=${result.saved}, failed=${result.failed}`,
          );
        } catch (error) {
          this.logger.error(
            `[${exchange.name}] ${symbol}: ${(error as Error).message}`,
          );
        }
      }
    }

    this.logger.log('Scheduled ingestion complete.');
  }
}
