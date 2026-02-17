import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useSound } from '../../hooks/useSound'

interface EncouragementOverlayProps {
  correctWord: string
  typedWord: string
  onDone: () => void
}

export function EncouragementOverlay({
  correctWord,
  typedWord: _typedWord,
  onDone,
}: EncouragementOverlayProps) {
  const { incorrectSound } = useSound()

  useEffect(() => {
    incorrectSound()
  }, [incorrectSound])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onDone}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.1, 1] }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-base-100 border-2 border-error rounded-3xl p-8 shadow-2xl text-center max-w-sm mx-4"
      >
        <p className="text-4xl mb-3">💪</p>
        <p className="text-2xl font-bold text-error">Almost!</p>
        <p className="text-base-content/70 mt-2 mb-4">The correct spelling is:</p>
        <p className="text-3xl font-bold text-primary tracking-wider mb-4">
          {correctWord}
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary btn-lg rounded-2xl"
          onClick={onDone}
        >
          Keep Going!
        </motion.button>
      </motion.div>
    </motion.div>
  )
}
