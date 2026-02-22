import { file } from 'bun'
import { networkInterfaces } from 'os'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

const DATA_FILE = './data.json'
const SESSIONS_FILE = './sessions.json'
const ADMIN_PIN_FILE = './admin-pin.json'

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || ''
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || ''
const TTS_CACHE_DIR = './tts-cache'

// Ensure TTS cache directory exists
if (!existsSync(TTS_CACHE_DIR)) mkdirSync(TTS_CACHE_DIR)

/** Get a safe filename for a TTS cache entry. */
function ttsCacheKey(text: string): string {
  const safe = text.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return join(TTS_CACHE_DIR, `${safe}.mp3`)
}

async function loadAdminPin(): Promise<string> {
  try {
    const f = file(ADMIN_PIN_FILE)
    if (await f.exists()) {
      const data = await f.json()
      if (data.pin) return data.pin
    }
  } catch { /* ignore */ }
  return process.env.ADMIN_PIN || '123456'
}

async function saveAdminPin(pin: string) {
  await Bun.write(ADMIN_PIN_FILE, JSON.stringify({ pin }, null, 2))
}

let adminPin = process.env.ADMIN_PIN || '123456'
// Load persisted admin PIN on startup
loadAdminPin().then((p) => { adminPin = p })

// Session version — bumping this invalidates all client sessions
let sessionVersion = Date.now()

const defaultSettings = { learnWordCount: 5, quizWordCount: 5 }

// Rate limiting for PIN auth
const rateLimits = new Map<string, { failures: number; blockedUntil: number; lastFailure: number }>()

// Global lockdown: 5 failures from any source within 1 minute → block non-local IPs for 10 minutes
const globalFailures: number[] = [] // timestamps of recent failures
let globalBlockUntil = 0

function getServerSubnet(): string | null {
  const ifaces = networkInterfaces()
  for (const addrs of Object.values(ifaces)) {
    if (!addrs) continue
    for (const addr of addrs) {
      if (addr.family === 'IPv4' && !addr.internal) {
        // Return first two octets for /16 match (e.g. "10.0" from "10.0.0.235")
        const parts = addr.address.split('.')
        return `${parts[0]}.${parts[1]}.`
      }
    }
  }
  return null
}

const localSubnet = getServerSubnet()

function isLocalIp(ip: string): boolean {
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'unknown') return true
  if (localSubnet && ip.startsWith(localSubnet)) return true
  return false
}

const DEFAULT_DATA_FILE = './default-data.json'

async function loadState() {
  try {
    const f = file(DATA_FILE)
    if (await f.exists()) {
      const state = await f.json()
      if (!state.settings) state.settings = defaultSettings
      if (!state.users) state.users = []
      if (state.currentUserId === undefined) state.currentUserId = null
      return state
    }
  } catch {
    // ignore
  }
  // Seed with default data if available
  try {
    const df = file(DEFAULT_DATA_FILE)
    if (await df.exists()) {
      const seed = await df.json()
      await Bun.write(DATA_FILE, JSON.stringify(seed, null, 2))
      return seed
    }
  } catch {
    // ignore
  }
  return { wordLists: [], progress: {}, activeListId: null, settings: defaultSettings, users: [], currentUserId: null }
}

async function saveState(state: unknown) {
  await Bun.write(DATA_FILE, JSON.stringify(state, null, 2))
}

async function loadSessions(): Promise<unknown[]> {
  try {
    const f = file(SESSIONS_FILE)
    if (await f.exists()) {
      return await f.json()
    }
  } catch {
    // ignore
  }
  return []
}

async function saveSessions(sessions: unknown[]) {
  await Bun.write(SESSIONS_FILE, JSON.stringify(sessions, null, 2))
}

const server = Bun.serve({
  port: 3001,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url)

    // CORS headers for dev
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json',
    }

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers })
    }

    if (url.pathname === '/api/state') {
      if (req.method === 'GET') {
        const state = await loadState()
        return new Response(JSON.stringify(state), { headers })
      }

      if (req.method === 'PUT') {
        const body = await req.json()
        await saveState(body)
        return new Response(JSON.stringify({ ok: true }), { headers })
      }
    }

    if (url.pathname === '/api/sessions') {
      if (req.method === 'GET') {
        const sessions = await loadSessions()
        const listId = url.searchParams.get('listId')
        const userId = url.searchParams.get('userId')
        let filtered = sessions as Array<{ listId?: string; userId?: string }>
        if (listId) filtered = filtered.filter((s) => s.listId === listId)
        if (userId) filtered = filtered.filter((s) => s.userId === userId || !s.userId)
        return new Response(JSON.stringify(filtered), { headers })
      }

      if (req.method === 'POST') {
        const record = await req.json()
        const sessions = await loadSessions()
        sessions.push(record)
        await saveSessions(sessions)
        return new Response(JSON.stringify({ ok: true }), { headers })
      }

      if (req.method === 'DELETE') {
        const userId = url.searchParams.get('userId')
        if (userId) {
          const sessions = await loadSessions() as Array<{ userId?: string }>
          const kept = sessions.filter((s) => s.userId !== userId && s.userId != null)
          await saveSessions(kept)
        } else {
          await saveSessions([])
        }
        return new Response(JSON.stringify({ ok: true }), { headers })
      }
    }

    if (url.pathname === '/api/auth/verify-pin') {
      if (req.method === 'POST') {
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
        const now = Date.now()

        // Global lockdown: block non-local IPs
        if (globalBlockUntil > now && !isLocalIp(clientIp)) {
          const retryAfter = Math.ceil((globalBlockUntil - now) / 1000)
          return new Response(JSON.stringify({ error: 'blocked', retryAfter }), { status: 429, headers })
        }

        const limit = rateLimits.get(clientIp)

        // Check if IP is blocked
        if (limit) {
          if (limit.blockedUntil > now) {
            const retryAfter = Math.ceil((limit.blockedUntil - now) / 1000)
            return new Response(JSON.stringify({ error: 'blocked', retryAfter }), { status: 429, headers })
          }
          // Check cooldown (3 seconds after last failure)
          if (limit.lastFailure && now - limit.lastFailure < 3000) {
            const retryAfter = Math.ceil((limit.lastFailure + 3000 - now) / 1000)
            return new Response(JSON.stringify({ error: 'cooldown', retryAfter }), { status: 429, headers })
          }
        }

        const { pin } = await req.json() as { pin: string }
        const state = await loadState() as { users: Array<{ id: string; pin?: string }> }

        // Check admin PIN (only from local network)
        if (pin === adminPin) {
          if (!isLocalIp(clientIp)) {
            return new Response(JSON.stringify({ error: 'invalid', cooldown: 3 }), { status: 401, headers })
          }
          rateLimits.delete(clientIp)
          const userIds = state.users.map((u) => u.id)
          return new Response(JSON.stringify({ userIds, isAdmin: true, sessionVersion }), { headers })
        }

        // Check user PINs
        const matching = state.users.filter((u) => u.pin === pin)
        if (matching.length > 0) {
          rateLimits.delete(clientIp)
          const userIds = matching.map((u) => u.id)
          return new Response(JSON.stringify({ userIds, isAdmin: false, sessionVersion }), { headers })
        }

        // Wrong PIN — record per-IP failure
        const current = rateLimits.get(clientIp) || { failures: 0, blockedUntil: 0, lastFailure: 0 }
        current.failures += 1
        current.lastFailure = now
        if (current.failures >= 3) {
          current.blockedUntil = now + 10 * 60 * 1000 // 10 minutes
        }
        rateLimits.set(clientIp, current)

        // Record global failure and check for lockdown
        globalFailures.push(now)
        // Prune failures older than 1 minute
        while (globalFailures.length > 0 && globalFailures[0] < now - 60_000) {
          globalFailures.shift()
        }
        if (globalFailures.length >= 5) {
          globalBlockUntil = now + 10 * 60 * 1000 // 10-minute global lockdown
          globalFailures.length = 0 // reset so it doesn't re-trigger immediately
        }

        return new Response(JSON.stringify({ error: 'invalid', cooldown: 3 }), { status: 401, headers })
      }
    }

    if (url.pathname === '/api/auth/set-pin') {
      if (req.method === 'PUT') {
        const { userId, pin, adminPin: providedAdminPin } = await req.json() as { userId: string; pin: string; adminPin: string }
        if (providedAdminPin !== adminPin) {
          return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers })
        }
        const state = await loadState() as { users: Array<{ id: string; pin?: string }> }
        const user = state.users.find((u) => u.id === userId)
        if (user) {
          user.pin = pin
          await saveState(state)
        }
        return new Response(JSON.stringify({ ok: true }), { headers })
      }
    }

    if (url.pathname === '/api/auth/change-admin-pin') {
      if (req.method === 'PUT') {
        const { currentPin, newPin } = await req.json() as { currentPin: string; newPin: string }
        if (currentPin !== adminPin) {
          return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers })
        }
        adminPin = newPin
        await saveAdminPin(newPin)
        return new Response(JSON.stringify({ ok: true }), { headers })
      }
    }

    if (url.pathname === '/api/auth/session-version') {
      if (req.method === 'GET') {
        return new Response(JSON.stringify({ sessionVersion }), { headers })
      }
    }

    if (url.pathname === '/api/auth/invalidate-sessions') {
      if (req.method === 'POST') {
        const { adminPin: providedAdminPin } = await req.json() as { adminPin: string }
        if (providedAdminPin !== adminPin) {
          return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers })
        }
        sessionVersion = Date.now()
        return new Response(JSON.stringify({ ok: true, sessionVersion }), { headers })
      }
    }

    // --- ElevenLabs TTS proxy ---

    if (url.pathname === '/api/tts/status') {
      if (req.method === 'GET') {
        const available = !!(ELEVENLABS_API_KEY && ELEVENLABS_VOICE_ID)
        return new Response(JSON.stringify({ available }), { headers })
      }
    }

    if (url.pathname === '/api/tts') {
      if (req.method === 'POST') {
        if (!ELEVENLABS_API_KEY || !ELEVENLABS_VOICE_ID) {
          return new Response(JSON.stringify({ error: 'TTS not configured' }), { status: 503, headers })
        }

        const { text } = await req.json() as { text: string }
        if (!text || typeof text !== 'string' || text.length > 200) {
          return new Response(JSON.stringify({ error: 'Invalid text' }), { status: 400, headers })
        }

        const cachePath = ttsCacheKey(text)
        const audioHeaders = {
          ...headers,
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400',
        }

        // Serve from disk cache if available
        const cached = file(cachePath)
        if (await cached.exists()) {
          return new Response(cached, { headers: audioHeaders })
        }

        try {
          const elRes = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`,
            {
              method: 'POST',
              headers: {
                'xi-api-key': ELEVENLABS_API_KEY,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                text,
                model_id: 'eleven_turbo_v2_5',
              }),
            }
          )

          if (!elRes.ok) {
            const errBody = await elRes.text().catch(() => '')
            console.error(`ElevenLabs ${elRes.status}: ${errBody}`)
            return new Response(JSON.stringify({ error: 'TTS API error' }), { status: 502, headers })
          }

          const audioBuffer = await elRes.arrayBuffer()

          // Save to disk cache
          await Bun.write(cachePath, audioBuffer)

          return new Response(audioBuffer, { headers: audioHeaders })
        } catch {
          return new Response(JSON.stringify({ error: 'TTS request failed' }), { status: 502, headers })
        }
      }
    }

    return new Response('Not found', { status: 404, headers })
  },
})

console.log(`API server running on http://0.0.0.0:${server.port}`)
