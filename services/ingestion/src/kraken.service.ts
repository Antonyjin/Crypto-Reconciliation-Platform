import { Injectable } from '@nestjs/common'
import { BaseExchangeService } from './base-exchange.service'
import axios from 'axios'

@Injectable()
export class KrakenService extends BaseExchangeService {
  normalizeTrades(rawTrades: any[], symbol: string) {
    const asset = symbol.split('-');

    return rawTrades.map(trade => ({
      externalId: String(trade[2]),
      exchange: 'kraken' as const,
      baseAsset: asset[0],
      quoteAsset: asset[1],
      side: trade[3] === 'b' ? 'BUY' : 'SELL',
      amount: trade[1],
      price: trade[0],
    }));
  }

  async getRecentTrades(symbol: string) {
    let newSymbol: string[] = symbol.split('-');

    newSymbol[0] === "BTC" ? "XBT" : newSymbol[0]
    const response = await axios.get(`https://api.kraken.com/0/public/Trades?pair=${newSymbol[0].concat(newSymbol[1])}`);
    return this.normalizeTrades(Object.values(response.data.result)[0] as any[], symbol);
  }
}
