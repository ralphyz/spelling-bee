import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp, filterVisibleLists } from '../../context/AppContext'
import { useSpeech } from '../../hooks/useSpeech'
import { fetchWordData } from '../../utils/audioUtils'
import type { WordList, WordEntry } from '../../types'

export function WordListManager() {
  const { state, dispatch } = useApp()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [loadingIdx, setLoadingIdx] = useState<number | null>(null)
  const [editingDefIdx, setEditingDefIdx] = useState<number | null>(null)
  const [editDefValue, setEditDefValue] = useState('')
  const [backfilling, setBackfilling] = useState<string | null>(null)
  const [backfillProgress, setBackfillProgress] = useState(0)
  const [editingPinListId, setEditingPinListId] = useState<string | null>(null)
  const [listPinValue, setListPinValue] = useState('')
  const { speak } = useSpeech()

  const handleDelete = (list: WordList) => {
    if (confirm(`Delete "${list.name}"?`)) {
      dispatch({ type: 'DELETE_LIST', payload: list.id })
    }
  }

  const handleToggleRequirePractice = (list: WordList) => {
    dispatch({
      type: 'UPDATE_LIST',
      payload: { ...list, requirePractice: list.requirePractice === false ? true : false },
    })
  }

  const handleRemoveWord = (list: WordList, idx: number) => {
    const updated = { ...list, words: list.words.filter((_, i) => i !== idx), updatedAt: Date.now() }
    dispatch({ type: 'UPDATE_LIST', payload: updated })
  }

  const handleStartEdit = (word: WordEntry, idx: number) => {
    setEditingIdx(idx)
    setEditValue(word.word)
  }

  const handleSaveEdit = async (list: WordList, idx: number) => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === list.words[idx].word) {
      setEditingIdx(null)
      return
    }
    setLoadingIdx(idx)
    const data = await fetchWordData(trimmed)
    const updatedWords = list.words.map((w, i) =>
      i === idx ? { word: trimmed, ...data } : w
    )
    dispatch({ type: 'UPDATE_LIST', payload: { ...list, words: updatedWords, updatedAt: Date.now() } })
    setLoadingIdx(null)
    setEditingIdx(null)
  }

  const handleStartDefEdit = (word: WordEntry, idx: number) => {
    setEditingDefIdx(idx)
    setEditDefValue(word.definition || '')
  }

  const handleSaveDefEdit = (list: WordList, idx: number) => {
    const trimmed = editDefValue.trim()
    if (trimmed === (list.words[idx].definition || '')) {
      setEditingDefIdx(null)
      return
    }
    const updatedWords = list.words.map((w, i) =>
      i === idx ? { ...w, definition: trimmed } : w
    )
    dispatch({ type: 'UPDATE_LIST', payload: { ...list, words: updatedWords, updatedAt: Date.now() } })
    setEditingDefIdx(null)
  }

  const handleDedup = (list: WordList) => {
    const seen = new Set<string>()
    const deduped: WordEntry[] = []
    for (const w of list.words) {
      const key = w.word.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        deduped.push(w)
      }
    }
    if (deduped.length === list.words.length) return
    dispatch({ type: 'UPDATE_LIST', payload: { ...list, words: deduped, updatedAt: Date.now() } })
  }

  const getMissingDefCount = (list: WordList) =>
    list.words.filter((w) => !w.definition).length

  const handleBackfillDefinitions = async (list: WordList) => {
    const missing = list.words.filter((w) => !w.definition)
    if (missing.length === 0) return
    setBackfilling(list.id)
    setBackfillProgress(0)

    const updatedWords = [...list.words]
    let filled = 0
    for (let i = 0; i < updatedWords.length; i++) {
      if (updatedWords[i].definition) continue
      const data = await fetchWordData(updatedWords[i].word)
      if (data.definition) {
        updatedWords[i] = { ...updatedWords[i], ...data }
      }
      filled++
      setBackfillProgress(Math.round((filled / missing.length) * 100))
      if (filled < missing.length) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    dispatch({ type: 'UPDATE_LIST', payload: { ...list, words: updatedWords, updatedAt: Date.now() } })
    setBackfilling(null)
  }

  const handleRefreshDefinitions = async (list: WordList) => {
    if (list.words.length === 0) return
    setBackfilling(list.id)
    setBackfillProgress(0)

    const updatedWords = [...list.words]
    for (let i = 0; i < updatedWords.length; i++) {
      const data = await fetchWordData(updatedWords[i].word)
      updatedWords[i] = { ...updatedWords[i], ...data }
      setBackfillProgress(Math.round(((i + 1) / updatedWords.length) * 100))
      if (i < updatedWords.length - 1) {
        await new Promise((r) => setTimeout(r, 200))
      }
    }

    dispatch({ type: 'UPDATE_LIST', payload: { ...list, words: updatedWords, updatedAt: Date.now() } })
    setBackfilling(null)
  }

  const getDupCount = (list: WordList) => {
    const seen = new Set<string>()
    let dupes = 0
    for (const w of list.words) {
      const key = w.word.toLowerCase()
      if (seen.has(key)) dupes++
      else seen.add(key)
    }
    return dupes
  }

  const visibleLists = filterVisibleLists(state.wordLists, state)

  const handleSetListPin = (list: WordList, pin: string) => {
    dispatch({ type: 'UPDATE_LIST', payload: { ...list, pin: pin || undefined, updatedAt: Date.now() } })
    setEditingPinListId(null)
    setListPinValue('')
  }

  if (visibleLists.length === 0) {
    return (
      <div className="text-center text-base-content/50 py-8">
        <p className="text-4xl mb-2">📚</p>
        <p>No word lists yet. Add one above!</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-lg">Your Lists</h3>
      {visibleLists.map((list) => {
        const expanded = expandedId === list.id
        const dupCount = getDupCount(list)
        const missingDefs = getMissingDefCount(list)
        const isBackfilling = backfilling === list.id

        return (
          <motion.div
            key={list.id}
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="card bg-base-200 shadow-sm"
          >
            <div className="card-body p-4 gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-base">{list.name}</p>
                  <p className="text-sm text-base-content/60">
                    {list.words.length} word{list.words.length !== 1 ? 's' : ''}
                    {dupCount > 0 && (
                      <span className="text-warning ml-1">({dupCount} duplicate{dupCount !== 1 ? 's' : ''})</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-1">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className={`btn btn-sm btn-ghost btn-circle ${isBackfilling ? 'text-primary' : 'text-base-content/40 hover:text-primary'}`}
                    onClick={() => handleRefreshDefinitions(list)}
                    disabled={isBackfilling}
                    aria-label={`Refresh definitions for ${list.name}`}
                  >
                    {isBackfilling ? (
                      <span className="loading loading-spinner loading-xs" />
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.016 4.656v4.992" />
                      </svg>
                    )}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className={`btn btn-sm btn-ghost btn-circle ${expanded ? 'text-primary' : 'text-base-content/40'}`}
                    onClick={() => {
                      setExpandedId(expanded ? null : list.id)
                      setEditingIdx(null)
                      setEditingDefIdx(null)
                    }}
                    aria-label={`Edit ${list.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    className="btn btn-sm btn-ghost btn-circle text-error"
                    onClick={() => handleDelete(list)}
                    aria-label={`Delete ${list.name}`}
                  >
                    🗑️
                  </motion.button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="toggle toggle-sm toggle-primary"
                  checked={list.requirePractice !== false}
                  onChange={() => handleToggleRequirePractice(list)}
                />
                <span className="text-xs text-base-content/60">Practice before quiz</span>
              </label>

              {state.isAdmin && (
                <div className="flex items-center gap-2">
                  {editingPinListId === list.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        maxLength={10}
                        placeholder="PIN (6-10 chars)"
                        value={listPinValue}
                        onChange={(e) => setListPinValue(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10))}
                        className="input input-bordered input-xs w-28 rounded-lg"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && listPinValue.length >= 6) handleSetListPin(list, listPinValue)
                          if (e.key === 'Escape') setEditingPinListId(null)
                        }}
                      />
                      <button
                        className="btn btn-xs btn-primary rounded-lg"
                        onClick={() => handleSetListPin(list, listPinValue)}
                        disabled={listPinValue.length > 0 && listPinValue.length < 6}
                      >
                        Save
                      </button>
                      {list.pin && (
                        <button
                          className="btn btn-xs btn-ghost text-error rounded-lg"
                          onClick={() => handleSetListPin(list, '')}
                        >
                          Clear
                        </button>
                      )}
                      <button
                        className="btn btn-xs btn-ghost rounded-lg"
                        onClick={() => setEditingPinListId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      className="flex items-center gap-1 text-xs text-base-content/40 hover:text-base-content/60 transition-colors"
                      onClick={() => {
                        setEditingPinListId(list.id)
                        setListPinValue(list.pin || '')
                      }}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                      </svg>
                      PIN: {list.pin || 'none'}
                    </button>
                  )}
                </div>
              )}

              {isBackfilling && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-base-content/60">
                    <span className="loading loading-spinner loading-xs mr-1" />
                    Refreshing... {backfillProgress}%
                  </span>
                </div>
              )}

              {!isBackfilling && missingDefs > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-xs btn-outline btn-warning"
                    onClick={() => handleBackfillDefinitions(list)}
                  >
                    Fix {missingDefs} missing definition{missingDefs !== 1 ? 's' : ''}
                  </button>
                </div>
              )}

              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {dupCount > 0 && (
                      <button
                        className="btn btn-xs btn-warning mb-2"
                        onClick={() => handleDedup(list)}
                      >
                        Remove {dupCount} duplicate{dupCount !== 1 ? 's' : ''}
                      </button>
                    )}
                    <div className="space-y-1">
                      {list.words.map((w, idx) => (
                        <div key={`${w.word}-${idx}`} className={`bg-base-100 rounded-lg px-3 py-1.5 ${!w.definition ? 'border-l-2 border-warning' : ''}`}>
                          <div className="flex items-center gap-2">
                            {editingIdx === idx ? (
                              <>
                                <input
                                  type="text"
                                  className="input input-xs input-bordered flex-1"
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(list, idx)
                                    if (e.key === 'Escape' && loadingIdx === null) setEditingIdx(null)
                                  }}
                                  disabled={loadingIdx === idx}
                                  autoFocus
                                />
                                {loadingIdx === idx ? (
                                  <span className="loading loading-spinner loading-xs" />
                                ) : (
                                  <>
                                    <button
                                      className="btn btn-xs btn-success btn-circle"
                                      onClick={() => handleSaveEdit(list, idx)}
                                    >
                                      ✓
                                    </button>
                                    <button
                                      className="btn btn-xs btn-ghost btn-circle"
                                      onClick={() => setEditingIdx(null)}
                                    >
                                      ✕
                                    </button>
                                  </>
                                )}
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-xs btn-ghost btn-circle text-primary/50 hover:text-primary"
                                  onClick={() => speak(w.word, w.audioUrl)}
                                  aria-label={`Play ${w.word}`}
                                >
                                  🔊
                                </button>
                                <span className="flex-1 text-sm font-medium">{w.word}</span>
                                {!w.definition && (
                                  <span className="text-warning text-xs">no def</span>
                                )}
                                <button
                                  className="btn btn-xs btn-ghost btn-circle text-base-content/30 hover:text-base-content/60"
                                  onClick={() => handleStartEdit(w, idx)}
                                  aria-label={`Edit ${w.word}`}
                                >
                                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                  </svg>
                                </button>
                                <button
                                  className="btn btn-xs btn-ghost btn-circle text-base-content/30 hover:text-error"
                                  onClick={() => handleRemoveWord(list, idx)}
                                  aria-label={`Remove ${w.word}`}
                                >
                                  ✕
                                </button>
                              </>
                            )}
                          </div>
                          {editingIdx !== idx && (
                            <div className="flex items-start gap-1 mt-0.5">
                              {editingDefIdx === idx ? (
                                <div className="flex items-center gap-1 flex-1">
                                  <input
                                    type="text"
                                    className="input input-xs input-bordered flex-1"
                                    value={editDefValue}
                                    onChange={(e) => setEditDefValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveDefEdit(list, idx)
                                      if (e.key === 'Escape') setEditingDefIdx(null)
                                    }}
                                    placeholder="Enter definition..."
                                    autoFocus
                                  />
                                  <button
                                    className="btn btn-xs btn-success btn-circle"
                                    onClick={() => handleSaveDefEdit(list, idx)}
                                  >
                                    ✓
                                  </button>
                                  <button
                                    className="btn btn-xs btn-ghost btn-circle"
                                    onClick={() => setEditingDefIdx(null)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  className={`text-xs text-left flex-1 hover:underline cursor-pointer ${w.definition ? 'text-base-content/50' : 'text-warning/70 italic'}`}
                                  onClick={() => handleStartDefEdit(w, idx)}
                                  aria-label={`Edit definition for ${w.word}`}
                                >
                                  {w.definition || 'tap to add definition'}
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
