import { useState, useCallback, useEffect, useRef } from 'react'
import type { WordEntry, LearnSessionState } from '../types'

const STORAGE_KEY = 'spelling-bee-learn-session'

function loadSession(): LearnSessionState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as LearnSessionState
  } catch { /* ignore */ }
  return null
}

function saveToStorage(session: LearnSessionState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch { /* ignore */ }
}

function clearStorage() {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch { /* ignore */ }
}

export function useLearnSession(words: WordEntry[], listId: string) {
  const [session, setSession] = useState<LearnSessionState>(() => {
    const saved = loadSession()
    // Restore if same list and not done
    if (saved && saved.listId === listId && saved.phase !== 'done' && saved.words.length > 0) {
      return saved
    }
    return {
      phase: 'study',
      words,
      currentIndex: 0,
      typedLetters: [],
      isCorrect: null,
      results: [],
      listId,
    }
  })

  const skipSave = useRef(false)

  // Persist session on every change
  useEffect(() => {
    if (skipSave.current) {
      skipSave.current = false
      return
    }
    saveToStorage(session)
  }, [session])

  const startPractice = useCallback(() => {
    setSession((s) => ({
      ...s,
      phase: 'practice',
      typedLetters: [],
      isCorrect: null,
    }))
  }, [])

  const typeLetter = useCallback((letter: string) => {
    setSession((s) => ({
      ...s,
      typedLetters: [...s.typedLetters, letter],
    }))
  }, [])

  const deleteLetter = useCallback(() => {
    setSession((s) => ({
      ...s,
      typedLetters: s.typedLetters.slice(0, -1),
    }))
  }, [])

  const checkAnswer = useCallback(() => {
    setSession((s) => {
      const currentWord = s.words[s.currentIndex]
      const typed = s.typedLetters.join('')
      const correct = typed === currentWord.word
      return {
        ...s,
        phase: 'feedback',
        isCorrect: correct,
        results: [
          ...s.results,
          { word: currentWord.word, typed, correct },
        ],
      }
    })
  }, [])

  const next = useCallback(() => {
    setSession((s) => {
      const nextIndex = s.currentIndex + 1
      if (nextIndex >= s.words.length) {
        clearStorage()
        return { ...s, phase: 'done' }
      }
      return {
        ...s,
        phase: 'study',
        currentIndex: nextIndex,
        typedLetters: [],
        isCorrect: null,
      }
    })
  }, [])

  const retry = useCallback(() => {
    setSession((s) => ({
      ...s,
      phase: 'practice',
      typedLetters: [],
      isCorrect: null,
    }))
  }, [])

  const reset = useCallback(
    (newWords?: WordEntry[]) => {
      clearStorage()
      skipSave.current = true
      const fresh: LearnSessionState = {
        phase: 'study',
        words: newWords || words,
        currentIndex: 0,
        typedLetters: [],
        isCorrect: null,
        results: [],
        listId,
      }
      setSession(fresh)
      saveToStorage(fresh)
    },
    [words, listId]
  )

  const currentWord = session.words[session.currentIndex] || null

  return {
    session,
    currentWord,
    startPractice,
    typeLetter,
    deleteLetter,
    checkAnswer,
    next,
    retry,
    reset,
  }
}
