const STATS_KEY = 'spelling-bee-mischief-stats'

export interface MischiefStats {
  peekCount: number
  wrongCount: number
  deletePresses: number
  highlightSessions: number
}

function getStatsKey(userId: string | null): string {
  return userId ? `${STATS_KEY}-${userId}` : STATS_KEY
}

export function getMischiefStats(userId: string | null): MischiefStats {
  try {
    const raw = localStorage.getItem(getStatsKey(userId))
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { peekCount: 0, wrongCount: 0, deletePresses: 0, highlightSessions: 0 }
}

function saveStats(userId: string | null, stats: MischiefStats) {
  try {
    localStorage.setItem(getStatsKey(userId), JSON.stringify(stats))
  } catch { /* ignore */ }
}

export function incrementPeek(userId: string | null) {
  const stats = getMischiefStats(userId)
  stats.peekCount++
  saveStats(userId, stats)
}

export function incrementWrong(userId: string | null) {
  const stats = getMischiefStats(userId)
  stats.wrongCount++
  saveStats(userId, stats)
}

export function incrementDeletes(userId: string | null) {
  const stats = getMischiefStats(userId)
  stats.deletePresses++
  saveStats(userId, stats)
}

export function incrementHighlightSessions(userId: string | null) {
  const stats = getMischiefStats(userId)
  stats.highlightSessions++
  saveStats(userId, stats)
}

export interface MischievementDef {
  id: string
  emoji: string
  name: string
  description: string
}

export const MISCHIEVEMENTS: MischievementDef[] = [
  {
    id: 'sneaky-peeker',
    emoji: '🫣',
    name: 'Sneaky Peeker',
    description: 'Use Peek 10 times',
  },
  {
    id: 'peek-a-boo-pro',
    emoji: '🙈',
    name: 'Peek-a-Boo Pro',
    description: 'Use Peek 50 times',
  },
  {
    id: 'oops',
    emoji: '😬',
    name: 'Oops!',
    description: 'Get 25 words wrong',
  },
  {
    id: 'typo-king',
    emoji: '👑',
    name: 'Typo Royalty',
    description: 'Get 100 words wrong',
  },
  {
    id: 'backspace-warrior',
    emoji: '⌫',
    name: 'Backspace Warrior',
    description: 'Press delete 100 times',
  },
  {
    id: 'training-wheels',
    emoji: '🔦',
    name: 'Training Wheels',
    description: 'Complete 10 sessions with highlight on',
  },
  {
    id: 'highlight-addict',
    emoji: '💡',
    name: 'Highlight Addict',
    description: 'Complete 50 sessions with highlight on',
  },
  {
    id: 'fully-lit',
    emoji: '🌟',
    name: 'Fully Lit',
    description: 'Complete 100 sessions with highlight on',
  },
]

export function computeEarnedMischievementIds(
  stats: MischiefStats,
): Set<string> {
  const earned = new Set<string>()

  if (stats.peekCount >= 10) earned.add('sneaky-peeker')
  if (stats.peekCount >= 50) earned.add('peek-a-boo-pro')
  if (stats.wrongCount >= 25) earned.add('oops')
  if (stats.wrongCount >= 100) earned.add('typo-king')
  if (stats.deletePresses >= 100) earned.add('backspace-warrior')
  if (stats.highlightSessions >= 10) earned.add('training-wheels')
  if (stats.highlightSessions >= 50) earned.add('highlight-addict')
  if (stats.highlightSessions >= 100) earned.add('fully-lit')

  return earned
}

export function getNewlyEarnedMischievements(
  previousIds: Set<string>,
  currentIds: Set<string>,
): MischievementDef[] {
  return MISCHIEVEMENTS.filter(
    (m) => currentIds.has(m.id) && !previousIds.has(m.id),
  )
}
