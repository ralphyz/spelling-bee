import { useCallback, useRef } from 'react'

const AudioContextClass =
  typeof window !== 'undefined'
    ? window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    : null

export function useSound() {
  const ctxRef = useRef<AudioContext | null>(null)

  const getCtx = useCallback(() => {
    if (!ctxRef.current && AudioContextClass) {
      ctxRef.current = new AudioContextClass()
    }
    return ctxRef.current
  }, [])

  const playTone = useCallback(
    (freq: number, duration: number, type: OscillatorType = 'sine') => {
      const ctx = getCtx()
      if (!ctx) return
      if (ctx.state === 'suspended') ctx.resume()

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = type
      osc.frequency.value = freq
      gain.gain.value = 0.15
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + duration)
    },
    [getCtx]
  )

  const tapSound = useCallback(() => {
    playTone(800, 0.05, 'sine')
  }, [playTone])

  const deleteSound = useCallback(() => {
    playTone(400, 0.08, 'triangle')
  }, [playTone])

  const correctSound = useCallback(() => {
    playTone(523, 0.15, 'sine')
    setTimeout(() => playTone(659, 0.15, 'sine'), 150)
    setTimeout(() => playTone(784, 0.3, 'sine'), 300)
  }, [playTone])

  const incorrectSound = useCallback(() => {
    playTone(300, 0.15, 'triangle')
    setTimeout(() => playTone(250, 0.3, 'triangle'), 150)
  }, [playTone])

  return { tapSound, deleteSound, correctSound, incorrectSound }
}
