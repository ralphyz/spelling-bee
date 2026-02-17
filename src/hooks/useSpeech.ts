import { useCallback, useRef } from 'react'

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const speak = useCallback((word: string, audioUrl: string | null) => {
    // stop any current playback
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.play().catch(() => {
        // fallback to speech synthesis if audio fails
        fallbackSpeak(word)
      })
    } else {
      fallbackSpeak(word)
    }
  }, [])

  return { speak }
}

function fallbackSpeak(word: string) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(word)
    utterance.rate = 0.8
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }
}
