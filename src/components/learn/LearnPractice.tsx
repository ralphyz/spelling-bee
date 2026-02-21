import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { AlphabetKeyboard } from '../shared/AlphabetKeyboard'
import { LetterTileRow } from '../shared/LetterTileRow'
import { AudioButton } from '../shared/AudioButton'
import { useApp } from '../../context/AppContext'
import { incrementPeek } from '../../utils/mishchievements'
import type { WordEntry } from '../../types'

interface LearnPracticeProps {
  word: WordEntry
  typedLetters: string[]
  onKey: (letter: string) => void
  onDelete: () => void
  onRemove: (index: number) => void
  onSubmit: () => void
}

export function LearnPractice({
  word,
  typedLetters,
  onKey,
  onDelete,
  onRemove,
  onSubmit,
}: LearnPracticeProps) {
  const { state } = useApp()
  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const highlightMode = currentUser?.highlightModes?.learn ?? false
  const [peeking, setPeeking] = useState(false)

  const startPeek = useCallback(() => {
    setPeeking(true)
    incrementPeek(state.currentUserId)
  }, [state.currentUserId])
  const stopPeek = useCallback(() => setPeeking(false), [])

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-4"
    >
      <div className="text-center">
        <p className="text-lg text-base-content/70 mb-2">
          Now spell it from memory!
        </p>
        <AudioButton word={word.word} audioUrl={word.audioUrl} size="lg" />
        {word.definition && (
          <p className="text-sm text-base-content/60 px-4">{word.definition}</p>
        )}
        <div className="mt-2">
          {peeking ? (
            <p className="text-2xl font-bold text-primary">{word.word}</p>
          ) : (
            <p className="text-2xl font-bold text-transparent select-none">
              {word.word.replace(/./g, '•')}
            </p>
          )}
          <motion.button
            whileTap={{ scale: 0.95 }}
            className="btn btn-outline btn-sm rounded-xl mt-1 select-none touch-none"
            onMouseDown={startPeek}
            onMouseUp={stopPeek}
            onMouseLeave={stopPeek}
            onTouchStart={startPeek}
            onTouchEnd={stopPeek}
            onContextMenu={(e) => e.preventDefault()}
          >
            👀 Peek
          </motion.button>
        </div>
      </div>

      <LetterTileRow
        letters={typedLetters}
        correctWord={highlightMode ? word.word : undefined}
        showFeedback={highlightMode}
        onRemove={onRemove}
      />

      <AlphabetKeyboard
        onKey={onKey}
        onDelete={onDelete}
        onSubmit={onSubmit}
        submitLabel="Check It!"
      />
    </motion.div>
  )
}
