import { useCallback, useRef, useEffect } from 'react'
import { preloadLetterAudio, getLetterAudioUrl, getCapitalAudioUrl } from '../utils/letterAudio'
import { isElevenLabsAvailable, fetchElevenLabsAudio, checkElevenLabsAvailability } from '../utils/elevenLabsAudio'

function playAudioFile(
  url: string,
  audioRef: React.RefObject<HTMLAudioElement | null>,
  onDone: () => void,
  onError?: () => void
) {
  const audio = new Audio(url)
  audioRef.current = audio
  audio.addEventListener('ended', onDone)
  audio.play().catch(() => onError?.())
}

export function useSpeech() {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Warm the letter audio cache on first mount
  useEffect(() => {
    preloadLetterAudio()
  }, [])

  const speak = useCallback(async (word: string, audioUrl: string | null) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis.cancel()

    // Ensure availability check has completed before reading the flag
    await checkElevenLabsAvailability()
    if (isElevenLabsAvailable()) {
      const elUrl = await fetchElevenLabsAudio(word)
      if (elUrl) {
        const audio = new Audio(elUrl)
        audioRef.current = audio
        audio.play().catch(() => fallbackSpeak(word))
        return
      }
    }

    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      audio.play().catch(() => fallbackSpeak(word))
    } else {
      fallbackSpeak(word)
    }
  }, [])

  const speakThenSpell = useCallback(async (word: string, audioUrl: string | null) => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    window.speechSynthesis.cancel()

    // Resolve the best audio URL for the whole word
    await checkElevenLabsAvailability()
    let wordUrl = audioUrl
    if (isElevenLabsAvailable()) {
      const elUrl = await fetchElevenLabsAudio(word)
      if (elUrl) wordUrl = elUrl
    }

    const spellWithAudio = () => {
      const letters = word.split('')
      let i = 0

      const playNext = () => {
        if (i >= letters.length) {
          setTimeout(() => speak(word, wordUrl), 400)
          return
        }

        const letter = letters[i]
        i++
        const isCapital = letter >= 'A' && letter <= 'Z'
        const letterUrl = getLetterAudioUrl(letter)
        const capitalUrl = isCapital ? getCapitalAudioUrl() : null

        const playLetterAudio = () => {
          if (letterUrl) {
            playAudioFile(letterUrl, audioRef, () => setTimeout(playNext, 150), () => {
              fallbackSpeakLetter(letter, playNext)
            })
          } else {
            fallbackSpeakLetter(letter, playNext)
          }
        }

        // If uppercase, play "capital" first then the letter
        if (capitalUrl) {
          playAudioFile(capitalUrl, audioRef, () => {
            setTimeout(playLetterAudio, 100)
          }, playLetterAudio)
        } else if (isCapital) {
          // No "capital" audio available — use speech synthesis for "capital"
          fallbackSpeakWord('capital', () => setTimeout(playLetterAudio, 100))
        } else {
          playLetterAudio()
        }
      }

      setTimeout(playNext, 400)
    }

    if (wordUrl) {
      const audio = new Audio(wordUrl)
      audioRef.current = audio
      audio.addEventListener('ended', spellWithAudio)
      audio.play().catch(() => {
        fallbackSpeak(word)
        setTimeout(spellWithAudio, 1000)
      })
    } else {
      fallbackSpeak(word)
      setTimeout(spellWithAudio, 1000)
    }
  }, [speak])

  return { speak, speakThenSpell }
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

function fallbackSpeakWord(word: string, onDone: () => void) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(word)
    u.rate = 0.8
    u.pitch = 1.0
    u.addEventListener('end', () => onDone())
    window.speechSynthesis.speak(u)
  } else {
    setTimeout(onDone, 300)
  }
}

function fallbackSpeakLetter(letter: string, onDone: () => void) {
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(letter)
    u.rate = 0.5
    u.pitch = 1.1
    u.addEventListener('end', () => setTimeout(onDone, 150))
    window.speechSynthesis.speak(u)
  } else {
    setTimeout(onDone, 300)
  }
}
