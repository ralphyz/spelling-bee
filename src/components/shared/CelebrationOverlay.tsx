import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { useSound } from '../../hooks/useSound'

interface CelebrationOverlayProps {
  onDone: () => void
}

const confettiPieces = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.5,
  emoji: ['🌟', '⭐', '✨', '🎉', '🐝'][i % 5],
}))

export function CelebrationOverlay({ onDone }: CelebrationOverlayProps) {
  const { correctSound } = useSound()
  const firedRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    correctSound()
    const timer = setTimeout(() => {
      if (!firedRef.current) {
        firedRef.current = true
        onDoneRef.current()
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [correctSound])

  const handleClick = () => {
    if (!firedRef.current) {
      firedRef.current = true
      onDoneRef.current()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={handleClick}
    >
      {confettiPieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ y: -20, x: `${piece.x}vw`, opacity: 0 }}
          animate={{
            y: '100vh',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 2,
            delay: piece.delay,
            ease: 'easeIn',
          }}
          className="fixed top-0 left-0 text-2xl pointer-events-none"
        >
          {piece.emoji}
        </motion.span>
      ))}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="bg-base-100 border-2 border-success rounded-3xl p-8 shadow-2xl text-center"
      >
        <p className="text-5xl mb-2">🎉</p>
        <p className="text-3xl font-bold text-success">Correct!</p>
        <p className="text-lg mt-1 text-base-content/70">Great job!</p>
      </motion.div>
    </motion.div>
  )
}
