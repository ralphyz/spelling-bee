export const DEFAULT_THEME = 'sb-blue'

export const THEMES = [
  { id: 'sb-blue', name: 'Blue' },
  { id: 'sb-purple', name: 'Purple' },
  { id: 'sb-pink', name: 'Pink' },
  { id: 'sb-lavender', name: 'Lavender' },
  { id: 'sb-red', name: 'Red' },
  { id: 'sb-orange', name: 'Orange' },
  { id: 'sb-green', name: 'Green' },
  { id: 'sb-yellow', name: 'Yellow' },
] as const

export const AVATARS = [
  // food & animals
  { id: 'avocado', src: '/avatars/avocado.png', label: 'Avocado' },
  { id: 'pitbull', src: '/avatars/pitbull.png', label: 'Pitbull' },
  { id: 'elephant', src: '/avatars/elephant.png', label: 'Elephant' },
  // chess
  { id: 'chess-pawn', src: '/avatars/chess-pawn.png', label: 'Pawn' },
  { id: 'chess-queen', src: '/avatars/chess-queen.png', label: 'Queen' },
  { id: 'chess-knight', src: '/avatars/chess-knight.png', label: 'Knight' },
  { id: 'chess-rook', src: '/avatars/chess-rook.png', label: 'Rook' },
  // sports
  { id: 'basketball', src: '/avatars/basketball.png', label: 'Basketball' },
  { id: 'baseball', src: '/avatars/baseball.png', label: 'Baseball' },
  { id: 'football', src: '/avatars/football.png', label: 'Football' },
  { id: 'volleyball', src: '/avatars/volleyball.png', label: 'Volleyball' },
  // animals
  { id: 'spelling-bee', src: '/avatars/spelling-bee.png', label: 'Spelling Bee' },
  { id: 'buffalo', src: '/avatars/buffalo.png', label: 'Buffalo' },
  // people
  { id: 'girl-straight-hair', src: '/avatars/girl-straight-hair.png', label: 'Girl' },
  { id: 'karate-girl', src: '/avatars/karate-girl.png', label: 'Karate Girl' },
  { id: 'girl-brown', src: '/avatars/girl-brown.png', label: 'Girl' },
  { id: 'girl-blonde', src: '/avatars/girl-blonde.png', label: 'Girl' },
  { id: 'girl-redhead', src: '/avatars/girl-redhead.png', label: 'Girl' },
  { id: 'boy-brown', src: '/avatars/boy-brown.png', label: 'Boy' },
  { id: 'boy-blonde', src: '/avatars/boy-blonde.png', label: 'Boy' },
  { id: 'boy-black', src: '/avatars/boy-black.png', label: 'Boy' },
  // things
  { id: 'fire', src: '/avatars/fire.png', label: 'Fire' },
  { id: 'cat', src: '/avatars/cat.png', label: 'Cat' },
  { id: 'tools', src: '/avatars/tools.png', label: 'Tools' },
  { id: 'bbq-steak', src: '/avatars/bbq-steak.png', label: 'Steak' },
  { id: 'bbq-steak-rare', src: '/avatars/bbq-steak-rare.png', label: 'Steak Rare' },
  { id: 'bbq-steak-medium', src: '/avatars/bbq-steak-medium.png', label: 'Steak Medium' },
  { id: 'bbq-steak-well', src: '/avatars/bbq-steak-well.png', label: 'Steak Well Done' },
  { id: 'cross', src: '/avatars/cross.png', label: 'Cross' },
  { id: 'wednesday', src: '/avatars/wednesday.png', label: 'Wednesday' },
  { id: 'dewalt', src: '/avatars/dewalt.png', label: 'DeWalt' },
]

export const DEFAULT_AVATAR = AVATARS[0].id

export type AvatarPose = 'home' | 'learn' | 'quiz' | 'progress' | 'options'

export function getAvatarSrc(avatarId: string, pose?: AvatarPose): string | null {
  const avatar = AVATARS.find((a) => a.id === avatarId)
  if (!avatar) return null
  if (pose) return `/avatars/${avatarId}/${pose}.png`
  return avatar.src
}

export function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
}
