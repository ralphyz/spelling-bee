import { motion, AnimatePresence } from 'motion/react'
import { useApp } from '../../context/AppContext'

interface LetterTileRowProps {
  letters: string[]
  correctWord?: string
  showFeedback?: boolean
}

export function LetterTileRow({
  letters,
  correctWord,
  showFeedback = false,
}: LetterTileRowProps) {
  const { state } = useApp()
  const scale = state.settings.keyboardScale ?? 1
  const tileSize = Math.round(44 * scale)
  const fontSize = Math.round(20 * scale)
  const correctLetters = correctWord?.split('') || []

  return (
    <div className="flex flex-wrap gap-1.5 justify-center items-center" style={{ minHeight: tileSize + 8 }}>
      <AnimatePresence mode="popLayout">
        {letters.map((letter, i) => {
          let bg = 'bg-base-200 border-base-300'
          if (showFeedback && correctWord) {
            bg =
              letter === correctLetters[i]
                ? 'bg-success/20 border-success'
                : 'bg-error/20 border-error'
          }

          return (
            <motion.div
              key={`${i}-${letter}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className={`flex items-center justify-center rounded-lg border-2 font-bold ${bg}`}
              style={{ width: tileSize, height: tileSize, fontSize }}
            >
              {letter}
            </motion.div>
          )
        })}
      </AnimatePresence>
      {letters.length === 0 && (
        <span className="text-base-content/30 text-lg">
          Tap the letters below...
        </span>
      )}
    </div>
  )
}
