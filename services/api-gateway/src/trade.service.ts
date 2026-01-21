import { Injectable } from "@nestjs/common";
import { Trade } from "@app/shared";

@Injectable()
export class TradeService {
  private trades: Trade[] = [
    {
      id: '1',
      exchange: 'binance',
      baseAsset: 'BTC',
      quoteAsset: 'USDT',
      side: 'BUY',
      amount: '0.5',
      timestamp: new Date(),
    },
    {
      id: '2',
      exchange: 'coinbase',
      baseAsset: 'ETH',
      quoteAsset: 'EUR',
      side: 'SELL',
      amount: '2.0',
      timestamp: new Date(),
    },
  ];

  getTrades(): Trade[] {
    return this.trades;
  }

  getTradeById(id: string): Trade | undefined {
    return this.trades.find(trade => trade.id === id);
  }
}

