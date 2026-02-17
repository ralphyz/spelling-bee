import { file } from 'bun'

const DATA_FILE = './data.json'
const SESSIONS_FILE = './sessions.json'

const defaultSettings = { learnWordCount: 5, quizWordCount: 5 }

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

    return new Response('Not found', { status: 404, headers })
  },
})

console.log(`API server running on http://0.0.0.0:${server.port}`)
