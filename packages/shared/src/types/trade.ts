export interface Trade {
  id: string,
  externalId: string,
  exchange: 'binance' | 'coinbase' | 'kraken',
  baseAsset: string,
  quoteAsset: string,
  side: 'BUY' | 'SELL',
  amount: string,
  price: string,
  timestamp: Date,
  fee?: string,
  feeAsset?: string
}

