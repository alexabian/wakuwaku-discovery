const RATE_LIMIT_WINDOW_SECONDS = 15 * 60
const RATE_LIMIT_MAX_ATTEMPTS = 8

export function normaliseName(value) {
  return String(value ?? '').toLowerCase().trim().replace(/\s+/g, '')
}

export function hashInputSecret(createHash, name, pin) {
  return createHash('sha256').update(`${normaliseName(name)}:${pin}:wkwk2024`).digest('hex')
}

function getHeader(req, key) {
  return req.headers[key] ?? req.headers[key.toLowerCase()] ?? req.headers[key.toUpperCase()]
}

function getRequestHost(req) {
  return getHeader(req, 'x-forwarded-host') || getHeader(req, 'host') || ''
}

function getAllowedOrigins(req) {
  const derivedHosts = new Set(
    String(getRequestHost(req) || '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
  )

  const configured = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)

  const allowed = new Set(configured)
  for (const host of derivedHosts) {
    allowed.add(`https://${host}`)
    allowed.add(`http://${host}`)
  }
  return allowed
}

export function applyCors(req, res) {
  const origin = getHeader(req, 'origin')
  const allowedOrigins = getAllowedOrigins(req)

  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (!origin) return { ok: true }
  if (!allowedOrigins.has(origin)) {
    return { ok: false, status: 403, body: { error: 'forbidden_origin' } }
  }

  res.setHeader('Access-Control-Allow-Origin', origin)
  return { ok: true }
}

export function getClientIp(req) {
  const forwarded = getHeader(req, 'x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown'
}

export async function enforceRateLimit(kv, req, action, name) {
  const ip = getClientIp(req)
  const scope = normaliseName(name) || 'anon'
  const key = `ratelimit:${action}:${ip}:${scope}`
  const attempts = await kv.incr(key)
  if (attempts === 1) {
    await kv.expire(key, RATE_LIMIT_WINDOW_SECONDS)
  }

  return {
    allowed: attempts <= RATE_LIMIT_MAX_ATTEMPTS,
    attempts,
    retryAfter: RATE_LIMIT_WINDOW_SECONDS,
  }
}

export function invalidCredentials(res) {
  return res.status(403).json({ error: 'invalid_credentials' })
}

export function tooManyRequests(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter))
  return res.status(429).json({ error: 'too_many_requests' })
}
