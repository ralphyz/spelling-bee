import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { useApp, saveSession, fetchSessions } from '../context/AppContext'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { useQuizSession } from '../hooks/useQuizSession'
import { QuizPrompt } from '../components/quiz/QuizPrompt'
import { QuizSpelling } from '../components/quiz/QuizSpelling'
import { QuizResult } from '../components/quiz/QuizResult'
import { QuizSummary } from '../components/quiz/QuizSummary'
import { ProgressBar } from '../components/shared/ProgressBar'
import { PageAvatar } from '../components/shared/PageAvatar'
import type { AchievementDef } from '../utils/achievements'
import { computeEarnedAchievementIds, getNewlyEarnedAchievements } from '../utils/achievements'
import { uuid } from '../utils/uuid'
import { incrementHighlightSessions, getMischiefStats, computeEarnedMischievementIds, getNewlyEarnedMischievements } from '../utils/mishchievements'
import type { MischievementDef } from '../utils/mishchievements'

export function QuizPage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const locState = location.state as { missed?: boolean; mostMissed?: boolean } | null
  const missed = locState?.missed === true
  const mostMissed = locState?.mostMissed === true
  const activeList = state.wordLists.find((l) => l.id === state.activeListId)
  const listId = activeList?.id || ''
  const { getSessionWords, getMissedSessionWords, getMostMissedSessionWords, recordResult } = useSpacedRepetition(state.currentUserId, listId)

  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const highlightOn = currentUser?.highlightModes?.quiz ?? false
  const quizWordCount = currentUser?.quizWordCount ?? state.settings.quizWordCount
  const wordCount = quizWordCount === 'all'
    ? activeList?.words.length ?? 6
    : Math.min(quizWordCount, activeList?.words.length ?? 0)

  const getWords = useCallback(
    () => {
      if (!activeList) return []
      if (mostMissed) return getMostMissedSessionWords(activeList.words, wordCount)
      if (missed) return getMissedSessionWords(activeList.words, wordCount)
      return getSessionWords(activeList.words, wordCount)
    },
    [activeList, missed, mostMissed, getMissedSessionWords, getMostMissedSessionWords, getSessionWords, wordCount]
  )

  // Compute session words once on mount — stable during the session
  const [sessionWords] = useState(() => getWords())

  const {
    session,
    currentWord,
    startSpelling,
    typeLetter,
    deleteLetter,
    removeLetter,
    submit,
    next,
    reset,
  } = useQuizSession(sessionWords)

  const handleNext = useCallback(() => {
    if (session.phase === 'summary') return
    const lastResult = session.results[session.results.length - 1]
    if (lastResult && currentWord) {
      recordResult(currentWord.word, lastResult.correct)
    }
    next()
  }, [session.phase, session.results, currentWord, recordResult, next])

  const [newAchievements, setNewAchievements] = useState<AchievementDef[]>([])
  const [newMischievements, setNewMischievements] = useState<MischievementDef[]>([])

  const savedRef = useRef(false)
  useEffect(() => {
    if (session.phase === 'summary' && activeList && !savedRef.current) {
      savedRef.current = true
      const correct = session.results.filter((r) => r.correct).length
      const score = Math.round((correct / session.results.length) * 100)
      const newRecord = {
        id: uuid(),
        date: new Date().toISOString(),
        listId: activeList.id,
        listName: activeList.name,
        mode: (highlightOn ? 'practice' : 'quiz') as 'practice' | 'quiz',
        results: session.results,
        score,
        userId: state.currentUserId || undefined,
        highlightOn,
      }

      // Track highlight mischievements
      if (highlightOn) {
        const mischiefBefore = computeEarnedMischievementIds(getMischiefStats(state.currentUserId))
        incrementHighlightSessions(state.currentUserId)
        const mischiefAfter = computeEarnedMischievementIds(getMischiefStats(state.currentUserId))
        setNewMischievements(getNewlyEarnedMischievements(mischiefBefore, mischiefAfter))
      }

      fetchSessions(state.currentUserId ? { userId: state.currentUserId } : undefined).then(
        (beforeSessions) => {
          const beforeIds = computeEarnedAchievementIds(beforeSessions, state, state.currentUserId)
          saveSession(newRecord).then(() => {
            const afterSessions = [...beforeSessions, newRecord]
            const afterIds = computeEarnedAchievementIds(afterSessions, state, state.currentUserId)
            setNewAchievements(getNewlyEarnedAchievements(beforeIds, afterIds))
          })
        },
      )
    }
  }, [session.phase, session.results, activeList])

  if (state.users.length > 0 && !state.currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-4xl">👤</p>
        <p className="text-base-content/60">Pick a user from the header to start a quiz!</p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary rounded-2xl"
          onClick={() => navigate('/')}
        >
          Go Home
        </motion.button>
      </div>
    )
  }

  if (!activeList || sessionWords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-4xl">🐝</p>
        <p className="text-base-content/60">
          {!activeList
            ? 'Select a word list from the home page first.'
            : 'All words mastered! Try Learn mode for review.'}
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary rounded-2xl"
          onClick={() => navigate('/')}
        >
          Go Home
        </motion.button>
      </div>
    )
  }

  if (session.phase === 'summary') {
    return (
      <div className="max-w-2xl mx-auto">
        <QuizSummary
          results={session.results}
          onHome={() => navigate('/')}
          newAchievements={newAchievements}
          newMischievements={newMischievements}
        />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageAvatar pose="quiz" size="lg" />
      <p className="text-center text-sm font-semibold text-base-content/50 tracking-wide">{activeList.name}</p>
      <ProgressBar
        current={session.currentIndex}
        total={session.words.length}
        label="Question"
      />

      {session.phase === 'prompt' && currentWord && (
        <QuizPrompt word={currentWord} onStart={startSpelling} />
      )}

      {session.phase === 'spelling' && currentWord && (
        <QuizSpelling
          word={currentWord}
          typedLetters={session.typedLetters}
          onKey={typeLetter}
          onDelete={deleteLetter}
          onRemove={removeLetter}
          onSubmit={submit}
        />
      )}

      {session.phase === 'result' && currentWord && (
        <QuizResult
          correct={session.results[session.results.length - 1]?.correct ?? false}
          correctWord={currentWord.word}
          typedWord={session.typedLetters.join('')}
          onNext={handleNext}
        />
      )}
    </div>
  )
}
