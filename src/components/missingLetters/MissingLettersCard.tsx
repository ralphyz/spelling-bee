import { motion } from 'motion/react'
import { AlphabetKeyboard } from '../shared/AlphabetKeyboard'
import { AudioButton } from '../shared/AudioButton'
import { useApp } from '../../context/AppContext'
import type { WordEntry } from '../../types'

interface MissingLettersCardProps {
  word: WordEntry
  blanks: number[]
  typedLetters: string[]
  onKey: (letter: string) => void
  onDelete: () => void
  onRemove: (index: number) => void
  onSubmit: () => void
}

export function MissingLettersCard({
  word,
  blanks,
  typedLetters,
  onKey,
  onDelete,
  onRemove,
  onSubmit,
}: MissingLettersCardProps) {
  const { state } = useApp()
  const currentUser = state.users.find((u) => u.id === state.currentUserId)
  const scale = currentUser?.keyboardScale ?? 1
  const highlightMode = currentUser?.highlightModes?.missingLetters ?? false
  const tileSize = Math.round(44 * scale)
  const fontSize = Math.round(20 * scale)

  const letters = word.word.split('')
  let blankIdx = 0

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="space-y-4"
    >
      <div className="text-center">
        <AudioButton word={word.word} audioUrl={word.audioUrl} size="lg" />
        {word.definition && (
          <p className="text-sm text-base-content/60 px-4 mt-2">{word.definition}</p>
        )}
      </div>

      {/* Tile row: given letters shown, blanks interactive */}
      <div className="flex flex-wrap gap-1.5 justify-center items-center" style={{ minHeight: tileSize + 8 }}>
        {letters.map((letter, i) => {
          const isBlank = blanks.includes(i)
          if (isBlank) {
            const currentBlankIdx = blankIdx
            blankIdx++
            const typed = typedLetters[currentBlankIdx]
            const correctLetter = word.word[i]
            const isMatch = typed && highlightMode ? typed.toLowerCase() === correctLetter.toLowerCase() : null
            return (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25, delay: i * 0.03 }}
                className={`flex items-center justify-center rounded-lg border-2 font-bold ${
                  typed
                    ? highlightMode
                      ? isMatch
                        ? 'bg-success/20 border-success text-success cursor-pointer active:scale-90 hover:brightness-90'
                        : 'bg-error/20 border-error text-error cursor-pointer active:scale-90 hover:brightness-90'
                      : 'bg-primary/20 border-primary text-primary cursor-pointer active:scale-90 hover:brightness-90'
                    : 'bg-base-100 border-primary/40 border-dashed'
                }`}
                style={{ width: tileSize, height: tileSize, fontSize }}
                onClick={typed ? () => onRemove(currentBlankIdx) : undefined}
              >
                {typed || ''}
              </motion.div>
            )
          }
          return (
            <motion.div
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25, delay: i * 0.03 }}
              className="flex items-center justify-center rounded-lg border-2 font-bold bg-base-300 border-base-content/20 text-base-content/60"
              style={{ width: tileSize, height: tileSize, fontSize }}
            >
              {letter}
            </motion.div>
          )
        })}
      </div>

      <AlphabetKeyboard
        onKey={onKey}
        onDelete={onDelete}
        onSubmit={onSubmit}
        submitLabel="Check It!"
      />
    </motion.div>
  )
}
