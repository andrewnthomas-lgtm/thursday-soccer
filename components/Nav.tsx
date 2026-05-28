'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Nav() {
  const pathname = usePathname()
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth')
  }

  const links = [
    { href: '/players', label: 'Players', icon: '👥' },
    { href: '/weekly', label: 'Weekly', icon: '📅' },
    { href: '/teams', label: 'Teams', icon: '👕' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
      <div className="flex max-w-lg mx-auto">
        {links.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors btn-touch ${
              pathname === l.href ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <span className="text-xl mb-0.5">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <button
          onClick={signOut}
          className="flex-1 flex flex-col items-center py-3 text-xs font-medium text-gray-400 btn-touch"
        >
          <span className="text-xl mb-0.5">🚪</span>
          Sign out
        </button>
      </div>
    </nav>
  )
}
