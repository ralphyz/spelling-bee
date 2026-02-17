import { motion } from 'motion/react'
import { useSpeech } from '../../hooks/useSpeech'

interface AudioButtonProps {
  word: string
  audioUrl: string | null
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

export function AudioButton({
  word,
  audioUrl,
  size = 'md',
  label,
}: AudioButtonProps) {
  const { speak } = useSpeech()

  const sizeClass = {
    sm: 'btn-sm text-lg',
    md: 'btn-md text-2xl',
    lg: 'btn-lg text-3xl',
  }[size]

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className={`btn btn-circle btn-primary ${sizeClass}`}
      onClick={() => speak(word, audioUrl)}
      aria-label={label || `Hear the word ${word}`}
    >
      🔊
    </motion.button>
  )
}
