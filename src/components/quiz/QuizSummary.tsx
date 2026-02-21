import { motion } from 'motion/react'
import type { QuizResult as QuizResultType } from '../../types'
import type { AchievementDef } from '../../utils/achievements'
import type { MischievementDef } from '../../utils/mishchievements'

interface QuizSummaryProps {
  results: QuizResultType[]
  onHome: () => void
  newAchievements?: AchievementDef[]
  newMischievements?: MischievementDef[]
}

export function QuizSummary({ results, onHome, newAchievements, newMischievements }: QuizSummaryProps) {
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

      {newAchievements && newAchievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: results.length * 0.1 + 0.3, type: 'spring' }}
          className="card bg-warning/10 border-2 border-warning shadow-lg max-w-sm mx-auto"
        >
          <div className="card-body p-4 gap-2 text-center">
            <p className="font-bold text-warning text-sm uppercase tracking-wider">
              Achievement Unlocked!
            </p>
            {newAchievements.map((a) => (
              <div key={a.id} className="flex items-center gap-3 justify-center">
                <span className="text-3xl">{a.emoji}</span>
                <div className="text-left">
                  <p className="font-bold">{a.name}</p>
                  <p className="text-xs text-base-content/60">{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {newMischievements && newMischievements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: results.length * 0.1 + 0.5, type: 'spring' }}
          className="card bg-error/10 border-2 border-error shadow-lg max-w-sm mx-auto"
        >
          <div className="card-body p-4 gap-2 text-center">
            <p className="font-bold text-error text-sm uppercase tracking-wider">
              Mischievement Unlocked!
            </p>
            {newMischievements.map((m) => (
              <div key={m.id} className="flex items-center gap-3 justify-center">
                <span className="text-3xl">{m.emoji}</span>
                <div className="text-left">
                  <p className="font-bold">{m.name}</p>
                  <p className="text-xs text-base-content/60">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <motion.button
        whileTap={{ scale: 0.95 }}
        className="btn btn-primary btn-lg rounded-2xl"
        onClick={onHome}
      >
        Home
      </motion.button>
    </motion.div>
  )
}
