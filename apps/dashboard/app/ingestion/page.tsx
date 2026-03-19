'use client'

import { useState } from 'react'

export default function IngestionPage() {
  const [exchange, setExchange] = useState('binance')
  const [symbol, setSymbol] = useState('BTC-USDT')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleIngest = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const res = await fetch(`http://localhost:3001/${exchange}/ingest?symbol=${symbol}`, {
        method: 'POST',
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Ingestion failed')
      } else {
        setResult(data)
      }
    } catch (err) {
      setError('Failed to connect to ingestion service')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ingestion</h1>

      <div className="bg-white rounded-lg border p-6 max-w-md">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Exchange</label>
          <select
            value={exchange}
            onChange={(e) => setExchange(e.target.value)}
            className="w-full border rounded p-2"
          >
            <option value="binance">Binance</option>
            <option value="coinbase">Coinbase</option>
            <option value="kraken">Kraken</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Symbol</label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="BTC-USDT"
          />
        </div>

        <button
          onClick={handleIngest}
          disabled={loading}
          className="w-full bg-gray-900 text-white rounded p-2 hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Ingesting...' : 'Start Ingestion'}
        </button>

        {result && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            Saved: {result.saved} | Failed: {result.failed}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
