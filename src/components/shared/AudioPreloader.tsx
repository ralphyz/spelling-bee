import { useAudioPreload } from '../../hooks/useAudioPreload'

/** Invisible component that preloads ElevenLabs audio for the active word list. */
export function AudioPreloader() {
  useAudioPreload()
  return null
}
