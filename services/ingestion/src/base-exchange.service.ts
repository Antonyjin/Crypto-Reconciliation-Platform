import axios from 'axios'
import { HttpException } from '@nestjs/common'

export abstract class BaseExchangeService {
  abstract normalizeTrades(rawTrades: any[], symbol: string): any[];
  abstract getRecentTrades(symbol: string): Promise<any>;

  async saveTrades(trades: any[]) {
    let saved = 0;
    let failed = 0;

    for (const trade of trades) {
      try {
        await axios.post('http://api-gateway:3000/trades/upsert', trade);
        saved++;
      } catch(error) {
      failed++
      }
    }
    return { saved, failed };
  }

  async ingestTrades(symbol: string) {
    try {
      const trades = await this.getRecentTrades(symbol);
      const result = await this.saveTrades(trades);
      return result;
    } catch(error) {
      if (axios.isAxiosError(error)) {
        throw new HttpException(`${(error.message)}`, error.response?.status || 500)
      } else {
        throw new HttpException(`Ingestion failed: ${(error as Error).message}`, 500);
      }
    }
  }
}
