import { AnimatePresence } from 'motion/react'
import { CelebrationOverlay } from '../shared/CelebrationOverlay'
import { EncouragementOverlay } from '../shared/EncouragementOverlay'

interface QuizResultProps {
  correct: boolean
  correctWord: string
  typedWord: string
  onNext: () => void
}

export function QuizResult({
  correct,
  correctWord,
  typedWord,
  onNext,
}: QuizResultProps) {
  return (
    <AnimatePresence>
      {correct ? (
        <CelebrationOverlay onDone={onNext} />
      ) : (
        <EncouragementOverlay
          correctWord={correctWord}
          typedWord={typedWord}
          onDone={onNext}
        />
      )}
    </AnimatePresence>
  )
}
