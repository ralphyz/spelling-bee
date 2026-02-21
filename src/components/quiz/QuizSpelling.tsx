import { motion } from 'motion/react'
import { AlphabetKeyboard } from '../shared/AlphabetKeyboard'
import { LetterTileRow } from '../shared/LetterTileRow'
import { AudioButton } from '../shared/AudioButton'
import { useApp } from '../../context/AppContext'
import type { WordEntry } from '../../types'

interface QuizSpellingProps {
  word: WordEntry
  typedLetters: string[]
  onKey: (letter: string) => void
  onDelete: () => void
  onRemove: (index: number) => void
  onSubmit: () => void
}

export function QuizSpelling({
  word,
  typedLetters,
  onKey,
  onDelete,
  onRemove,
  onSubmit,
}: QuizSpellingProps) {
  const { state } = useApp()
  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const highlightMode = currentUser?.highlightModes?.quiz ?? false

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="text-center space-y-1">
        <AudioButton word={word.word} audioUrl={word.audioUrl} size="md" />
        {word.definition && (
          <p className="text-sm text-base-content/60 px-4">{word.definition}</p>
        )}
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
        submitLabel="I'm Done!"
      />
    </motion.div>
  )
}
