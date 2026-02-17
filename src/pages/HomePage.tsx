import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { useApp } from '../context/AppContext'
import { PageAvatar } from '../components/shared/PageAvatar'
import type { WordList } from '../types'

function sortLists(lists: WordList[], sortBy: string, sortDir: string) {
  return [...lists].sort((a, b) => {
    let cmp = 0
    if (sortBy === 'name') cmp = a.name.localeCompare(b.name)
    else if (sortBy === 'date') cmp = a.createdAt - b.createdAt
    else if (sortBy === 'wordCount') cmp = a.words.length - b.words.length
    return sortDir === 'desc' ? -cmp : cmp
  })
}

export function HomePage() {
  const { state, dispatch } = useApp()
  const navigate = useNavigate()

  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const deprioritized = currentUser?.deprioritizedLists || []
  const sortBy = currentUser?.listSortBy || 'date'
  const sortDir = currentUser?.listSortDir || 'desc'

  const learnLabel = state.settings.learnWordCount === 'all' ? 'All' : state.settings.learnWordCount
  const quizLabel = state.settings.quizWordCount === 'all' ? 'All' : state.settings.quizWordCount

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

  const handleSelect = (listId: string, mode: 'learn' | 'quiz', opts?: { missed?: boolean; mostMissed?: boolean }) => {
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

  const getMissedCount = (list: WordList) =>
    list.words.filter((w) => {
      const userKey = state.currentUserId ? `${state.currentUserId}:${list.id}:${w.word}` : null
      const legacyKey = `${list.id}:${w.word}`
      const p = (userKey && state.progress[userKey]) || state.progress[legacyKey]
      return p && p.incorrectCount > 0 && p.repetitions === 0
    }).length

  const getPracticedCount = (list: WordList) =>
    list.words.filter((w) => {
      const userKey = state.currentUserId ? `${state.currentUserId}:${list.id}:${w.word}` : null
      const legacyKey = `${list.id}:${w.word}`
      const p = (userKey && state.progress[userKey]) || state.progress[legacyKey]
      return p && p.lastReviewed > 0
    }).length

  const getEverMissedCount = (list: WordList) =>
    list.words.filter((w) => {
      const userKey = state.currentUserId ? `${state.currentUserId}:${list.id}:${w.word}` : null
      const legacyKey = `${list.id}:${w.word}`
      const p = (userKey && state.progress[userKey]) || state.progress[legacyKey]
      return p && p.incorrectCount > 0
    }).length

  const renderListCard = (list: WordList, archived: boolean) => {
    const missedCount = getMissedCount(list)
    const practicedCount = getPracticedCount(list)
    const needsPractice = list.requirePractice !== false
    const allPracticed = !needsPractice || practicedCount >= list.words.length
    const everMissedCount = getEverMissedCount(list)

    return (
      <motion.div
        key={list.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`card bg-base-200 shadow-sm w-11/12 landscape:w-2/3 ${archived ? 'opacity-50' : ''}`}
      >
        <div className="card-body p-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 w-1/3 shrink-0">
              <div className="flex items-center gap-1">
                <h3 className="font-bold text-base truncate">{list.name}</h3>
                {state.currentUserId && (
                  <button
                    className="btn btn-ghost btn-xs btn-circle text-base-content/40 hover:text-base-content/70"
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
              </div>
              <p className="text-xs text-base-content/60">
                {(() => {
                  const mastery = (state.settings.heatmapLevels || 3) - 1
                  const mastered = list.words.filter((w) => {
                    const userKey = state.currentUserId ? `${state.currentUserId}:${list.id}:${w.word}` : null
                    const legacyKey = `${list.id}:${w.word}`
                    const p = (userKey && state.progress[userKey]) || state.progress[legacyKey]
                    return p && p.repetitions >= mastery
                  }).length
                  return `${mastered}/${list.words.length} mastered`
                })()}
              </p>
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="btn btn-primary rounded-xl text-base flex-1"
                  onClick={() => handleSelect(list.id, 'learn')}
                >
                  <span className="text-2xl">📖</span> Learn ({learnLabel})
                </motion.button>
                <motion.button
                  whileTap={allPracticed ? { scale: 0.95 } : undefined}
                  className={`btn btn-secondary rounded-xl text-base flex-1 ${!allPracticed ? 'btn-disabled' : ''}`}
                  onClick={() => allPracticed && handleSelect(list.id, 'quiz')}
                  title={!allPracticed ? `Practice all words first (${practicedCount}/${list.words.length})` : undefined}
                >
                  <span className="text-2xl">🐝</span> {allPracticed ? `Quiz (${quizLabel})` : `${practicedCount}/${list.words.length}`}
                </motion.button>
              </div>
              {(missedCount > 0 || (allPracticed && everMissedCount > 0)) && (
                <div className="grid grid-cols-2 gap-2">
                  {missedCount > 0 ? (
                    <button
                      className="badge badge-sm bg-base-300 text-base-content/60 hover:bg-base-content/20 transition-colors gap-1 py-2.5 w-full"
                      onClick={() => handleSelect(list.id, 'learn', { missed: true })}
                    >
                      Missed ({missedCount}) - Learn
                    </button>
                  ) : <div />}
                  <div className="flex flex-col gap-2 items-center">
                    {missedCount > 0 && allPracticed && (
                      <button
                        className="badge badge-sm bg-base-300 text-base-content/60 hover:bg-base-content/20 transition-colors gap-1 py-2.5 w-full"
                        onClick={() => handleSelect(list.id, 'quiz', { missed: true })}
                      >
                        Missed ({missedCount}) - Quiz
                      </button>
                    )}
                    {allPracticed && everMissedCount > 0 && (
                      <button
                        className="badge badge-sm bg-base-300 text-base-content/60 hover:bg-base-content/20 transition-colors gap-1 py-2.5 w-full"
                        onClick={() => handleSelect(list.id, 'quiz', { mostMissed: true })}
                      >
                        Most Missed ({everMissedCount}) - Quiz
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
          <div className="flex items-center gap-3 px-6">
            <div className="flex-1 border-t border-base-content/10" />
            <span className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">Archived</span>
            <div className="flex-1 border-t border-base-content/10" />
          </div>
          <div className="flex flex-col items-center gap-3">
            {archivedLists.map((list) => renderListCard(list, true))}
          </div>
        </>
      )}
    </div>
  )
}
