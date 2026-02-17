import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useApp, fetchSessions } from '../context/AppContext'
import type { SessionRecord, HeatmapLevels } from '../types'
import { PageAvatar } from '../components/shared/PageAvatar'

type WordStatus = 'not-tried' | 'missed' | number

// Progression colors from first correct through mastery (excludes not-tried and missed/red)
// For N heatmapLevels, mastery = N-1 consecutive correct, so N-1 progression colors
const progressColors: Record<HeatmapLevels, string[]> = {
  2: ['bg-green-500 text-green-950'],
  3: ['bg-amber-400 text-amber-950', 'bg-green-500 text-green-950'],
  4: ['bg-orange-400 text-orange-950', 'bg-yellow-400 text-yellow-950', 'bg-green-500 text-green-950'],
  5: ['bg-orange-400 text-orange-950', 'bg-yellow-400 text-yellow-950', 'bg-lime-400 text-lime-950', 'bg-green-500 text-green-950'],
}

function getHeatmapColor(status: WordStatus, levels: HeatmapLevels): string {
  if (status === 'not-tried') return 'badge-ghost'
  if (status === 'missed') return 'bg-red-500 text-red-950'
  const colors = progressColors[levels]
  const idx = Math.min(status as number, levels - 1) - 1
  return colors[idx] || colors[colors.length - 1]
}

function computeWordStatuses(
  words: string[],
  filteredSessions: SessionRecord[],
  levels: HeatmapLevels
): Map<string, WordStatus> {
  const mastery = levels - 1
  const modeSessions = [...filteredSessions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const statuses = new Map<string, WordStatus>()

  for (const word of words) {
    let hasIncorrect = false
    let consecutiveCorrect = 0
    let attempted = false

    for (const session of modeSessions) {
      const result = session.results.find((r) => r.word === word)
      if (result) {
        attempted = true
        if (result.correct) {
          consecutiveCorrect++
        } else {
          hasIncorrect = true
          consecutiveCorrect = 0
        }
      }
    }

    if (!attempted) {
      statuses.set(word, 'not-tried')
    } else if (hasIncorrect && consecutiveCorrect === 0) {
      statuses.set(word, 'missed')
    } else {
      statuses.set(word, Math.min(consecutiveCorrect, mastery))
    }
  }

  return statuses
}

export function ProgressPage() {
  const { state } = useApp()
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [heatmapMode, setHeatmapMode] = useState<'learn' | 'quiz'>('learn')

  useEffect(() => {
    fetchSessions(state.currentUserId ? { userId: state.currentUserId } : undefined).then(setSessions)
  }, [state.currentUserId])

  const heatmapLevels = state.settings.heatmapLevels || 3

  if (state.wordLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-4xl">⭐</p>
        <p className="text-base-content/60">
          Add word lists and start practicing to see your progress!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <PageAvatar pose="progress" size="xl" />

      <div className="flex justify-center">
        <div className="join">
          <button
            className={`join-item btn btn-sm ${heatmapMode === 'learn' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setHeatmapMode('learn')}
          >
            Learn
          </button>
          <button
            className={`join-item btn btn-sm ${heatmapMode === 'quiz' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setHeatmapMode('quiz')}
          >
            Quiz
          </button>
        </div>
      </div>
      {state.wordLists.map((list) => {
        const words = list.words.map((w) => w.word)
        const mastery = heatmapLevels - 1
        const listSessions = sessions.filter((s) => s.listId === list.id)
        // Learn includes both learn + quiz sessions (quiz success counts as practice)
        const learnStatuses = computeWordStatuses(words, listSessions, heatmapLevels)
        // Quiz includes only quiz sessions
        const quizStatuses = computeWordStatuses(words, listSessions.filter((s) => s.mode === 'quiz'), heatmapLevels)

        const statuses = heatmapMode === 'learn' ? learnStatuses : quizStatuses
        const mastered = words.filter((w) => {
          const s = statuses.get(w)
          return typeof s === 'number' && s >= mastery
        }).length
        const missed = words.filter((w) => statuses.get(w) === 'missed').length
        const practiced = words.filter((w) => statuses.get(w) !== 'not-tried').length

        return (
          <motion.div
            key={list.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-200 shadow-md"
          >
            <div className="card-body p-4 gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">{list.name}</h3>
                <span className="text-sm text-base-content/60">
                  {mastered}/{list.words.length} mastered
                </span>
              </div>

              <progress
                className="progress progress-primary w-full"
                value={list.words.length > 0 ? (mastered / list.words.length) * 100 : 0}
                max="100"
              />

              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-base-100 rounded-xl p-2">
                  <p className="text-2xl font-bold text-primary">{practiced}</p>
                  <p className="text-base-content/60">Practiced</p>
                </div>
                <div className="bg-base-100 rounded-xl p-2">
                  <p className="text-2xl font-bold text-error">{missed}</p>
                  <p className="text-base-content/60">Missed</p>
                </div>
                <div className="bg-base-100 rounded-xl p-2">
                  <p className="text-2xl font-bold text-success">{mastered}</p>
                  <p className="text-base-content/60">Mastered</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-1">
                {list.words.map((w) => {
                  const status = statuses.get(w.word) ?? 'not-tried'
                  const color = getHeatmapColor(status, heatmapLevels)
                  return (
                    <span key={w.word} className={`badge ${color} badge-sm`}>
                      {w.word}
                    </span>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )
      })}

      {sessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Recent Sessions</h2>
          {[...sessions].reverse().slice(0, 5).map((s) => {
            const dateStr = new Date(s.date).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            })
            const scoreColor =
              s.score >= 80
                ? 'badge-success'
                : s.score >= 50
                  ? 'badge-warning'
                  : 'badge-error'

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card bg-base-200 shadow-sm"
              >
                <div className="card-body p-3 flex-row items-center gap-3">
                  <span className="text-2xl">
                    {s.mode === 'quiz' ? '🐝' : '📖'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{s.listName}</p>
                    <p className="text-xs text-base-content/60">{dateStr}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-base-content/60">
                      {s.results.filter((r) => r.correct).length}/{s.results.length}
                    </span>
                    <span className={`badge ${scoreColor} badge-sm`}>
                      {s.score}%
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
