import { useState, useCallback, useRef } from 'react'
import type { WordEntry, QuizSessionState, QuizResult } from '../types'

export function useQuizSession(words: WordEntry[]) {
  const [session, setSession] = useState<QuizSessionState>({
    phase: 'prompt',
    words,
    currentIndex: 0,
    typedLetters: [],
    results: [],
  })

  const cursorRef = useRef<number | null>(null)

  const startSpelling = useCallback(() => {
    cursorRef.current = null
    setSession((s) => ({ ...s, phase: 'spelling' }))
  }, [])

  const typeLetter = useCallback((letter: string) => {
    const cursor = cursorRef.current
    cursorRef.current = null
    setSession((s) => {
      if (cursor !== null) {
        const newLetters = [...s.typedLetters]
        newLetters[cursor] = letter
        return { ...s, typedLetters: newLetters }
      }
      const currentWord = s.words[s.currentIndex]
      if (currentWord && s.typedLetters.length >= currentWord.word.length) {
        const emptyIdx = s.typedLetters.findIndex((l) => l === '')
        if (emptyIdx === -1) return s
        const newLetters = [...s.typedLetters]
        newLetters[emptyIdx] = letter
        return { ...s, typedLetters: newLetters }
      }
      return { ...s, typedLetters: [...s.typedLetters, letter] }
    })
  }, [])

  const deleteLetter = useCallback(() => {
    cursorRef.current = null
    setSession((s) => ({
      ...s,
      typedLetters: s.typedLetters.slice(0, -1),
    }))
  }, [])

  const removeLetter = useCallback((index: number) => {
    cursorRef.current = index
    setSession((s) => ({
      ...s,
      typedLetters: s.typedLetters.map((l, i) => i === index ? '' : l),
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
    cursorRef.current = null
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
      cursorRef.current = null
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
    removeLetter,
    submit,
    next,
    reset,
  }
}
