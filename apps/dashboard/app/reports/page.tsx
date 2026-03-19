'use client'

import { useEffect, useState } from 'react'

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
  csvData: any
  dbData: any
}

interface ReportDetail extends ReportSummary {
  items: ReportItem[]
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([])
  const [selectedReport, setSelectedReport] = useState<ReportDetail | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')

  const fetchReports = () => {
    fetch('http://localhost:3000/reconciliation/reports')
      .then(res => res.json())
      .then(data => setReports(data))
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setMessage('')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:3000/reconciliation/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      setMessage(`Reconciliation done — Matched: ${data.summary.matched}, Mismatched: ${data.summary.mismatched}, Missing: ${data.summary.missing}`)
      fetchReports()
    } catch (err) {
      setMessage('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const viewReport = (id: string) => {
    fetch(`http://localhost:3000/reconciliation/reports/${id}`)
      .then(res => res.json())
      .then(data => setSelectedReport(data))
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reconciliation Reports</h1>

      {/* Upload CSV */}
      <div className="bg-white rounded-lg border p-6 mb-8 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Upload CSV</h2>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="mb-4 block"
        />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-gray-900 text-white rounded p-2 px-4 hover:bg-gray-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Reconcile'}
        </button>
        {message && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">{message}</div>
        )}
      </div>

      {/* Reports list */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">History</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Date</th>
              <th className="p-3">Total</th>
              <th className="p-3">Matched</th>
              <th className="p-3">Mismatched</th>
              <th className="p-3">Missing</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {reports.map(report => (
              <tr key={report.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{new Date(report.date).toLocaleString()}</td>
                <td className="p-3">{report.total}</td>
                <td className="p-3 text-green-600">{report.matchedCount}</td>
                <td className="p-3 text-orange-600">{report.mismatchedCount}</td>
                <td className="p-3 text-red-600">{report.missingCount}</td>
                <td className="p-3">
                  <button
                    onClick={() => viewReport(report.id)}
                    className="text-blue-600 hover:underline"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Report detail */}
      {selectedReport && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              Report — {new Date(selectedReport.date).toLocaleString()}
            </h2>
            <button
              onClick={() => setSelectedReport(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3">Status</th>
                <th className="p-3">External ID</th>
                <th className="p-3">Exchange</th>
                <th className="p-3">CSV Amount</th>
                <th className="p-3">DB Amount</th>
              </tr>
            </thead>
            <tbody>
              {selectedReport.items.map(item => (
                <tr key={item.id} className="border-b">
                  <td className={`p-3 font-bold ${
                    item.status === 'matched' ? 'text-green-600' :
                    item.status === 'mismatched' ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {item.status}
                  </td>
                  <td className="p-3">{item.csvData?.externalId}</td>
                  <td className="p-3">{item.csvData?.exchange}</td>
                  <td className="p-3">{item.csvData?.amount}</td>
                  <td className="p-3">{item.dbData?.amount || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
