import { motion } from 'motion/react'
import { useApp } from '../context/AppContext'
import { BeeBuddy } from '../components/shared/BeeBuddy'
import { PageAvatar } from '../components/shared/PageAvatar'
import type { HeatmapLevels } from '../types'
import { ACHIEVEMENTS, CATEGORIES } from '../utils/achievements'
import { MISCHIEVEMENTS } from '../utils/mishchievements'

const HEATMAP_OPTIONS: { levels: HeatmapLevels; colors: string[]; label: string }[] = [
  {
    levels: 2,
    colors: ['bg-red-500', 'bg-green-500'],
    label: '2 colors',
  },
  {
    levels: 3,
    colors: ['bg-red-500', 'bg-amber-400', 'bg-green-500'],
    label: '3 colors',
  },
  {
    levels: 4,
    colors: ['bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500'],
    label: '4 colors',
  },
  {
    levels: 5,
    colors: ['bg-red-500', 'bg-orange-400', 'bg-amber-400', 'bg-lime-400', 'bg-green-500'],
    label: '5 colors',
  },
]

export function OptionsPage() {
  const { state, dispatch } = useApp()
  const currentLevels = state.settings.heatmapLevels || 3

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <BeeBuddy mood="neutral" size="md" />
        <PageAvatar pose="options" size="lg" />
        <h1 className="text-2xl font-bold text-primary">Options</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-4">
          <h3 className="font-bold text-lg">Progress Heatmap</h3>
          <p className="text-sm text-base-content/60">
            Choose how many color levels to show on the word heatmap.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {HEATMAP_OPTIONS.map((opt) => (
              <button
                key={opt.levels}
                onClick={() =>
                  dispatch({ type: 'UPDATE_SETTINGS', payload: { heatmapLevels: opt.levels } })
                }
                className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
                  opt.levels === currentLevels
                    ? 'ring-2 ring-primary bg-primary/10'
                    : 'bg-base-100 hover:bg-base-300/50'
                }`}
              >
                <div className="flex gap-1.5">
                  {opt.colors.map((c, i) => (
                    <div key={i} className={`w-5 h-5 rounded-full ${c}`} />
                  ))}
                </div>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-3">
          <h3 className="font-bold text-lg">Achievements</h3>
          <p className="text-sm text-base-content/60">
            Earn these by practicing and quizzing!
          </p>
          <div className="space-y-4">
            {CATEGORIES.map((cat) => {
              const catAchievements = ACHIEVEMENTS.filter((a) => a.category === cat.id)
              if (catAchievements.length === 0) return null
              return (
                <div key={cat.id}>
                  <h4 className="text-sm font-semibold text-base-content/50 uppercase tracking-wide mb-2">
                    {cat.label}
                  </h4>
                  <div className="grid gap-2">
                    {catAchievements.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl bg-base-100">
                        <span className="text-2xl">{a.emoji}</span>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{a.name}</p>
                          <p className="text-xs text-base-content/60">{a.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-3">
          <h3 className="font-bold text-lg">Mischievements</h3>
          <p className="text-sm text-base-content/60">
            Unlocked by making mistakes — wear them with pride!
          </p>
          <div className="grid gap-2">
            {MISCHIEVEMENTS.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-2 rounded-xl bg-base-100">
                <span className="text-2xl">{m.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{m.name}</p>
                  <p className="text-xs text-base-content/60">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
