import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { useApp, fetchSessions } from '../context/AppContext'
import { getMasteryLevel } from '../utils/spacedRepetition'
import { getAvatarSrc } from '../utils/themes'
import type { SessionRecord, WordProgress, UserProfile } from '../types'

interface UserStats {
  user: UserProfile
  totalWords: number
  practiced: number
  mastered: number
  accuracy: number
  sessions: number
  lastActive: number
  struggleWords: { word: string; listName: string; incorrect: number }[]
  listBreakdowns: { listName: string; practiced: number; mastered: number; total: number }[]
}

function computeUserStats(
  user: UserProfile,
  state: ReturnType<typeof useApp>['state'],
  sessions: SessionRecord[],
): UserStats {
  let totalWords = 0
  let practiced = 0
  let mastered = 0
  let totalCorrect = 0
  let totalAttempts = 0
  const struggleWords: UserStats['struggleWords'] = []
  const listBreakdowns: UserStats['listBreakdowns'] = []

  for (const list of state.wordLists) {
    let listPracticed = 0
    let listMastered = 0

    for (const w of list.words) {
      const userKey = `${user.id}:${list.id}:${w.word}`
      const legacyKey = `${list.id}:${w.word}`
      const p: WordProgress | undefined = state.progress[userKey] || state.progress[legacyKey]

      if (p && p.lastReviewed > 0) {
        listPracticed++
        totalCorrect += p.correctCount
        totalAttempts += p.correctCount + p.incorrectCount

        if (getMasteryLevel(p) >= 80) {
          listMastered++
        }

        if (p.incorrectCount > 0 && getMasteryLevel(p) < 60) {
          struggleWords.push({
            word: w.word,
            listName: list.name,
            incorrect: p.incorrectCount,
          })
        }
      }
    }

    totalWords += list.words.length
    practiced += listPracticed
    mastered += listMastered

    listBreakdowns.push({
      listName: list.name,
      practiced: listPracticed,
      mastered: listMastered,
      total: list.words.length,
    })
  }

  const userSessions = sessions.filter(
    (s) => s.userId === user.id || (!s.userId && sessions.length > 0)
  )

  const lastActive = userSessions.length > 0
    ? Math.max(...userSessions.map((s) => new Date(s.date).getTime()))
    : 0

  struggleWords.sort((a, b) => b.incorrect - a.incorrect)

  return {
    user,
    totalWords,
    practiced,
    mastered,
    accuracy: totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0,
    sessions: userSessions.length,
    lastActive,
    struggleWords: struggleWords.slice(0, 5),
    listBreakdowns,
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
  const [expanded, setExpanded] = useState(false)
  const avatarSrc = getAvatarSrc(stats.user.avatar)

  const lastActiveStr = stats.lastActive > 0
    ? new Date(stats.lastActive).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : 'Never'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-200 shadow-md"
    >
      <div className="card-body p-4 gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
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
          <svg
            className={`w-6 h-6 text-base-content/40 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        <div className="grid grid-cols-4 gap-2">
          <StatBadge value={stats.practiced} label="Practiced" color="text-primary" />
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
          </motion.div>
        )}
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

  const allStats = state.users.map((user) =>
    computeUserStats(user, state, sessions)
  )

  const totalMastered = allStats.reduce((sum, s) => sum + s.mastered, 0)
  const totalWords = allStats.reduce((sum, s) => sum + s.totalWords, 0)
  const totalSessions = allStats.reduce((sum, s) => sum + s.sessions, 0)

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-primary">Family Report</h1>
        <p className="text-sm text-base-content/60 mt-1">
          {state.users.length} {state.users.length === 1 ? 'speller' : 'spellers'} &middot; {totalSessions} sessions &middot; {totalMastered}/{totalWords} mastered
        </p>
      </div>

      {allStats.map((stats, i) => (
        <UserReportCard key={stats.user.id} stats={stats} index={i} />
      ))}
    </div>
  )
}
