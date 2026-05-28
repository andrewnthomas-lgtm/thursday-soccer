'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient, Player, getFlag, skillColor, initials } from '@/lib/supabase'
import Nav from '@/components/Nav'

export default function PlayersPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Player | null>(null)
  const [form, setForm] = useState({ name: '', age: '', nationality: '', skill: '3', notes: '' })

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

  async function savePlayer() {
    if (!form.name || !form.age || !form.nationality) return alert('Please fill in name, age, and nationality')
    const supabase = createClient()
    const payload = { name: form.name, age: parseInt(form.age), nationality: form.nationality, skill: parseInt(form.skill), notes: form.notes }
    if (editing) {
      await supabase.from('players').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('players').insert([{ ...payload, active: true }])
    }
    setShowModal(false)
    setEditing(null)
    setForm({ name: '', age: '', nationality: '', skill: '3', notes: '' })
    fetchPlayers()
  }

  async function deletePlayer(id: string) {
    if (!confirm('Remove this player from the roster?')) return
    const supabase = createClient()
    await supabase.from('players').update({ active: false }).eq('id', id)
    fetchPlayers()
  }

  function openEdit(p: Player) {
    setEditing(p)
    setForm({ name: p.name, age: String(p.age), nationality: p.nationality, skill: String(p.skill), notes: p.notes })
    setShowModal(true)
  }

  function openAdd() {
    setEditing(null)
    setForm({ name: '', age: '', nationality: '', skill: '3', notes: '' })
    setShowModal(true)
  }

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.nationality.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-lg mx-auto pb-24">
      <div className="sticky top-0 bg-gray-50 z-10 px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-gray-900">Players <span className="text-gray-400 font-normal text-base">({players.length})</span></h1>
          <button onClick={openAdd} className="bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-xl btn-touch">+ Add player</button>
        </div>
        <input
          type="search"
          placeholder="Search players..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      <div className="px-4 space-y-2">
        {loading && <p className="text-center text-gray-400 py-8">Loading...</p>}
        {!loading && filtered.length === 0 && <p className="text-center text-gray-400 py-8">No players found</p>}
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white" style={{ backgroundColor: skillColor(p.skill) }}>
              {initials(p.name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{p.name}</p>
              <p className="text-xs text-gray-400">{getFlag(p.nationality)} {p.nationality} · Age {p.age}{p.notes ? ` · ${p.notes}` : ''}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: skillColor(p.skill) + '22', color: skillColor(p.skill) }}>S{p.skill}</span>
              <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-600 p-1">✏️</button>
              <button onClick={() => deletePlayer(p.id)} className="text-gray-400 hover:text-red-500 p-1">🗑️</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-gray-900 mb-4">{editing ? 'Edit player' : 'Add player'}</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Full name</label>
                <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g. Carlos Silva" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Age</label>
                  <input type="number" value={form.age} onChange={e => setForm({...form, age: e.target.value})} placeholder="28" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Skill (1–5)</label>
                  <select value={form.skill} onChange={e => setForm({...form, skill: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Nationality</label>
                <input value={form.nationality} onChange={e => setForm({...form, nationality: e.target.value})} placeholder="e.g. Brazil" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Notes (optional)</label>
                <input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="e.g. goalkeeper" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400" />
              </div>
            </div>
            <div className="flex gap-3 mt-5 mb-8">
              <button onClick={() => setShowModal(false)} className="flex-1 border border-gray-200 text-gray-600 font-medium py-3 rounded-xl btn-touch">Cancel</button>
              <button onClick={savePlayer} className="flex-1 bg-green-500 text-white font-medium py-3 rounded-xl btn-touch">Save</button>
            </div>
          </div>
        </div>
      )}

      <Nav />
    </div>
  )
}
