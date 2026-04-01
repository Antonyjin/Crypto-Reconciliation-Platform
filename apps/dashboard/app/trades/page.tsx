'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface Trade {
  id: string
  externalId: string
  exchange: string
  baseAsset: string
  quoteAsset: string
  side: string
  amount: string
  price: string
  timestamp: string
}

export default function TradesPage() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [exchangeFilter, setExchangeFilter] = useState('')
  const [sideFilter, setSideFilter] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (exchangeFilter) params.set('exchange', exchangeFilter)
    if (sideFilter) params.set('side', sideFilter)

    setLoading(true)
    fetch(`${API}/trades?${params}`)
      .then(res => res.json())
      .then(data => {
        setTrades(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [exchangeFilter, sideFilter])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trades</h1>
          <p className="text-sm text-gray-500 mt-1">{trades.length} trades found</p>
        </div>
        <div className="flex gap-3">
          <select
            value={exchangeFilter}
            onChange={(e) => setExchangeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">All exchanges</option>
            <option value="binance">Binance</option>
            <option value="coinbase">Coinbase</option>
            <option value="kraken">Kraken</option>
          </select>
          <select
            value={sideFilter}
            onChange={(e) => setSideFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">All sides</option>
            <option value="BUY">BUY</option>
            <option value="SELL">SELL</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-400 text-lg mb-2">No trades found</p>
            <p className="text-gray-400 text-sm">Ingest some trades or adjust your filters</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Exchange</th>
                <th className="px-4 py-3">Pair</th>
                <th className="px-4 py-3">Side</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trades.map((trade, i) => (
                <tr key={trade.id} className={`hover:bg-gray-50 transition ${i % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {trade.exchange}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{trade.baseAsset}/{trade.quoteAsset}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      trade.side === 'BUY'
                        ? 'bg-green-50 text-green-700'
                        : 'bg-red-50 text-red-700'
                    }`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{trade.amount}</td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{trade.price}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(trade.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
