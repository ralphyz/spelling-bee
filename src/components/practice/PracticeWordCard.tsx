import { motion } from 'motion/react'
import { AlphabetKeyboard } from '../shared/AlphabetKeyboard'
import { LetterTileRow } from '../shared/LetterTileRow'
import { AudioButton } from '../shared/AudioButton'
import { useApp } from '../../context/AppContext'
import type { WordEntry } from '../../types'

interface PracticeWordCardProps {
  word: WordEntry
  typedLetters: string[]
  onKey: (letter: string) => void
  onDelete: () => void
  onRemove: (index: number) => void
  onSubmit: () => void
}

export function PracticeWordCard({
  word,
  typedLetters,
  onKey,
  onDelete,
  onRemove,
  onSubmit,
}: PracticeWordCardProps) {
  const { state } = useApp()
  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const highlightMode = currentUser?.highlightModes?.practice ?? false

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="space-y-4"
    >
      <div className="text-center">
        <p className="text-3xl font-bold text-primary mb-2">{word.word}</p>
        <AudioButton word={word.word} audioUrl={word.audioUrl} size="lg" spellAfter />
        {word.definition && (
          <p className="text-sm text-base-content/60 px-4 mt-2">{word.definition}</p>
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
        submitLabel="Check It!"
      />
    </motion.div>
  )
}
