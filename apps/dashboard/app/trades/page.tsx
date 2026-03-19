'use client'

import { useEffect, useState } from 'react'

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

  useEffect(() => {
    fetch('http://localhost:3000/trades')
      .then(res => res.json())
      .then(data => {
        setTrades(data)
        setLoading(false)
      })
  }, [])

  if (loading) return <p>Loading...</p>

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trades</h1>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="p-3">Exchange</th>
            <th className="p-3">Pair</th>
            <th className="p-3">Side</th>
            <th className="p-3">Amount</th>
            <th className="p-3">Price</th>
            <th className="p-3">Date</th>
          </tr>
        </thead>
        <tbody>
          {trades.map(trade => (
            <tr key={trade.id} className="border-b hover:bg-gray-50">
              <td className="p-3">{trade.exchange}</td>
              <td className="p-3">{trade.baseAsset}/{trade.quoteAsset}</td>
              <td className={`p-3 font-bold ${trade.side === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                {trade.side}
              </td>
              <td className="p-3">{trade.amount}</td>
              <td className="p-3">{trade.price}</td>
              <td className="p-3">{new Date(trade.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
