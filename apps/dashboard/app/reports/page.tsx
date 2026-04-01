'use client'

import { useEffect, useState } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

interface ReportSummary {
  id: string
  date: string
  total: number
  matchedCount: number
  mismatchedCount: number
  missingCount: number
}

interface ReportItem {
  id: string
  status: string
  matchType: string | null
  confidence: number | null
  csvData: any
  dbData: any
}

interface ReportDetail extends ReportSummary {
  items: ReportItem[]
}

function ConfidenceBar({ value }: { value: number | null }) {
  if (value === null) return <span className="text-gray-400 text-sm">--</span>

  let color = 'bg-red-500'
  if (value >= 80) color = 'bg-green-500'
  else if (value >= 50) color = 'bg-yellow-500'
  else if (value >= 30) color = 'bg-orange-500'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-[80px]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs font-mono text-gray-600 w-8">{value}%</span>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    matched: 'bg-green-50 text-green-700 border-green-200',
    mismatched: 'bg-orange-50 text-orange-700 border-orange-200',
    missing: 'bg-red-50 text-red-700 border-red-200',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
      {status}
    </span>
  )
}

function MatchTypeBadge({ matchType }: { matchType: string | null }) {
  if (!matchType) return null

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      matchType === 'exact'
        ? 'bg-blue-50 text-blue-700'
        : 'bg-purple-50 text-purple-700'
    }`}>
      {matchType}
    </span>
  )
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchReports = () => {
    fetch(`${API}/reconciliation/reports`)
      .then(res => res.json())
      .then(data => {
        setReports(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setMessage(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API}/reconciliation/upload`, {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setMessage({
        type: 'success',
        text: `Matched: ${data.summary.matched} | Mismatched: ${data.summary.mismatched} | Missing: ${data.summary.missing}`,
      })
      setFile(null)
      fetchReports()
    } catch {
      setMessage({ type: 'error', text: 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  const viewReport = (id: string) => {
    fetch(`${API}/reconciliation/reports/${id}`)
      .then(res => res.json())
      .then(data => setSelectedReport(data))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Reconciliation Reports</h1>
        <p className="text-sm text-gray-500 mt-1">Upload CSV files and compare with database trades</p>
      </div>

      {/* Upload CSV */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8 max-w-lg">
        <h2 className="text-base font-semibold mb-4">Upload CSV</h2>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center mb-4">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-900 file:text-white hover:file:bg-gray-800 file:cursor-pointer"
          />
          {file && <p className="text-sm text-gray-500 mt-2">{file.name}</p>}
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {uploading ? 'Reconciling...' : 'Reconcile'}
        </button>
        {message && (
          <div className={`mt-4 rounded-lg border p-4 text-sm ${
            message.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-700'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {message.text}
          </div>
        )}
      </div>

      {/* Reports list */}
      <div className="mb-8">
        <h2 className="text-base font-semibold mb-4">History</h2>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="skeleton h-10 w-full" />
              ))}
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-lg mb-2">No reports yet</p>
              <p className="text-gray-400 text-sm">Upload a CSV file to create your first reconciliation report</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3 text-right">Matched</th>
                  <th className="px-4 py-3 text-right">Mismatched</th>
                  <th className="px-4 py-3 text-right">Missing</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reports.map(report => {
                  const matchRate = report.total > 0
                    ? Math.round((report.matchedCount / report.total) * 100)
                    : 0

                  return (
                    <tr key={report.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3 text-sm">{new Date(report.date).toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{report.total}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-green-600">{report.matchedCount}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-orange-600">{report.mismatchedCount}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-red-600">{report.missingCount}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <span className={`text-xs font-medium ${
                            matchRate >= 80 ? 'text-green-600' :
                            matchRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {matchRate}% match
                          </span>
                          <button
                            onClick={() => viewReport(report.id)}
                            className="text-sm text-gray-900 font-medium hover:underline"
                          >
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Report detail */}
      {selectedReport && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-base font-semibold">
                Report — {new Date(selectedReport.date).toLocaleString()}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {selectedReport.total} trades | {selectedReport.matchedCount} matched | {selectedReport.mismatchedCount} mismatched | {selectedReport.missingCount} missing
              </p>
            </div>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-gray-400 hover:text-gray-600 transition text-xl leading-none"
            >
              &times;
            </button>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Match</th>
                <th className="px-4 py-3">Confidence</th>
                <th className="px-4 py-3">External ID</th>
                <th className="px-4 py-3">Exchange</th>
                <th className="px-4 py-3 text-right">CSV Amount</th>
                <th className="px-4 py-3 text-right">DB Amount</th>
                <th className="px-4 py-3 text-right">CSV Price</th>
                <th className="px-4 py-3 text-right">DB Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {selectedReport.items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3"><StatusBadge status={item.status} /></td>
                  <td className="px-4 py-3"><MatchTypeBadge matchType={item.matchType} /></td>
                  <td className="px-4 py-3"><ConfidenceBar value={item.confidence} /></td>
                  <td className="px-4 py-3 font-mono text-sm">{item.csvData?.externalId}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                      {item.csvData?.exchange}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{item.csvData?.amount}</td>
                  <td className={`px-4 py-3 text-right font-mono text-sm ${
                    item.dbData?.amount && item.csvData?.amount !== item.dbData?.amount ? 'text-red-600 font-bold' : ''
                  }`}>
                    {item.dbData?.amount || '--'}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-sm">{item.csvData?.price}</td>
                  <td className={`px-4 py-3 text-right font-mono text-sm ${
                    item.dbData?.price && item.csvData?.price !== item.dbData?.price ? 'text-red-600 font-bold' : ''
                  }`}>
                    {item.dbData?.price || '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
