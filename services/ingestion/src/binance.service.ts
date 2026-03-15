import { Injectable } from '@nestjs/common'
import axios from 'axios'
@Injectable()
export class BinanceService {
  normalizeTrades(rawTrades: any[], symbol: string) {
    const quoteAsset = symbol.slice(-4);        // "USDT"
    const baseAsset = symbol.slice(0, -4);      // "BTC"

    return rawTrades.map(trade => ({
      externalId: String(trade.id),
      exchange: 'binance' as const,
      baseAsset,
      quoteAsset,
      side: trade.isBuyerMaker ? 'SELL' as const : 'BUY' as const,
      amount: trade.qty,
      price: trade.price,
    }));
  }

  async getRecentTrades(symbol: string) {
    const response = await axios.get(`https://api.binance.com/api/v3/trades?symbol=${symbol}&limit=5`);
    return this.normalizeTrades(response.data, symbol);
  }

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
