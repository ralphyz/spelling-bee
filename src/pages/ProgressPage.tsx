import { useState, useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { useApp, fetchSessions } from '../context/AppContext'
import type { SessionRecord, HeatmapLevels, WordList } from '../types'
import { PageAvatar } from '../components/shared/PageAvatar'
import { ACHIEVEMENTS, CATEGORIES, computeEarnedAchievementIds } from '../utils/achievements'
import { MISCHIEVEMENTS, getMischiefStats, computeEarnedMischievementIds } from '../utils/mishchievements'

type WordStatus = 'not-tried' | 'missed' | number

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

function sessionsForList(sessions: SessionRecord[], list: WordList): SessionRecord[] {
  return sessions.filter((s) => s.listId === list.id || s.listName === list.name)
}

function SummaryCard({ title, lists, sessions, heatmapMode, heatmapLevels }: {
  title: string
  lists: WordList[]
  sessions: SessionRecord[]
  heatmapMode: 'learn' | 'quiz'
  heatmapLevels: HeatmapLevels
}) {
  const mastery = heatmapLevels - 1
  let totalWords = 0
  let totalPracticed = 0
  let totalMissed = 0
  let totalMastered = 0

  for (const list of lists) {
    const words = list.words.map((w) => w.word)
    const listSessions = sessionsForList(sessions, list)
    const allStatuses = computeWordStatuses(words, listSessions, heatmapLevels)
    const statuses = heatmapMode === 'learn'
      ? allStatuses
      : computeWordStatuses(words, listSessions.filter((s) => s.mode === 'quiz'), heatmapLevels)

    totalWords += words.length
    totalPracticed += words.filter((w) => statuses.get(w) !== 'not-tried' && statuses.get(w) !== 'missed').length
    totalMissed += words.filter((w) => statuses.get(w) === 'missed').length
    totalMastered += words.filter((w) => {
      const s = statuses.get(w)
      return typeof s === 'number' && s >= mastery
    }).length
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-base-200 shadow-md"
    >
      <div className="card-body p-4 gap-3">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-lg">{title}</h3>
          <span className="text-sm text-base-content/60">
            {totalMastered}/{totalWords} mastered
          </span>
        </div>

        <progress
          className="progress progress-primary w-full"
          value={totalWords > 0 ? (totalMastered / totalWords) * 100 : 0}
          max="100"
        />

        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-base-100 rounded-xl p-2">
            <p className="text-2xl font-bold text-primary">{totalPracticed}</p>
            <p className="text-base-content/60">Practiced</p>
          </div>
          <div className="bg-base-100 rounded-xl p-2">
            <p className="text-2xl font-bold text-error">{totalMissed}</p>
            <p className="text-base-content/60">Missed</p>
          </div>
          <div className="bg-base-100 rounded-xl p-2">
            <p className="text-2xl font-bold text-success">{totalMastered}</p>
            <p className="text-base-content/60">Mastered</p>
          </div>
        </div>

        <p className="text-xs text-base-content/40 text-center">
          {lists.length} list{lists.length !== 1 ? 's' : ''} &middot; {totalWords} total words
        </p>
      </div>
    </motion.div>
  )
}

function ListCard({ list, sessions, heatmapMode, heatmapLevels }: {
  list: WordList
  sessions: SessionRecord[]
  heatmapMode: 'learn' | 'quiz'
  heatmapLevels: HeatmapLevels
}) {
  const words = list.words.map((w) => w.word)
  const mastery = heatmapLevels - 1
  const listSessions = sessionsForList(sessions, list)
  const allStatuses = computeWordStatuses(words, listSessions, heatmapLevels)
  const quizStatuses = computeWordStatuses(words, listSessions.filter((s) => s.mode === 'quiz'), heatmapLevels)

  const statuses = heatmapMode === 'learn' ? allStatuses : quizStatuses
  const mastered = words.filter((w) => {
    const s = statuses.get(w)
    return typeof s === 'number' && s >= mastery
  }).length
  const missed = words.filter((w) => statuses.get(w) === 'missed').length
  const practiced = words.filter((w) => statuses.get(w) !== 'not-tried' && statuses.get(w) !== 'missed').length

  return (
    <motion.div
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
}

type Selection = 'all' | 'active' | string

export function ProgressPage() {
  const { state } = useApp()
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [heatmapMode, setHeatmapMode] = useState<'learn' | 'quiz'>('learn')
  const [selected, setSelected] = useState<Selection>('pending')

  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const deprioritized = currentUser?.deprioritizedLists || []
  const activeLists = state.wordLists.filter((l) => !deprioritized.includes(l.id))
  const archivedLists = state.wordLists.filter((l) => deprioritized.includes(l.id))

  useEffect(() => {
    fetchSessions(state.currentUserId ? { userId: state.currentUserId } : undefined).then((s) => {
      setSessions(s)
      // Default to the list from the most recent session
      if (s.length > 0 && selected === 'pending') {
        const sorted = [...s].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        const lastListId = sorted[0].listId
        // Only select if the list still exists
        if (state.wordLists.some((l) => l.id === lastListId)) {
          setSelected(lastListId)
        } else {
          setSelected('all')
        }
      } else if (selected === 'pending') {
        setSelected('all')
      }
    })
  }, [state.currentUserId])

  const heatmapLevels = state.settings.heatmapLevels || 3

  const earnedIds = useMemo(
    () => computeEarnedAchievementIds(sessions, state, state.currentUserId),
    [sessions, state],
  )
  const earnedCount = earnedIds.size

  const mischiefStats = useMemo(
    () => getMischiefStats(state.currentUserId),
    [sessions, state.currentUserId],
  )
  const earnedMischiefIds = useMemo(
    () => computeEarnedMischievementIds(mischiefStats),
    [mischiefStats],
  )
  const mischiefEarnedCount = earnedMischiefIds.size

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

  // Don't render until default selection is resolved
  if (selected === 'pending') return null

  const isSummary = selected === 'all' || selected === 'active'
  const summaryLists = selected === 'all' ? state.wordLists : activeLists
  const selectedList = !isSummary ? state.wordLists.find((l) => l.id === selected) : null

  const filteredSessions = isSummary
    ? (selected === 'all' ? sessions : sessions.filter((s) => activeLists.some((l) => l.id === s.listId || l.name === s.listName)))
    : sessions.filter((s) => {
        const list = state.wordLists.find((l) => l.id === selected)
        return s.listId === selected || (list && s.listName === list.name)
      })

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

      <div className="flex justify-center">
        <select
          className="select select-bordered select-sm w-full max-w-xs"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          <option value="all">All Lists</option>
          {archivedLists.length > 0 && <option value="active">All Active</option>}
          {activeLists.length > 0 && (
            <optgroup label="Active">
              {activeLists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </optgroup>
          )}
          {archivedLists.length > 0 && (
            <optgroup label="Archived">
              {archivedLists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {isSummary && (
        <SummaryCard
          title={selected === 'all' ? 'All Lists' : 'All Active'}
          lists={summaryLists}
          sessions={sessions}
          heatmapMode={heatmapMode}
          heatmapLevels={heatmapLevels}
        />
      )}

      {selectedList && (
        <ListCard
          list={selectedList}
          sessions={sessions}
          heatmapMode={heatmapMode}
          heatmapLevels={heatmapLevels}
        />
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-3">
          <h3 className="font-bold text-lg">
            Achievements ({earnedCount}/{ACHIEVEMENTS.length})
          </h3>
          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat.id)
              if (catAchievements.length === 0) return null
              const firstUnearned = catAchievements.find((a) => !earnedIds.has(a.id))
              return (
                <div key={cat.id}>
                  <p className="text-xs font-semibold text-base-content/50 uppercase tracking-wide mb-1.5">
                    {cat.label}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {catAchievements.map((a) => {
                      const isEarned = earnedIds.has(a.id)
                      const isNext = a === firstUnearned
                      return (
                        <div
                          key={a.id}
                          title={`${a.name} — ${a.description}`}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all w-16 ${
                            isEarned
                              ? 'bg-primary/10'
                              : isNext
                                ? 'opacity-70 border-2 border-dashed border-primary/40 animate-pulse'
                                : 'opacity-30'
                          }`}
                        >
                          <span className="text-2xl">{a.emoji}</span>
                          <span className="text-[10px] font-medium leading-tight">{a.name}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-3">
          <h3 className="font-bold text-lg">
            Mischievements ({mischiefEarnedCount}/{MISCHIEVEMENTS.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {MISCHIEVEMENTS.map((m) => {
              const isEarned = earnedMischiefIds.has(m.id)
              const firstUnearned = MISCHIEVEMENTS.find((x) => !earnedMischiefIds.has(x.id))
              const isNext = m === firstUnearned
              return (
                <div
                  key={m.id}
                  title={`${m.name} — ${m.description}`}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-center transition-all w-16 ${
                    isEarned
                      ? 'bg-error/10'
                      : isNext
                        ? 'opacity-70 border-2 border-dashed border-error/40 animate-pulse'
                        : 'opacity-30'
                  }`}
                >
                  <span className="text-2xl">{m.emoji}</span>
                  <span className="text-[10px] font-medium leading-tight">{m.name}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-base-content/40 text-center">
            Peeks: {mischiefStats.peekCount} &middot; Wrong: {mischiefStats.wrongCount} &middot; Deletes: {mischiefStats.deletePresses}
          </p>
        </div>
      </motion.div>

      {filteredSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-bold text-primary">Recent Sessions</h2>
          {[...filteredSessions].reverse().slice(0, 5).map((s) => {
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
                    {s.mode === 'quiz' ? '🐝' : s.mode === 'practice' ? '✏️' : s.mode === 'missingLetters' ? '🧩' : s.mode === 'highlight' ? '🔍' : '📖'}
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
