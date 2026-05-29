'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, Player, getFlag, skillColor, fitnessColor, balanceTeams, TEAM_NAMES, TEAM_COLORS } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function WeeklyPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [guests, setGuests] = useState<Player[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [teamSize, setTeamSize] = useState(5)
  const [loading, setLoading] = useState(true)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [guestForm, setGuestForm] = useState({ name: '', skill: '3', fitness: '3' })

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

  function selectAll() { setSelected(new Set([...players.map(p => p.id), ...guests.map(g => g.id)])) }
  function clearAll() { setSelected(new Set()) }

  function addGuest() {
    if (!guestForm.name.trim()) return alert('Please enter a name')
    const guest: Player = {
      id: `guest-${Date.now()}`,
      name: guestForm.name.trim() + ' (Guest)',
      age: 25,
      nationality: 'Guest',
      skill: parseInt(guestForm.skill),
      fitness: parseInt(guestForm.fitness),
      notes: 'Guest player',
      active: true,
      created_at: new Date().toISOString(),
      isGuest: true
    }
    setGuests(prev => [...prev, guest])
    setSelected(prev => new Set([...prev, guest.id]))
    setGuestForm({ name: '', skill: '3', fitness: '3' })
    setShowGuestModal(false)
  }

  function removeGuest(id: string) {
    setGuests(prev => prev.filter(g => g.id !== id))
    setSelected(prev => { const next = new Set(prev); next.delete(id); return next })
  }

  async function generateTeams() {
    if (selected.size < 2) return alert('Select at least 2 players')
    const allPlayers = [...players, ...guests]
    const pool = allPlayers.filter(p => selected.has(p.id))
    const numTeams = Math.ceil(pool.length / teamSize)
    const balanced = balanceTeams(pool, numTeams)

    const supabase = createClient()
    const { data: session } = await supabase.from('sessions').insert([{
      date: new Date().toISOString().split('T')[0],
      team_size: teamSize,
      label: `${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`
    }]).select().single()

    if (!session) return alert('Error saving session')

    const realPlayers = pool.filter(p => !p.isGuest)
    if (realPlayers.length > 0) {
      await supabase.from('session_players').insert(
        realPlayers.map(p => ({ session_id: session.id, player_id: p.id }))
      )
    }

    await supabase.from('teams').insert(
      balanced.map((team, i) => ({
        session_id: session.id,
        name: TEAM_NAMES[i],
        color: TEAM_COLORS[i],
        player_ids: team.filter(p => !p.isGuest).map(p => p.id)
      }))
    )

    localStorage.setItem('lastTeams', JSON.stringify({ teams: balanced, sessionId: session.id }))
    router.push('/teams')
  }

  const allPlayers = [...players, ...guests]
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
          <div className="flex gap-3 items-center">
            <button onClick={selectAll} className="text-xs text-green-600 font-medium">All</button>
            <span className="text-gray-300">|</span>
            <button onClick={clearAll} className="text-xs text-gray-400 font-medium">None</button>
            <span className="text-gray-300">|</span>
            <button onClick={() => setShowGuestModal(true)} className="text-xs text-blue-500 font-medium">+ Guest</button>
          </div>
        </div>

        {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}

        <div className="space-y-2 mb-4">
          {allPlayers.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border px-4 py-3 flex items-center gap-3 transition-all ${
                selected.has(p.id) ? 'border-green-400 bg-green-50' : 'border-gray-100'
              } ${p.isGuest ? 'border-dashed' : ''}`}
            >
              <div
                onClick={() => toggle(p.id)}
                className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                  selected.has(p.id) ? 'bg-green-500 border-green-500' : 'border-gray-300'
                }`}
              >
                {selected.has(p.id) && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0" onClick={() => toggle(p.id)} style={{cursor:'pointer'}}>
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {p.name} {p.isGuest && <span className="text-xs text-blue-400 font-normal">guest</span>}
                </p>
                <p className="text-xs text-gray-400">{p.isGuest ? '👤 Guest player' : `${getFlag(p.nationality)} ${p.nationality} · Age ${p.age}`}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: skillColor(p.skill) + '22', color: skillColor(p.skill) }}>⚽{p.skill}</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: fitnessColor(p.fitness || 3) + '22', color: fitnessColor(p.fitness || 3) }}>🏃{p.fitness || 3}</span>
                {p.isGuest && (
                  <button onClick={() => removeGuest(p.id)} className="text-gray-300 hover:text-red-400 ml-1 text-xs">✕</button>
                )}
              </div>
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

      {showGuestModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowGuestModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-1">Add guest player</h2>
            <p className="text-xs text-gray-400 mb-4">Guest players are for this week only and won't be saved to the roster.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Name</label>
                <input
                  value={guestForm.name}
                  onChange={e => setGuestForm({...guestForm, name: e.target.value})}
                  placeholder="e.g. Dave"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">⚽ Skill (1–5)</label>
                  <select value={guestForm.skill} onChange={e => setGuestForm({...guestForm, skill: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">🏃 Fitness (1–5)</label>
                  <select value={guestForm.fitness} onChange={e => setGuestForm({...guestForm, fitness: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowGuestModal(false)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl btn-touch">Cancel</button>
              <button onClick={addGuest} className="flex-1 bg-blue-500 text-white font-medium py-3 rounded-xl btn-touch">Add guest</button>
            </div>
          </div>
        </div>
      )}

      <Nav />
    </div>
  )
}
