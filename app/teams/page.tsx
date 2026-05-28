'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, Player, getFlag, skillColor, initials, balanceTeams, TEAM_NAMES, TEAM_COLORS } from '@/lib/supabase'
import Nav from '@/components/Nav'

type TeamData = { name: string; color: string; players: Player[] }

export default function TeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<TeamData[]>([])
  const [dragPlayer, setDragPlayer] = useState<{ player: Player; fromTeam: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/auth'); return }
      loadTeams()
    })
  }, [router])

  function loadTeams() {
    const raw = localStorage.getItem('lastTeams')
    if (!raw) { setLoading(false); return }
    const { teams: playerArrays } = JSON.parse(raw)
    setTeams(playerArrays.map((players: Player[], i: number) => ({
      name: TEAM_NAMES[i],
      color: TEAM_COLORS[i],
      players
    })))
    setLoading(false)
  }

  function handleDrop(toTeamIndex: number) {
    if (!dragPlayer) return
    if (dragPlayer.fromTeam === toTeamIndex) { setDragPlayer(null); return }

    setTeams(prev => {
      const next = prev.map(t => ({ ...t, players: [...t.players] }))
      next[dragPlayer.fromTeam].players = next[dragPlayer.fromTeam].players.filter(p => p.id !== dragPlayer.player.id)
      next[toTeamIndex].players.push(dragPlayer.player)
      return next
    })
    setDragPlayer(null)
  }

  function shareWhatsApp() {
    const text = teams.map(t => `${t.name}:\n${t.players.map(p => `• ${p.name}`).join('\n')}`).join('\n\n')
    window.open(`https://wa.me/?text=${encodeURIComponent(`⚽ Thursday Soccer\n\n${text}`)}`)
  }

  function regenerate() {
    const raw = localStorage.getItem('lastTeams')
    if (!raw) return
    const { teams: playerArrays } = JSON.parse(raw)
    const pool: Player[] = playerArrays.flat()
    const balanced = balanceTeams(pool, playerArrays.length)
    localStorage.setItem('lastTeams', JSON.stringify({ teams: balanced, sessionId: JSON.parse(raw).sessionId }))
    loadTeams()
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>

  if (teams.length === 0) return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="px-4 pt-8 text-center">
        <div className="text-5xl mb-4">👕</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">No teams yet</h1>
        <p className="text-gray-400 text-sm mb-6">Go to Weekly to select players and generate teams.</p>
        <button onClick={() => router.push('/weekly')} className="bg-green-500 text-white font-medium px-6 py-3 rounded-xl btn-touch">Go to Weekly →</button>
      </div>
      <Nav />
    </div>
  )

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-6 pb-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Teams</h1>
          <div className="flex gap-2">
            <button onClick={regenerate} className="text-sm border border-gray-200 bg-white text-gray-600 font-medium px-3 py-1.5 rounded-xl btn-touch">🔀 Reshuffle</button>
            <button onClick={shareWhatsApp} className="text-sm bg-green-500 text-white font-medium px-3 py-1.5 rounded-xl btn-touch">📱 Share</button>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Drag players between teams to swap them</p>
      </div>

      <div className="px-4 space-y-3">
        {teams.map((team, ti) => {
          const avgSkill = (team.players.reduce((s, p) => s + p.skill, 0) / team.players.length).toFixed(1)
          const avgAge = Math.round(team.players.reduce((s, p) => s + p.age, 0) / team.players.length)
const nats = Array.from(new Set(team.players.map(p => p.nationality)))
          return (
            <div
              key={ti}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(ti)}
            >
              <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: team.color + '18' }}>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }}></div>
                  <span className="font-bold text-gray-900">{team.name}</span>
                  <span className="text-xs text-gray-400">{team.players.length} players</span>
                </div>
                <div className="text-xs text-gray-500 flex gap-2">
                  <span>⭐ {avgSkill}</span>
                  <span>👤 {avgAge}</span>
                </div>
              </div>

              <div className="px-4 py-2">
                {team.players.map(p => (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={() => setDragPlayer({ player: p, fromTeam: ti })}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-grab active:opacity-50"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: skillColor(p.skill) }}>
                      {initials(p.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">{getFlag(p.nationality)} · Age {p.age}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-lg flex-shrink-0" style={{ backgroundColor: skillColor(p.skill) + '22', color: skillColor(p.skill) }}>S{p.skill}</span>
                  </div>
                ))}

                <div className="flex gap-1 py-2 flex-wrap">
                  {nats.map(n => <span key={n} className="text-xs bg-gray-50 text-gray-500 px-2 py-0.5 rounded-lg">{getFlag(n)} {n}</span>)}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Nav />
    </div>
  )
}
