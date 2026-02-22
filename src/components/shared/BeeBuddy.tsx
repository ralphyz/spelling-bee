import { motion } from 'motion/react'

type BeeMood = 'welcome' | 'encourage' | 'celebrate' | 'thinking' | 'neutral'
type BeeSize = 'sm' | 'md' | 'lg' | 'xl'

interface BeeBuddyProps {
  mood: BeeMood
  size?: BeeSize
  message?: string
}

const sizeClasses: Record<BeeSize, string> = {
  sm: 'text-2xl',
  md: 'text-4xl',
  lg: 'text-5xl',
  xl: 'text-7xl',
}

const moodAnimations: Record<BeeMood, {
  animate: Record<string, number[]>
  transition: Record<string, unknown>
}> = {
  welcome: {
    animate: { y: [0, -10, 0], rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] },
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
  },
  encourage: {
    animate: { y: [0, -4, 0] },
    transition: { repeat: Infinity, duration: 1.5, ease: 'easeInOut' },
  },
  celebrate: {
    animate: { y: [0, -10, 0], rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] },
    transition: { repeat: Infinity, duration: 1.2, ease: 'easeInOut' },
  },
  thinking: {
    animate: { rotate: [0, 5, 0] },
    transition: { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
  },
  neutral: {
    animate: { y: [0, -8, 0], rotate: [0, 4, -4, 0] },
    transition: { repeat: Infinity, duration: 1.8, ease: 'easeInOut' },
  },
}

export function BeeBuddy({ mood, size = 'md', message }: BeeBuddyProps) {
  const anim = moodAnimations[mood]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative inline-flex flex-col items-center">
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-base-200 rounded-2xl px-3 py-1.5 text-sm font-medium text-base-content/80 shadow-sm mb-1 max-w-[200px] text-center relative"
          >
            {message}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-base-200 rotate-45" />
          </motion.div>
        )}
        <motion.span
          animate={anim.animate}
          transition={anim.transition}
          className={`${sizeClasses[size]} leading-none select-none`}
        >
          🐝
        </motion.span>
      </div>
    </div>
  )
}
