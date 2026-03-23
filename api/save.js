import { kv } from '@vercel/kv'
import { createHash } from 'crypto'

const normalise = s => s.toLowerCase().trim().replace(/\s+/g, '')
const hashPin   = (name, pin) =>
  createHash('sha256').update(`${normalise(name)}:${pin}:wkwk2024`).digest('hex')

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  if (req.method !== 'POST') return res.status(405).end()

  const { name, pin, progress } = req.body ?? {}

  if (!name?.trim() || String(pin).length !== 4 || !progress)
    return res.status(400).json({ error: 'missing_fields' })

  try {
    const key      = `profile:${normalise(name)}`
    const existing = await kv.get(key)

    if (existing && existing.pinHash !== hashPin(name, pin))
      return res.status(403).json({ error: 'wrong_pin' })

    await kv.set(key, {
      pinHash:   hashPin(name, pin),
      progress,
      updatedAt: new Date().toISOString(),
    })

    res.status(200).json({ ok: true })
  } catch (err) {
    console.error('save error', err)
    res.status(500).json({ error: 'server_error' })
  }
}
