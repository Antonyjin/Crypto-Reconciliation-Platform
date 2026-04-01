'use client'

import { useState } from 'react'

const INGESTION_API = process.env.NEXT_PUBLIC_INGESTION_URL || 'http://localhost:3001'

const exchanges = [
  { value: 'binance', label: 'Binance', defaultSymbol: 'BTC-USDT' },
  { value: 'coinbase', label: 'Coinbase', defaultSymbol: 'BTC-USD' },
  { value: 'kraken', label: 'Kraken', defaultSymbol: 'BTC-USD' },
]

export default function IngestionPage() {
  const [exchange, setExchange] = useState('binance')
  const [symbol, setSymbol] = useState('BTC-USDT')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleExchangeChange = (value: string) => {
    setExchange(value)
    const ex = exchanges.find(e => e.value === value)
    if (ex) setSymbol(ex.defaultSymbol)
  }

  const handleIngest = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`${INGESTION_API}/${exchange}/ingest?symbol=${symbol}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Ingestion failed')
      } else {
        setResult(data)
      }
    } catch {
      setError('Failed to connect to ingestion service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Ingestion</h1>
        <p className="text-sm text-gray-500 mt-1">Fetch trades from exchanges and save them to the database</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 max-w-lg">
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Exchange</label>
          <div className="grid grid-cols-3 gap-2">
            {exchanges.map(ex => (
              <button
                key={ex.value}
                type="button"
                onClick={() => handleExchangeChange(ex.value)}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium border transition ${
                  exchange === ex.value
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="BTC-USDT"
          />
        </div>

        <button
          onClick={handleIngest}
          disabled={loading || !symbol}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Ingesting...
            </span>
          ) : 'Start Ingestion'}
        </button>

        {result && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-800">Ingestion complete</p>
            <div className="flex gap-6 mt-2">
              <div>
                <p className="text-2xl font-bold text-green-700">{result.saved}</p>
                <p className="text-xs text-green-600">saved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-700">{result.failed}</p>
                <p className="text-xs text-red-600">failed</p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}
