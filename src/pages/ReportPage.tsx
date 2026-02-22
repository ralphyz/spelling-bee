import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useApp, fetchSessions, filterVisibleLists } from '../context/AppContext'
import { getAvatarSrc } from '../utils/themes'
import { ACHIEVEMENTS, CATEGORIES, computeEarnedAchievementIds } from '../utils/achievements'
import { MISCHIEVEMENTS, getMischiefStats, computeEarnedMischievementIds } from '../utils/mishchievements'
import type { SessionRecord, WordProgress, UserProfile, WordList } from '../types'
import { BeeBuddy } from '../components/shared/BeeBuddy'
import { PageAvatar } from '../components/shared/PageAvatar'

interface UserStats {
  user: UserProfile
  totalWords: number
  practiced: number
  missed: number
  mastered: number
  accuracy: number
  sessions: number
  lastActive: number
  struggleWords: { word: string; listName: string; incorrect: number }[]
  listBreakdowns: { listName: string; practiced: number; missed: number; mastered: number; total: number }[]
  earnedIds: Set<string>
  earnedMischievementIds: Set<string>
}

function computeUserStats(
  user: UserProfile,
  state: ReturnType<typeof useApp>['state'],
  sessions: SessionRecord[],
  wordLists: WordList[],
): UserStats {
  const mastery = (state.settings.heatmapLevels || 3) - 1
  let totalWords = 0
  let practiced = 0
  let missed = 0
  let mastered = 0
  let totalCorrect = 0
  let totalAttempts = 0
  const struggleWords: UserStats['struggleWords'] = []
  const listBreakdowns: UserStats['listBreakdowns'] = []

  const userSessions = sessions.filter(
    (s) => s.userId === user.id || (!s.userId && sessions.length > 0)
  )

  for (const list of wordLists) {
    let listPracticed = 0
    let listMissed = 0
    let listMastered = 0

    for (const w of list.words) {
      const userKey = `${user.id}:${list.id}:${w.word}`
      const legacyKey = `${list.id}:${w.word}`
      const p: WordProgress | undefined = state.progress[userKey] || state.progress[legacyKey]

      if (!p || p.lastReviewed === 0) continue // unattempted

      totalCorrect += p.correctCount
      totalAttempts += p.correctCount + p.incorrectCount

      if (p.incorrectCount > 0 && p.repetitions === 0) {
        // missed
        listMissed++
        struggleWords.push({
          word: w.word,
          listName: list.name,
          incorrect: p.incorrectCount,
        })
      } else if (p.repetitions > 0) {
        // practiced
        listPracticed++
        if (p.repetitions >= mastery) listMastered++
      }
    }

    totalWords += list.words.length
    practiced += listPracticed
    missed += listMissed
    mastered += listMastered

    listBreakdowns.push({
      listName: list.name,
      practiced: listPracticed,
      missed: listMissed,
      mastered: listMastered,
      total: list.words.length,
    })
  }

  const lastActive = userSessions.length > 0
    ? Math.max(...userSessions.map((s) => new Date(s.date).getTime()))
    : 0

  struggleWords.sort((a, b) => b.incorrect - a.incorrect)

  const earnedIds = computeEarnedAchievementIds(userSessions, state, user.id)
  const earnedMischievementIds = computeEarnedMischievementIds(getMischiefStats(user.id))

  return {
    user,
    totalWords,
    practiced,
    missed,
    mastered,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    sessions: userSessions.length,
    lastActive,
    struggleWords: struggleWords.slice(0, 5),
    listBreakdowns,
    earnedIds,
    earnedMischievementIds,
  }
}

function StatBadge({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="bg-base-100 rounded-xl p-2 text-center">
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-base-content/60">{label}</p>
    </div>
  )
}

function UserReportCard({ stats, index }: { stats: UserStats; index: number }) {
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const avatarSrc = getAvatarSrc(stats.user.avatar)

  const lastActiveStr = stats.lastActive > 0
    ? new Date(stats.lastActive).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Never'

  const latestAchievement = [...ACHIEVEMENTS].reverse().find((a) => stats.earnedIds.has(a.id))
  const latestMischievement = [...MISCHIEVEMENTS].reverse().find((m) => stats.earnedMischievementIds.has(m.id))
  const latestBadge = latestMischievement || latestAchievement

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-200 shadow-md"
    >
      <div className="card-body p-4 gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-3 w-full text-left"
        >
          <motion.div
            animate={{ y: [0, -3, 0] }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              delay: index * 0.4,
              ease: 'easeInOut',
            }}
            className="shrink-0"
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/30 shadow-lg bg-white"
              />
            ) : (
              <span className="text-4xl block">{stats.user.avatar}</span>
            )}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-lg truncate">{stats.user.name}</h3>
            <p className="text-xs text-base-content/60">
              Last active: {lastActiveStr}
            </p>
          </div>
          {latestBadge && (
            <div className="hidden landscape:flex items-center gap-2 shrink-0">
              <span className="text-2xl">{latestBadge.emoji}</span>
              <div className="text-right">
                <p className="text-xs font-semibold">{latestBadge.name}</p>
                <p className="text-[10px] text-base-content/50">{latestBadge.description}</p>
              </div>
            </div>
          )}
          <svg
            className={`w-6 h-6 text-base-content/40 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {open && (<>
        <div className="grid grid-cols-5 gap-2">
          <StatBadge value={stats.practiced} label="Practiced" color="text-primary" />
          <StatBadge value={stats.missed} label="Missed" color="text-error" />
          <StatBadge value={stats.mastered} label="Mastered" color="text-success" />
          <StatBadge value={`${stats.accuracy}%`} label="Accuracy" color="text-info" />
          <StatBadge value={stats.sessions} label="Sessions" color="text-secondary" />
        </div>

        {stats.totalWords > 0 && (
          <div className="w-full">
            <div className="flex justify-between text-xs text-base-content/60 mb-1">
              <span>Overall mastery</span>
              <span>{stats.mastered}/{stats.totalWords}</span>
            </div>
            <progress
              className="progress progress-success w-full"
              value={stats.totalWords > 0 ? (stats.mastered / stats.totalWords) * 100 : 0}
              max="100"
            />
          </div>
        )}

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-2 border-t border-base-content/10"
          >
            {stats.listBreakdowns.map((lb) => (
              <div key={lb.listName}>
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{lb.listName}</span>
                  <span className="text-base-content/60">
                    {lb.mastered}/{lb.total} mastered
                  </span>
                </div>
                <progress
                  className="progress progress-primary progress-sm w-full"
                  value={lb.total > 0 ? (lb.mastered / lb.total) * 100 : 0}
                  max="100"
                />
              </div>
            ))}

            {stats.struggleWords.length > 0 && (
              <div>
                <p className="text-sm font-medium text-warning mb-1.5">Needs Practice</p>
                <div className="flex flex-wrap gap-1.5">
                  {stats.struggleWords.map((sw) => (
                    <span
                      key={`${sw.listName}:${sw.word}`}
                      className="badge badge-warning badge-sm"
                      title={`${sw.listName} — ${sw.incorrect} mistakes`}
                    >
                      {sw.word}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {stats.struggleWords.length === 0 && stats.practiced > 0 && (
              <p className="text-sm text-success">No struggling words — great job!</p>
            )}

            <div>
              <p className="text-sm font-medium mb-2">
                Achievements ({stats.earnedIds.size}/{ACHIEVEMENTS.length})
              </p>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => {
                  const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat.id)
                  const earned = catAchievements.filter((a) => stats.earnedIds.has(a.id))
                  if (earned.length === 0) return null
                  return (
                    <div key={cat.id}>
                      <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">
                        {cat.label}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {catAchievements.map((a) => {
                          const isEarned = stats.earnedIds.has(a.id)
                          return (
                            <span
                              key={a.id}
                              title={`${a.name} — ${a.description}`}
                              className={`text-xl ${isEarned ? '' : 'opacity-20 grayscale'}`}
                            >
                              {a.emoji}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}

        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center gap-1 text-xs text-base-content/40 hover:text-base-content/60 transition-colors pt-1"
        >
          {expanded ? 'Less' : 'Details'}
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        </>)}
      </div>
    </motion.div>
  )
}

export function ReportPage() {
  const { state } = useApp()
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    fetchSessions().then(setSessions)
  }, [])

  if (state.users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <svg className="w-16 h-16 text-base-content/30" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
        </svg>
        <p className="text-base-content/60">
          Add users and start practicing to see reports!
        </p>
      </div>
    )
  }

  // Only show profiles accessible under the current PIN
  const visibleUsers = state.users.filter((u) => state.authenticatedUserIds.includes(u.id))
  const visibleLists = filterVisibleLists(state.wordLists, state)

  const allStats = visibleUsers.map((user) =>
    computeUserStats(user, state, sessions, visibleLists)
  )

  const totalMastered = allStats.reduce((sum, s) => sum + s.mastered, 0)
  const totalWords = allStats.reduce((sum, s) => sum + s.totalWords, 0)
  const totalSessions = allStats.reduce((sum, s) => sum + s.sessions, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <BeeBuddy mood="celebrate" size="md" />
        <PageAvatar pose="progress" size="lg" />
        <h1 className="text-2xl font-bold text-primary mt-2">Family Report</h1>
        <p className="text-sm text-base-content/60 mt-1">
          {visibleUsers.length} {visibleUsers.length === 1 ? 'speller' : 'spellers'} &middot; {totalSessions} sessions &middot; {totalMastered}/{totalWords} mastered
        </p>
      </div>

      {allStats.map((stats, i) => (
        <UserReportCard key={stats.user.id} stats={stats} index={i} />
      ))}
    </div>
  )
}
