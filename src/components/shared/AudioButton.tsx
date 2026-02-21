import { motion } from 'motion/react'
import { useSpeech } from '../../hooks/useSpeech'

interface AudioButtonProps {
  word: string
  audioUrl: string | null
  size?: 'sm' | 'md' | 'lg'
  label?: string
  spellAfter?: boolean
}

export function AudioButton({
  word,
  audioUrl,
  size = 'md',
  label,
  spellAfter = false,
}: AudioButtonProps) {
  const { speak, speakThenSpell } = useSpeech()

  const sizeClass = {
    sm: 'btn-sm text-lg',
    md: 'btn-md text-2xl',
    lg: 'btn-lg text-3xl',
  }[size]

  const handleClick = spellAfter
    ? () => speakThenSpell(word, audioUrl)
    : () => speak(word, audioUrl)

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      className={`btn btn-circle btn-primary ${sizeClass} select-none touch-none`}
      onClick={handleClick}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label || `Hear the word ${word}`}
    >
      🔊
    </motion.button>
  )
}
