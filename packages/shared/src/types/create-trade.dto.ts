export interface CreateTradeDto {
  exchange: 'binance' | 'coinbase' | 'kraken';
  baseAsset: string;
  quoteAsset: string;
  side: 'BUY' | 'SELL';
  amount: string;
  fee?: string;
  feeAsset?: string;
}
