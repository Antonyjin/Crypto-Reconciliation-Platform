import axios from 'axios'

export abstract class BaseExchangeService {
  abstract normalizeTrades(rawTrades: any[], symbol: string): any[];
  abstract getRecentTrades(symbol: string): Promise<any>;

  async saveTrades(trades: any[]) {
    for (const trade of trades) {
      await axios.post('http://api-gateway:3000/trades/upsert', trade);
    }
  }

  async ingestTrades(symbol: string) {
    let trades = await this.getRecentTrades(symbol);

    this.saveTrades(trades);
    return { saved: trades.length };
  }
}
