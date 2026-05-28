'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, Player, getFlag, skillColor, balanceTeams, TEAM_NAMES, TEAM_COLORS } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function WeeklyPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [teamSize, setTeamSize] = useState(5)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/auth')
      else fetchPlayers()
    })
  }, [router])

  async function fetchPlayers() {
    const supabase = createClient()
    const { data } = await supabase.from('players').select('*').eq('active', true).order('name')
    setPlayers(data || [])
    setLoading(false)
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() { setSelected(new Set(players.map(p => p.id))) }
  function clearAll() { setSelected(new Set()) }

  async function generateTeams() {
    if (selected.size < 2) return alert('Select at least 2 players')
    const pool = players.filter(p => selected.has(p.id))
    const numTeams = Math.ceil(pool.length / teamSize)
    const balanced = balanceTeams(pool, numTeams)

    const supabase = createClient()

    // Save session
    const { data: session } = await supabase.from('sessions').insert([{
      date: new Date().toISOString().split('T')[0],
      team_size: teamSize,
      label: `${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`
    }]).select().single()

    if (!session) return alert('Error saving session')

    // Save session players
    await supabase.from('session_players').insert(
      pool.map(p => ({ session_id: session.id, player_id: p.id }))
    )

    // Save teams
    await supabase.from('teams').insert(
      balanced.map((team, i) => ({
        session_id: session.id,
        name: TEAM_NAMES[i],
        color: TEAM_COLORS[i],
        player_ids: team.map(p => p.id)
      }))
    )

    // Store in localStorage for immediate display
    localStorage.setItem('lastTeams', JSON.stringify({ teams: balanced, sessionId: session.id }))
    router.push('/teams')
  }

  const numTeams = Math.ceil(selected.size / teamSize)

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold text-gray-900 mb-1">This week</h1>
        <p className="text-sm text-gray-400">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
      </div>

      <div className="px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Players per team</label>
            <span className="text-lg font-bold text-green-600">{teamSize}</span>
          </div>
          <input type="range" min="3" max="8" value={teamSize} onChange={e => setTeamSize(parseInt(e.target.value))}
            className="w-full accent-green-500" />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>3</span><span>8</span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{selected.size}</span> selected
            {selected.size >= 2 && <span className="text-green-600 ml-2">→ {numTeams} team{numTeams > 1 ? 's' : ''}</span>}
          </p>
          <div className="flex gap-2">
            <button onClick={selectAll} className="text-xs text-green-600 font-medium">All</button>
            <span className="text-gray-300">|</span>
            <button onClick={clearAll} className="text-xs text-gray-400 font-medium">None</button>
          </div>
        </div>

        {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

        <div className="space-y-2 mb-4">
          {players.map(p => (
            <div
              key={p.id}
              onClick={() => toggle(p.id)}
              className={`bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition-all ${
                selected.has(p.id) ? 'border-green-400 bg-green-50' : 'border-gray-100'
              }`}
            >
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                selected.has(p.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'
              }`}>
                {selected.has(p.id) && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400">{getFlag(p.nationality)} {p.nationality} · Age {p.age}</p>
              </div>
              <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: skillColor(p.skill) + '22', color: skillColor(p.skill) }}>S{p.skill}</span>
            </div>
          ))}
        </div>

        <button
          onClick={generateTeams}
          disabled={selected.size < 2}
          className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-bold py-4 rounded-2xl btn-touch text-base transition-colors"
        >
          ✨ Generate balanced teams
        </button>
      </div>

      <Nav />
    </div>
  )
}
