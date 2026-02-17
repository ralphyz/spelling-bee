import { motion } from 'motion/react'
import { useApp } from '../../context/AppContext'
import { getAvatarSrc, type AvatarPose } from '../../utils/themes'

export function PageAvatar({ pose, size = 'lg' }: { pose: AvatarPose; size?: 'md' | 'lg' | 'xl' }) {
  const { state } = useApp()
  const user = state.users.find((u) => u.id === state.currentUserId)
  if (!user) return null

  const src = getAvatarSrc(user.avatar, pose)
  const fallbackSrc = getAvatarSrc(user.avatar)

  const sizeClasses = {
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  }

  return (
    <motion.div
      key={`${user.id}-${user.avatar}-${pose}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className="flex justify-center"
    >
      <img
        key={`${user.id}-${user.avatar}-${pose}`}
        src={src ?? fallbackSrc ?? ''}
        alt={user.name}
        className={`${sizeClasses[size]} rounded-2xl object-cover drop-shadow-lg bg-white`}
        onError={(e) => {
          if (fallbackSrc && e.currentTarget.src !== fallbackSrc) {
            e.currentTarget.src = fallbackSrc
          }
        }}
      />
    </motion.div>
  )
}
