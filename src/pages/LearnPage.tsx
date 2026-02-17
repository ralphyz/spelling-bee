import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { useApp, saveSession } from '../context/AppContext'
import { useSpacedRepetition } from '../hooks/useSpacedRepetition'
import { useLearnSession } from '../hooks/useLearnSession'
import { LearnWordCard } from '../components/learn/LearnWordCard'
import { LearnPractice } from '../components/learn/LearnPractice'
import { LetterTileRow } from '../components/shared/LetterTileRow'
import { ProgressBar } from '../components/shared/ProgressBar'
import { CelebrationOverlay } from '../components/shared/CelebrationOverlay'
import { EncouragementOverlay } from '../components/shared/EncouragementOverlay'
import { PageAvatar } from '../components/shared/PageAvatar'

export function LearnPage() {
  const { state } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const missed = (location.state as { missed?: boolean })?.missed === true
  const activeList = state.wordLists.find((l) => l.id === state.activeListId)
  const listId = activeList?.id || ''
  const { getSessionWords, getMissedSessionWords, recordResult } = useSpacedRepetition(state.currentUserId, listId)

  const wordCount = state.settings.learnWordCount === 'all'
    ? activeList?.words.length ?? 6
    : Math.min(state.settings.learnWordCount, activeList?.words.length ?? 0)

  const getWords = useCallback(
    () => {
      if (!activeList) return []
      return missed
        ? getMissedSessionWords(activeList.words, wordCount)
        : getSessionWords(activeList.words, wordCount)
    },
    [activeList, missed, getMissedSessionWords, getSessionWords, wordCount]
  )

  // Compute session words once on mount — stable during the session
  const [sessionWords] = useState(() => getWords())

  const {
    session,
    currentWord,
    startPractice,
    typeLetter,
    deleteLetter,
    checkAnswer,
    next,
    retry,
    reset,
  } = useLearnSession(sessionWords, listId)

  const handleNext = useCallback(() => {
    if (currentWord && session.isCorrect !== null) {
      // Skip recording if this word was already recorded as incorrect (retry)
      const alreadyMissed = session.results.some(
        (r) => r.word === currentWord.word && !r.correct
      )
      if (!alreadyMissed) {
        recordResult(currentWord.word, session.isCorrect)
      }
    }
    next()
  }, [currentWord, session.isCorrect, session.results, recordResult, next])

  const savedRef = useRef(false)
  useEffect(() => {
    if (session.phase === 'done' && activeList && !savedRef.current) {
      savedRef.current = true
      // Deduplicate results by word — first attempt wins (miss stays missed)
      const deduped = new Map<string, { word: string; typed: string; correct: boolean }>()
      for (const r of session.results) {
        if (!deduped.has(r.word)) {
          deduped.set(r.word, r)
        }
      }
      const results = Array.from(deduped.values())
      const correct = results.filter((r) => r.correct).length
      const score = Math.round((correct / results.length) * 100)
      saveSession({
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        listId: activeList.id,
        listName: activeList.name,
        mode: 'learn',
        results,
        score,
        userId: state.currentUserId || undefined,
      })
    }
  }, [session.phase, session.results, activeList])

  if (state.users.length > 0 && !state.currentUserId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <p className="text-4xl">👤</p>
        <p className="text-base-content/60">Pick a user from the header to start learning!</p>
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
        <p className="text-4xl">📖</p>
        <p className="text-base-content/60">
          {!activeList
            ? 'Select a word list from the home page first.'
            : 'All words mastered! Great job!'}
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

  if (session.phase === 'done') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <motion.p
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="text-6xl"
        >
          🌟
        </motion.p>
        <h2 className="text-2xl font-bold">Session Complete!</h2>
        <p className="text-base-content/60">Great learning session!</p>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn btn-primary btn-lg rounded-2xl"
            onClick={() => {
              savedRef.current = false
              reset(getWords())
            }}
          >
            Learn More
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn btn-ghost btn-lg rounded-2xl"
            onClick={() => navigate('/')}
          >
            Home
          </motion.button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <PageAvatar pose="learn" size="lg" />
      <p className="text-center text-sm font-semibold text-base-content/50 tracking-wide">{activeList.name}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <ProgressBar
            current={session.currentIndex}
            total={session.words.length}
            label="Progress"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          className="btn btn-ghost btn-sm rounded-xl text-base-content/50"
          onClick={() => {
            savedRef.current = false
            reset(getWords())
          }}
          title="Start over"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
          </svg>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {session.phase === 'study' && currentWord && (
          <LearnWordCard
            key={`study-${session.currentIndex}`}
            word={currentWord}
            onReady={startPractice}
          />
        )}

        {session.phase === 'practice' && currentWord && (
          <LearnPractice
            key={`practice-${session.currentIndex}`}
            word={currentWord}
            typedLetters={session.typedLetters}
            onKey={typeLetter}
            onDelete={deleteLetter}
            onSubmit={checkAnswer}
          />
        )}

        {session.phase === 'feedback' && currentWord && (
          <motion.div
            key={`feedback-${session.currentIndex}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4 text-center"
          >
            <LetterTileRow
              letters={session.typedLetters}
              correctWord={currentWord.word}
              showFeedback
            />
            <p className="text-xl font-bold text-primary">
              {currentWord.word}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {session.phase === 'feedback' && session.isCorrect === true && (
          <CelebrationOverlay onDone={handleNext} />
        )}
        {session.phase === 'feedback' &&
          session.isCorrect === false &&
          currentWord && (
            <EncouragementOverlay
              correctWord={currentWord.word}
              typedWord={session.typedLetters.join('')}
              onDone={() => {
                recordResult(currentWord.word, false)
                retry()
              }}
            />
          )}
      </AnimatePresence>
    </div>
  )
}
