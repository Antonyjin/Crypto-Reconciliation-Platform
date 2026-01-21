export interface Trade {
  id: string,
  exchange: 'binance' | 'coinbase' | 'kraken',
  baseAsset: string,
  quoteAsset: string,
  side: 'BUY' | 'SELL',
  amount: string,
  timestamp: Date,
  fee?: string,
  feeAsset?: string
}
