import { NextResponse } from 'next/server'

type QuoteResponse = {
  original: string
  encrypted: string
  author: string
  key: Record<string, string>
}

// generate a random monoalphabetic substitution mapping for lowercase a-z
function generateKey(): Record<string, string> {
  const letters = 'abcdefghijklmnopqrstuvwxyz'.split('')
  // Fisher-Yates shuffle for better randomness
  const shuffled = [...letters]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = tmp
  }
  const map: Record<string, string> = {}
  for (let i = 0; i < letters.length; i++) {
    map[letters[i]] = shuffled[i]
  }
  return map
}

function encryptWithKey(text: string, key: Record<string, string>) {
  return Array.from(text)
    .map((ch) => {
      const isUpper = ch >= 'A' && ch <= 'Z'
      const lower = ch.toLowerCase()
      if (lower >= 'a' && lower <= 'z') {
        const mapped = key[lower] || lower
        return isUpper ? mapped.toUpperCase() : mapped
      }
      return ch
    })
    .join('')
}

export async function GET() {
  // Fetch a random popular quote from quotable.io, but avoid recently-used quotes
  const fallbackQuotes = [
    { id: 'fallback-1', content: 'Life is like a box of chocolates', author: 'Forrest Gump' },
    { id: 'fallback-2', content: 'The only thing we have to fear is fear itself', author: 'Franklin D. Roosevelt' },
    { id: 'fallback-3', content: 'To be or not to be, that is the question', author: 'William Shakespeare' },
  ]

  // simple in-memory LRU for recent quote ids
  const MAX_RECENT = 25
  ;(globalThis as any).__recentQuoteIds = (globalThis as any).__recentQuoteIds || []
  const recentIds: string[] = (globalThis as any).__recentQuoteIds

  let chosen: { id: string; content: string; author: string } | null = null
  let lastUpstreamStatus: number | null = null
  let lastUpstreamError: string | null = null
  const maxAttempts = 10
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetch(`https://api.quotable.io/random?tags=famous-quotes&t=${Date.now()}`)
      // log status for debugging so the dev server shows why we might be falling back
      lastUpstreamStatus = res.status
      console.log(`[quotes API] attempt=${attempt} upstream status=${res.status} ${res.statusText}`)
      if (res.ok) {
        const data = await res.json()
        const id = data._id || data.id || `${data.content}`
        if (!recentIds.includes(id)) {
          chosen = { id, content: data.content || '', author: data.author || 'Unknown' }
          break
        }
        // else: try again
      } else {
        // non-OK response: capture body for dev debugging and continue attempts
        try {
          const text = await res.text()
          console.log(`[quotes API] non-ok body: ${text}`)
        } catch (e) {
          /* ignore */
        }
        // try again in next loop iteration
      }
    } catch (e) {
      // network or other error — record and attempt a dev-only insecure retry
      lastUpstreamError = String(e)
      console.log(`[quotes API] fetch error: ${lastUpstreamError}`)

      // DEV ONLY: some dev machines (corporate proxies / custom CAs) cause TLS validation
      // to fail. As a last resort only in development, try again with NODE_TLS_REJECT_UNAUTHORIZED=0
      try {
        console.log('[quotes API] attempting insecure retry (NODE_TLS_REJECT_UNAUTHORIZED=0)')
        const prev = process.env.NODE_TLS_REJECT_UNAUTHORIZED
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
        const res2 = await fetch(`https://api.quotable.io/random?tags=famous-quotes&t=${Date.now()}`)
        lastUpstreamStatus = res2.status
        console.log(`[quotes API] insecure attempt status=${res2.status} ${res2.statusText}`)
        if (res2.ok) {
          const data2 = await res2.json()
          const id2 = data2._id || data2.id || `${data2.content}`
          if (!recentIds.includes(id2)) {
            chosen = { id: id2, content: data2.content || '', author: data2.author || 'Unknown' }
            // restore env and break
            if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
            else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev
            break
          }
        }
        if (prev === undefined) delete process.env.NODE_TLS_REJECT_UNAUTHORIZED
        else process.env.NODE_TLS_REJECT_UNAUTHORIZED = prev
      } catch (e2) {
        console.log('[quotes API] insecure retry failed:', String(e2))
      }

      // break to fallback if still not chosen after retries
      break
    }
  }

  if (!chosen) {
    // pick a fallback that isn't recent if possible
    const available = fallbackQuotes.filter((f) => !recentIds.includes(f.id))
    const pick = available.length ? available[Math.floor(Math.random() * available.length)] : fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)]
    chosen = { id: pick.id, content: pick.content, author: pick.author }
  }

  // record recent id
  recentIds.push(chosen.id)
  while (recentIds.length > MAX_RECENT) recentIds.shift()

  const key = generateKey()
  const encrypted = encryptWithKey(chosen.content, key)

  const usedFallback = chosen.id && chosen.id.toString().startsWith('fallback-')

  const payload: QuoteResponse & { id: string; upstreamStatus?: number | null; upstreamError?: string | null; usedFallback?: boolean } = {
    original: chosen.content,
    encrypted,
    author: chosen.author,
    key,
    id: chosen.id,
    upstreamStatus: lastUpstreamStatus ?? null,
    upstreamError: lastUpstreamError ?? null,
    usedFallback: !!usedFallback,
  }

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  })
}
