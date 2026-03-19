import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-gray-900 text-white px-6 py-4">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold">
          Crypto Recon
        </Link>
        <div className="flex gap-6">
          <Link href="/trades" className="hover:text-gray-300">Trades</Link>
          <Link href="/reports" className="hover:text-gray-300">Reports</Link>
          <Link href="/ingestion" className="hover:text-gray-300">Ingestion</Link>
        </div>
      </div>
    </nav>
  )
}
