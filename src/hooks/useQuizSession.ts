import { useState, useCallback } from 'react'
import type { WordEntry, QuizSessionState, QuizResult } from '../types'

export function useQuizSession(words: WordEntry[]) {
  const [session, setSession] = useState<QuizSessionState>({
    phase: 'prompt',
    words,
    currentIndex: 0,
    typedLetters: [],
    results: [],
  })

  const startSpelling = useCallback(() => {
    setSession((s) => ({ ...s, phase: 'spelling' }))
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

  const submit = useCallback(() => {
    setSession((s) => {
      const currentWord = s.words[s.currentIndex]
      const typed = s.typedLetters.join('')
      const correct = typed === currentWord.word
      const result: QuizResult = {
        word: currentWord.word,
        typed,
        correct,
      }
      return {
        ...s,
        phase: 'result',
        results: [...s.results, result],
      }
    })
  }, [])

  const next = useCallback(() => {
    setSession((s) => {
      const nextIndex = s.currentIndex + 1
      if (nextIndex >= s.words.length) {
        return { ...s, phase: 'summary' }
      }
      return {
        ...s,
        phase: 'prompt',
        currentIndex: nextIndex,
        typedLetters: [],
      }
    })
  }, [])

  const reset = useCallback(
    (newWords?: WordEntry[]) => {
      setSession({
        phase: 'prompt',
        words: newWords || words,
        currentIndex: 0,
        typedLetters: [],
        results: [],
      })
    },
    [words]
  )

  const currentWord = session.words[session.currentIndex] || null

  return {
    session,
    currentWord,
    startSpelling,
    typeLetter,
    deleteLetter,
    submit,
    next,
    reset,
  }
}
