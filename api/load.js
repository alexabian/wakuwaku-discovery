import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'
import {
  applyCors,
  enforceRateLimit,
  hashInputSecret,
  invalidCredentials,
  normaliseName,
  tooManyRequests,
} from './_security.js'
import { normaliseProgress } from '../src/progress.js'

const kv = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

export default async function handler(req, res) {
  const cors = applyCors(req, res)
  if (!cors.ok) return res.status(cors.status).json(cors.body)
  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).end()

  const { name, pin } = req.body ?? {}

  if (!name?.trim() || !/^\d{4}$/.test(String(pin))) {
    return res.status(400).json({ error: 'missing_fields' })
  }

  try {
    const rateLimit = await enforceRateLimit(kv, req, 'load', name)
    if (!rateLimit.allowed) return tooManyRequests(res, rateLimit.retryAfter)

    const key = `profile:${normaliseName(name)}`
    const record = await kv.get(key)

    if (!record || record.pinHash !== hashInputSecret(createHash, name, pin)) {
      return invalidCredentials(res)
    }

    const normalisedProgress = normaliseProgress(record.progress)
    if (!normalisedProgress) {
      return res.status(500).json({ error: 'invalid_saved_progress' })
    }

    return res.status(200).json({ progress: normalisedProgress })
  } catch (err) {
    console.error('load error', err)
    return res.status(500).json({ error: 'server_error' })
  }
}
