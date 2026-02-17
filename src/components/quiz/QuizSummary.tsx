import { motion } from 'motion/react'
import type { QuizResult as QuizResultType } from '../../types'

interface QuizSummaryProps {
  results: QuizResultType[]
  onRestart: () => void
  onHome: () => void
}

export function QuizSummary({ results, onRestart, onHome }: QuizSummaryProps) {
  const correct = results.filter((r) => r.correct).length
  const total = results.length
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 text-center"
    >
      <div>
        <p className="text-5xl mb-2">{pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '💪'}</p>
        <h2 className="text-2xl font-bold">
          {correct} out of {total}!
        </h2>
        <p className="text-base-content/60 mt-1">
          {pct >= 80
            ? 'Amazing job!'
            : pct >= 50
              ? 'Good work! Keep practicing!'
              : "You're learning! Let's try again!"}
        </p>
      </div>

      <div className="space-y-2 max-w-sm mx-auto">
        {results.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-xl ${
              r.correct ? 'bg-success/10' : 'bg-error/10'
            }`}
          >
            <span className="font-bold">{r.word}</span>
            <span className="text-xl">{r.correct ? '✅' : '❌'}</span>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary btn-lg rounded-2xl"
          onClick={onRestart}
        >
          Try Again
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-ghost btn-lg rounded-2xl"
          onClick={onHome}
        >
          Home
        </motion.button>
      </div>
    </motion.div>
  )
}
