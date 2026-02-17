import { motion } from 'motion/react'
import { useApp } from '../context/AppContext'
import type { WordCountOption, HeatmapLevels } from '../types'
import { PageAvatar } from '../components/shared/PageAvatar'

const STEPS: WordCountOption[] = [5, 10, 15, 20, 25, 'all']

function stepToIndex(val: WordCountOption): number {
  const idx = STEPS.indexOf(val)
  return idx === -1 ? 0 : idx
}

function indexToStep(idx: number): WordCountOption {
  return STEPS[Math.min(Math.max(0, idx), STEPS.length - 1)]
}

function formatLabel(val: WordCountOption): string {
  return val === 'all' ? 'All' : String(val)
}

function WordCountSlider({
  label,
  emoji,
  value,
  color,
  onChange,
}: {
  label: string
  emoji: string
  value: WordCountOption
  color: 'primary' | 'secondary'
  onChange: (val: WordCountOption) => void
}) {
  const idx = stepToIndex(value)

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">{emoji} {label}</span>
        <span className={`badge badge-${color} badge-sm`}>
          {formatLabel(value)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {STEPS.map((s, i) => {
          const isSelected = i <= idx
          return (
            <button
              key={String(s)}
              onClick={() => onChange(s)}
              className="flex-1 flex flex-col items-center gap-1.5"
            >
              <div
                className={`w-full h-2 rounded-full transition-colors ${
                  isSelected
                    ? color === 'primary' ? 'bg-primary' : 'bg-secondary'
                    : 'bg-base-300'
                }`}
              />
              <span
                className={`text-xs transition-colors ${
                  i === idx
                    ? 'font-bold ' + (color === 'primary' ? 'text-primary' : 'text-secondary')
                    : 'text-base-content/40'
                }`}
              >
                {formatLabel(s)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

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
        <PageAvatar pose="options" size="lg" />
        <h1 className="text-2xl font-bold text-primary">Options</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-5">
          <h3 className="font-bold text-lg">Words Per Session</h3>

          <WordCountSlider
            label="Learn"
            emoji="📖"
            value={state.settings.learnWordCount}
            color="primary"
            onChange={(val) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { learnWordCount: val } })
            }
          />

          <WordCountSlider
            label="Quiz"
            emoji="🐝"
            value={state.settings.quizWordCount}
            color="secondary"
            onChange={(val) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { quizWordCount: val } })
            }
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card bg-base-200 shadow-md"
      >
        <div className="card-body p-4 gap-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Keyboard Size</h3>
            <span className="badge badge-primary badge-sm">
              {Math.round((state.settings.keyboardScale ?? 1) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.05"
            value={state.settings.keyboardScale ?? 1}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_SETTINGS', payload: { keyboardScale: parseFloat(e.target.value) } })
            }
            className="range range-primary range-sm w-full"
          />
          <div className="flex justify-between text-xs text-base-content/40 px-0.5">
            <span>Small</span>
            <span>Large</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
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
    </div>
  )
}
