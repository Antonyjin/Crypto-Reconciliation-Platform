'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/trades', label: 'Trades' },
  { href: '/reports', label: 'Reports' },
  { href: '/ingestion', label: 'Ingestion' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-900 text-white px-6 py-4 shadow-lg">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="text-xl font-bold tracking-tight hover:text-gray-200 transition">
          Crypto Recon
        </Link>
        <div className="flex gap-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                pathname === link.href
                  ? 'bg-white/15 text-white'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
