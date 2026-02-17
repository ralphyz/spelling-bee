import { motion } from 'motion/react'
import { WordCard } from '../shared/WordCard'
import type { WordEntry } from '../../types'

interface LearnWordCardProps {
  word: WordEntry
  onReady: () => void
}

export function LearnWordCard({ word, onReady }: LearnWordCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="space-y-4"
    >
      <WordCard word={word} showWord />
      <motion.button
        whileTap={{ scale: 0.95 }}
        className="btn btn-primary btn-lg w-full rounded-2xl text-lg"
        onClick={onReady}
      >
        I'm Ready to Spell It!
      </motion.button>
    </motion.div>
  )
}
