'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function HomePage() {
  const [tradeCount, setTradeCount] = useState(0)
  const [reportCount, setReportCount] = useState(0)

  useEffect(() => {
    fetch('http://localhost:3000/trades')
      .then(res => res.json())
      .then(data => setTradeCount(data.length))

    fetch('http://localhost:3000/reconciliation/reports')
      .then(res => res.json())
      .then(data => setReportCount(data.length))
  }, [])

  return (
    <div>
      <h1 className="text-3xl font-bold mb-2">Crypto Reconciliation Platform</h1>
      <p className="text-gray-500 mb-8">Multi-exchange trade ingestion and reconciliation</p>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Total Trades</p>
          <p className="text-3xl font-bold">{tradeCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Reports</p>
          <p className="text-3xl font-bold">{reportCount}</p>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <p className="text-gray-500 text-sm">Exchanges</p>
          <p className="text-3xl font-bold">3</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Link href="/ingestion" className="bg-white rounded-lg border p-6 hover:border-gray-400 transition">
          <h2 className="text-lg font-semibold mb-2">Ingest Trades</h2>
          <p className="text-gray-500">Fetch trades from Binance, Coinbase, or Kraken</p>
        </Link>
        <Link href="/reports" className="bg-white rounded-lg border p-6 hover:border-gray-400 transition">
          <h2 className="text-lg font-semibold mb-2">Reconciliation</h2>
          <p className="text-gray-500">Upload a CSV and compare with database trades</p>
        </Link>
      </div>
    </div>
  )
}
