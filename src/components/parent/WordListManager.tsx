import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'
import type { WordList, WordEntry } from '../../types'

export function WordListManager() {
  const { state, dispatch } = useApp()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

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

  const handleSaveEdit = (list: WordList, idx: number) => {
    const trimmed = editValue.trim()
    if (!trimmed || trimmed === list.words[idx].word) {
      setEditingIdx(null)
      return
    }
    const updatedWords = list.words.map((w, i) =>
      i === idx ? { ...w, word: trimmed } : w
    )
    dispatch({ type: 'UPDATE_LIST', payload: { ...list, words: updatedWords, updatedAt: Date.now() } })
    setEditingIdx(null)
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

  if (state.wordLists.length === 0) {
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
      {state.wordLists.map((list) => {
        const expanded = expandedId === list.id
        const dupCount = getDupCount(list)

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
                    className={`btn btn-sm btn-ghost btn-circle ${expanded ? 'text-primary' : 'text-base-content/40'}`}
                    onClick={() => {
                      setExpandedId(expanded ? null : list.id)
                      setEditingIdx(null)
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
                        <div key={`${w.word}-${idx}`} className="flex items-center gap-2 bg-base-100 rounded-lg px-3 py-1.5">
                          {editingIdx === idx ? (
                            <>
                              <input
                                type="text"
                                className="input input-xs input-bordered flex-1"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveEdit(list, idx)
                                  if (e.key === 'Escape') setEditingIdx(null)
                                }}
                                autoFocus
                              />
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
                          ) : (
                            <>
                              <span className="flex-1 text-sm">{w.word}</span>
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
