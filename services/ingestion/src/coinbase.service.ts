import { Injectable } from '@nestjs/common'
import { BaseExchangeService } from './base-exchange.service'
import axios from 'axios'

@Injectable()
export class CoinbaseService extends BaseExchangeService {
  normalizeTrades(rawTrades: any[], symbol: string) {
    const asset = symbol.split('-');

    return rawTrades.map(trade => ({
      externalId: String(trade.trade_id),
      exchange: 'coinbase' as const,
      baseAsset: asset[0],
      quoteAsset: asset[1],
      side: trade.side.toUpperCase(),
      amount: trade.size,
      price: trade.price,
    }));
  }

  async getRecentTrades(symbol: string) {
    const response = await axios.get(`https://api.exchange.coinbase.com/products/${symbol}/trades`);
    return this.normalizeTrades(response.data, symbol);
  }
}
