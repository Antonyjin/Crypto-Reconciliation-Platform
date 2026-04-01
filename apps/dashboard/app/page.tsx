'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export default function HomePage() {
  const [tradeCount, setTradeCount] = useState<number | null>(null)
  const [reportCount, setReportCount] = useState<number | null>(null)

  useEffect(() => {
    fetch(`${API}/trades`)
      .then(res => res.json())
      .then(data => setTradeCount(data.length))
      .catch(() => setTradeCount(0))

    fetch(`${API}/reconciliation/reports`)
      .then(res => res.json())
      .then(data => setReportCount(data.length))
      .catch(() => setReportCount(0))
  }, [])

  const loading = tradeCount === null || reportCount === null

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-1">Multi-exchange trade ingestion and reconciliation</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Total Trades</p>
            <span className="text-lg">&#x1F4CA;</span>
          </div>
          {loading ? (
            <div className="skeleton h-8 w-16" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{tradeCount}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Reports</p>
            <span className="text-lg">&#x1F4DD;</span>
          </div>
          {loading ? (
            <div className="skeleton h-8 w-16" />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{reportCount}</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500">Exchanges</p>
            <span className="text-lg">&#x1F310;</span>
          </div>
          <p className="text-3xl font-bold tracking-tight">3</p>
          <p className="text-xs text-gray-400 mt-1">Binance, Coinbase, Kraken</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/ingestion"
          className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">&#x26A1;</span>
            <h2 className="text-lg font-semibold group-hover:text-gray-700">Ingest Trades</h2>
          </div>
          <p className="text-gray-500 text-sm">Fetch trades from Binance, Coinbase, or Kraken and save them to the database</p>
        </Link>
        <Link
          href="/reports"
          className="group bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">&#x1F50D;</span>
            <h2 className="text-lg font-semibold group-hover:text-gray-700">Reconciliation</h2>
          </div>
          <p className="text-gray-500 text-sm">Upload a CSV file and compare with database trades using confidence scoring</p>
        </Link>
      </div>
    </div>
  )
}
