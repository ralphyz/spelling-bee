import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useApp, fetchSessions } from '../context/AppContext'
import { PageAvatar } from '../components/shared/PageAvatar'
import type { WordList, SessionRecord } from '../types'

function sortLists(lists: WordList[], sortBy: string, sortDir: string) {
  return [...lists].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'date') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'wordCount') cmp = a.words.length - b.words.length
    return sortDir === 'desc' ? -cmp : cmp
  })
}

function isQuizComplete(list: WordList, sessions: SessionRecord[], mastery: number): boolean {
  const quizSessions = sessions
    .filter((s) => s.listId === list.id && s.mode === 'quiz')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  if (quizSessions.length === 0) return false
  for (const w of list.words) {
    let consecutive = 0
    let mastered = false
    for (const session of quizSessions) {
      const result = session.results.find((r) => r.word === w.word)
      if (result) {
        if (result.correct) {
          consecutive++
          if (consecutive >= mastery) { mastered = true; break }
        } else {
          consecutive = 0
        }
      }
    }
    if (!mastered) return false
  }
  return true
}

export function HomePage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    fetchSessions(state.currentUserId ? { userId: state.currentUserId } : undefined).then(setSessions)
  }, [state.currentUserId])

  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const deprioritized = currentUser?.deprioritizedLists || []
  const sortBy = currentUser?.listSortBy || 'date'
  const sortDir = currentUser?.listSortDir || 'desc'
  const showArchived = currentUser?.showArchived ?? false

  const activeLists = sortLists(
    state.wordLists.filter((l) => !deprioritized.includes(l.id)),
    sortBy,
    sortDir
  )
  const archivedLists = sortLists(
    state.wordLists.filter((l) => deprioritized.includes(l.id)),
    sortBy,
    sortDir
  )

  const [highlightWarning, setHighlightWarning] = useState<{ listId: string; mode: 'learn' | 'quiz' | 'practice' | 'missing-letters'; highlightKey: 'practice' | 'learn' | 'quiz' | 'missingLetters' } | null>(null)

  const handleSelect = (listId: string, mode: 'learn' | 'quiz' | 'practice' | 'missing-letters', opts?: { missed?: boolean }) => {
    dispatch({ type: 'SET_ACTIVE_LIST', payload: listId })
    navigate(`/${mode}`, opts ? { state: opts } : undefined)
  }

  const handleToggleSort = (newSortBy: 'name' | 'date' | 'wordCount') => {
    if (!state.currentUserId) return
    const newDir = sortBy === newSortBy
      ? (sortDir === 'asc' ? 'desc' : 'asc')
      : 'desc'
    dispatch({
      type: 'SET_LIST_SORT',
      payload: { userId: state.currentUserId, sortBy: newSortBy, sortDir: newDir },
    })
  }

  const handleTogglePriority = (listId: string) => {
    if (!state.currentUserId) return
    dispatch({
      type: 'TOGGLE_LIST_PRIORITY',
      payload: { userId: state.currentUserId, listId },
    })
  }

  if (state.wordLists.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <motion.p
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl"
        >
          🐝
        </motion.p>
        <h1 className="text-3xl font-bold text-primary">Spelling Bee</h1>
        <p className="text-base-content/60 max-w-xs">
          Get started by adding a word list!
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary btn-lg rounded-2xl"
          onClick={() => navigate('/parent')}
        >
          Add Words
        </motion.button>
      </div>
    )
  }

  const sortArrow = (key: string) =>
    sortBy === key ? (sortDir === 'asc' ? ' \u2191' : ' \u2193') : ''

  const getWordCounts = (list: WordList, mastery: number) => {
    let missed = 0
    let practiced = 0
    let mastered = 0
    for (const w of list.words) {
      const userKey = state.currentUserId ? `${state.currentUserId}:${list.id}:${w.word}` : null
      const legacyKey = `${list.id}:${w.word}`
      const p = (userKey && state.progress[userKey]) || state.progress[legacyKey]
      if (!p || p.lastReviewed === 0) continue // unattempted
      if (p.incorrectCount > 0 && p.repetitions === 0) { missed++; continue }
      if (p.repetitions > 0) {
        practiced++
        if (p.repetitions >= mastery) mastered++
      }
    }
    return { missed, practiced, mastered, unattempted: list.words.length - missed - practiced }
  }

  const renderListCard = (list: WordList, archived: boolean) => {
    const mastery = (state.settings.heatmapLevels || 3) - 1
    const counts = getWordCounts(list, mastery)
    const total = list.words.length
    const needsPractice = list.requirePractice !== false
    const allPracticed = !needsPractice || counts.unattempted === 0
    const learnComplete = counts.unattempted === 0 && counts.missed === 0
    const quizComplete = isQuizComplete(list, sessions, mastery)

    const highlightModes = currentUser?.highlightModes ?? {}

    const activities = [
      {
        label: 'Practice',
        emoji: '✏️',
        mode: 'practice' as const,
        highlightKey: 'practice' as const,
        bg: 'bg-accent/25',
        border: 'border-accent/40',
        text: 'text-accent',
      },
      {
        label: 'Missing Letters',
        emoji: '🧩',
        mode: 'missing-letters' as const,
        highlightKey: 'missingLetters' as const,
        bg: 'bg-info/25',
        border: 'border-info/40',
        text: 'text-info',
      },
      {
        label: 'Learn',
        emoji: '📖',
        mode: 'learn' as const,
        highlightKey: 'learn' as const,
        bg: 'bg-primary/30',
        border: 'border-primary/45',
        text: 'text-primary',
        complete: learnComplete,
      },
      {
        label: allPracticed ? 'Quiz' : `Quiz (${total - counts.unattempted}/${total})`,
        emoji: '🐝',
        mode: 'quiz' as const,
        highlightKey: 'quiz' as const,
        bg: 'bg-secondary/40',
        border: 'border-secondary/55',
        text: 'text-secondary',
        disabled: !allPracticed,
        complete: quizComplete,
      },
    ]

    return (
      <motion.div
        key={list.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card bg-base-200 shadow-sm w-11/12 landscape:w-2/3 ${archived ? 'opacity-50' : ''}`}
      >
        <div className="card-body p-3">
          <div className="flex items-center gap-1 mb-1">
            <h3 className="font-bold text-base truncate">{list.name}</h3>
            {state.currentUserId && (
              <button
                className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content/70 shrink-0"
                title={archived ? 'Restore list' : 'Archive list'}
                onClick={() => handleTogglePriority(list.id)}
              >
                {archived ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3-3m0 0 3 3m-3-3v12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                )}
              </button>
            )}
            <div className="ml-auto flex items-center gap-2">
              {counts.missed > 0 && (
                <button
                  className="badge badge-sm bg-error/20 text-error hover:bg-error/30 transition-colors gap-1 py-2 whitespace-nowrap"
                  onClick={() => handleSelect(list.id, 'learn', { missed: true })}
                >
                  😬 {counts.missed}
                </button>
              )}
              <span className="text-xs text-base-content/50">
                {counts.practiced}/{total}
                {counts.mastered > 0 && ` (${counts.mastered} mastered)`}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {activities.map((act) => {
              const hlOn = !!highlightModes[act.highlightKey]
              return (
                <motion.div
                  key={act.mode}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${act.bg} ${act.border} ${act.disabled ? 'opacity-40' : ''} ${act.complete ? 'ring-2 ring-success ring-offset-1 ring-offset-base-200' : ''} transition-all`}
                >
                  <motion.div
                    className={`flex items-center gap-2 flex-1 ${act.disabled ? '' : 'cursor-pointer hover:brightness-90 active:brightness-85'}`}
                    whileTap={!act.disabled ? { scale: 0.97 } : undefined}
                    onClick={() => {
                      if (act.disabled) return
                      if (act.mode === 'quiz' && hlOn) {
                        setHighlightWarning({ listId: list.id, mode: act.mode, highlightKey: act.highlightKey })
                      } else {
                        handleSelect(list.id, act.mode)
                      }
                    }}
                    title={act.disabled ? `Practice all words first (${total - counts.unattempted}/${total})` : act.label}
                  >
                    <span className="text-lg shrink-0">{act.emoji}</span>
                    <span className={`font-semibold text-sm ${act.text}`}>
                      {act.label}
                    </span>
                    {act.complete && (
                      <svg className="w-4 h-4 text-success shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </motion.div>
                  {state.currentUserId && (
                    <button
                      className={`btn btn-ghost btn-xs btn-circle shrink-0 ${hlOn ? 'text-warning' : 'text-base-content/25'}`}
                      title={hlOn ? 'Highlight on' : 'Highlight off'}
                      onClick={(e) => {
                        e.stopPropagation()
                        dispatch({ type: 'TOGGLE_HIGHLIGHT_MODE', payload: { userId: state.currentUserId!, activity: act.highlightKey } })
                      }}
                    >
                      <svg className="w-4 h-4" fill={hlOn ? 'currentColor' : 'none'} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                      </svg>
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <PageAvatar pose="home" size="xl" />
        <h1 className="text-2xl font-bold text-primary">Pick a List</h1>
      </div>

      {state.currentUserId && (
        <div className="flex justify-center">
          <div className="join">
            {([['name', 'Name'], ['date', 'Date'], ['wordCount', 'Words']] as const).map(([key, label]) => (
              <button
                key={key}
                className={`join-item btn btn-sm ${sortBy === key ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => handleToggleSort(key)}
              >
                {label}{sortArrow(key)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-3">
        {activeLists.map((list) => renderListCard(list, false))}
      </div>

      {archivedLists.length > 0 && (
        <>
          <div
            className="flex items-center gap-3 px-6 cursor-pointer group"
            onClick={() => state.currentUserId && dispatch({ type: 'TOGGLE_SHOW_ARCHIVED', payload: { userId: state.currentUserId } })}
          >
            <div className="flex-1 border-t border-base-content/10" />
            <span className="text-xs font-semibold text-base-content/40 uppercase tracking-wider group-hover:text-base-content/60 transition-colors select-none">
              Archived ({archivedLists.length}) {showArchived ? '▾' : '▸'}
            </span>
            <div className="flex-1 border-t border-base-content/10" />
          </div>
          {showArchived && (
            <div className="flex flex-col items-center gap-3">
              {archivedLists.map((list) => renderListCard(list, true))}
            </div>
          )}
        </>
      )}

      {highlightWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-base-100 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl text-center space-y-4 border border-base-content/5"
          >
            <p className="text-3xl">💡</p>
            <p className="text-lg font-bold">Highlight is on</p>
            <p className="text-base-content/60 text-sm">
              With highlight enabled, you'll see letter-by-letter feedback as you type. Quiz results will count as <span className="font-semibold text-accent">practice</span> instead.
            </p>
            <div className="flex flex-col gap-2">
              <button
                className="btn btn-primary rounded-xl w-full"
                onClick={() => {
                  const { listId, mode } = highlightWarning
                  setHighlightWarning(null)
                  handleSelect(listId, mode)
                }}
              >
                Continue as Practice
              </button>
              <button
                className="btn btn-secondary rounded-xl w-full"
                onClick={() => {
                  if (state.currentUserId) {
                    dispatch({ type: 'TOGGLE_HIGHLIGHT_MODE', payload: { userId: state.currentUserId, activity: highlightWarning.highlightKey } })
                  }
                  const { listId, mode } = highlightWarning
                  setHighlightWarning(null)
                  handleSelect(listId, mode)
                }}
              >
                Turn Off Highlight & Quiz
              </button>
              <button
                className="btn btn-ghost rounded-xl w-full"
                onClick={() => setHighlightWarning(null)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
