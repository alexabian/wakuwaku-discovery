import { Redis } from '@upstash/redis'
import { createHash } from 'crypto'

const kv = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const normalise = s => s.toLowerCase().trim().replace(/\s+/g, '')
const hashPin   = (name, pin) =>
  createHash('sha256').update(`${normalise(name)}:${pin}:wkwk2024`).digest('hex')

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()

  const { name, pin } = req.body ?? {}

  if (!name?.trim() || String(pin).length !== 4)
    return res.status(400).json({ error: 'missing_fields' })

  try {
    const key    = `profile:${normalise(name)}`
    const record = await kv.get(key)

    if (!record)                                return res.status(404).json({ error: 'not_found' })
    if (record.pinHash !== hashPin(name, pin))  return res.status(403).json({ error: 'wrong_pin' })

    res.status(200).json({ progress: record.progress })
  } catch (err) {
    console.error('load error', err)
    res.status(500).json({ error: 'server_error' })
  }
}
