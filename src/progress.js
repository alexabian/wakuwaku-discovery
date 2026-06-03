const STORAGE_KEY = 'wakuwaku_progress'

const MODULE_LAYOUT = {
  w1: ['m1', 'm2', 'm3', 'm4'],
  w2: ['m1', 'm2', 'm3', 'm4'],
  w3: ['m1', 'm2', 'm3'],
  w4: ['m1', 'm2', 'm3'],
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clampInteger(value, min, max) {
  const num = Number(value)
  if (!Number.isInteger(num)) return null
  if (num < min || num > max) return null
  return num
}

function normaliseModuleRecord(record) {
  if (record == null) return null
  if (!isPlainObject(record)) return null

  const stars = clampInteger(record.stars, 1, 3)
  const bestWrong = clampInteger(record.bestWrong, 0, Number.MAX_SAFE_INTEGER)
  if (stars == null || bestWrong == null) return null

  return { stars, bestWrong }
}

export function freshProgress() {
  return {
    w1: { m1: null, m2: null, m3: null, m4: null },
    w2: { m1: null, m2: null, m3: null, m4: null },
    w3: { m1: null, m2: null, m3: null },
    w4: { m1: null, m2: null, m3: null },
    streak: 0,
    lastPlayed: null,
  }
}

export function normaliseProgress(raw) {
  if (!isPlainObject(raw)) return null

  const next = freshProgress()

  for (const [worldKey, moduleKeys] of Object.entries(MODULE_LAYOUT)) {
    const worldValue = raw[worldKey]
    if (worldValue != null && !isPlainObject(worldValue)) return null

    for (const moduleKey of moduleKeys) {
      const normalisedRecord = normaliseModuleRecord(worldValue?.[moduleKey])
      next[worldKey][moduleKey] = normalisedRecord
    }
  }

  const streak = Number(raw.streak)
  next.streak = Number.isInteger(streak) && streak >= 0 ? streak : 0

  next.lastPlayed = typeof raw.lastPlayed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.lastPlayed)
    ? raw.lastPlayed
    : null

  return next
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshProgress()
    const parsed = JSON.parse(raw)
    return normaliseProgress(parsed) ?? freshProgress()
  } catch (_) {
    return freshProgress()
  }
}

export function saveProgress(progress) {
  try {
    const normalised = normaliseProgress(progress)
    if (!normalised) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalised))
  } catch (_) {}
}

function getTodayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function stampStreak(progress) {
  const today = getTodayStr()
  if (progress.lastPlayed === today) return progress
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  const newStreak = progress.lastPlayed === yesterday ? (progress.streak || 0) + 1 : 1
  return { ...progress, streak: newStreak, lastPlayed: today }
}
