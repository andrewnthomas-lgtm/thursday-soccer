import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type Player = {
  id: string
  name: string
  age: number
  nationality: string
  skill: number
  notes: string
  active: boolean
  created_at: string
}

export type Session = {
  id: string
  date: string
  team_size: number
  label: string
  created_at: string
}

export type Team = {
  id: string
  session_id: string
  name: string
  color: string
  player_ids: string[]
}

export const TEAM_COLORS = ['#22c55e', '#3b82f6', '#f97316', '#ec4899', '#a855f7']
export const TEAM_NAMES = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E']

export const FLAGS: Record<string, string> = {
  Brazil: '🇧🇷', Spain: '🇪🇸', France: '🇫🇷', Germany: '🇩🇪',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Argentina: '🇦🇷', Portugal: '🇵🇹', Mexico: '🇲🇽',
  Italy: '🇮🇹', Cambodia: '🇰🇭', Japan: '🇯🇵', Korea: '🇰🇷',
  Nigeria: '🇳🇬', Ghana: '🇬🇭', Australia: '🇦🇺', USA: '🇺🇸',
  Canada: '🇨🇦', Netherlands: '🇳🇱', Belgium: '🇧🇪', Morocco: '🇲🇦',
}

export function getFlag(nationality: string) {
  return FLAGS[nationality] || '🏳️'
}

export function skillColor(skill: number) {
  return ['', '#ef4444', '#f97316', '#94a3b8', '#22c55e', '#3b82f6'][skill]
}

export function initials(name: string) {
  return name.split(' ').map((x: string) => x[0]).join('').toUpperCase().slice(0, 2)
}

export function balanceTeams(pool: Player[], numTeams: number): Player[][] {
  let best: Player[][] | null = null
  let bestScore = Infinity

  for (let iter = 0; iter < 800; iter++) {
    const shuffled = [...pool].sort(() => Math.random() - 0.5)
    const teams: Player[][] = Array.from({ length: numTeams }, () => [])
    const sorted = [...shuffled].sort((a, b) => b.skill - a.skill)
    sorted.forEach((p, i) => teams[i % numTeams].push(p))
    const score = scoreTeams(teams)
    if (score < bestScore) {
      bestScore = score
      best = teams.map(t => [...t])
    }
  }
  return best!
}

function scoreTeams(teams: Player[][]): number {
  const skills = teams.map(t => t.reduce((s, p) => s + p.skill, 0) / t.length)
  const ages = teams.map(t => t.reduce((s, p) => s + p.age, 0) / t.length)
  const nats = teams.map(t => new Set(t.map(p => p.nationality)).size)
  const skillVar = Math.max(...skills) - Math.min(...skills)
  const ageVar = Math.max(...ages) - Math.min(...ages)
  const natVar = Math.max(...nats) - Math.min(...nats)
  return skillVar * 10 + ageVar * 0.5 + natVar * 2
}
