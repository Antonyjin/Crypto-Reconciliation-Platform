import { Injectable } from '@nestjs/common'
import { BaseExchangeService } from './base-exchange.service'
import { GrpcTradeClientService } from './grpc-trade-client.service'
import axios from 'axios'

@Injectable()
export class BinanceService extends BaseExchangeService {
  constructor(grpcClient: GrpcTradeClientService) {
    super(grpcClient);
  }

  normalizeTrades(rawTrades: any[], symbol: string) {
    const asset = symbol.split('-');

    return rawTrades.map(trade => ({
      externalId: String(trade.id),
      exchange: 'binance' as const,
      baseAsset: asset[0],
      quoteAsset: asset[1],
      side: trade.isBuyerMaker ? 'SELL' as const : 'BUY' as const,
      amount: trade.qty,
      price: trade.price,
    }));
  }

  async getRecentTrades(symbol: string) {
    const response = await axios.get(`https://api.binance.com/api/v3/trades?symbol=${symbol.replace("-", "")}&limit=5`);
    return this.normalizeTrades(response.data, symbol);
  }
}
