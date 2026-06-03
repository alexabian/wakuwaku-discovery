import { useState, useCallback } from 'react'
import { buildSession, shuffle, WORLD1_MODULES } from './questionData.js'
import { WORLD2_MODULES } from './questionData2.js'
import { WORLD3_MODULES } from './questionData3.js'
import { WORLD4_MODULES } from './questionData4.js'
import ParentPanel from './ParentPanel.jsx'
import { completeDaily, freshProgress, getTodayStr, loadProgress, saveProgress, stampStreak } from './progress.js'

// ─── World definitions ────────────────────────────────────────────────────────

const WORLDS = [
  {
    id: 1,
    titleJp: 'かがくのせかい',
    titleEn: 'World of Science',
    emoji: '🔬',
    tint: '#E8F5E9',
    border: '#6BAF6B',
    locked: false,
    modules: WORLD1_MODULES,
  },
  {
    id: 2,
    titleJp: 'ちりのせかい',
    titleEn: 'World of Geography',
    emoji: '🌍',
    tint: '#E3F2FD',
    border: '#4DAAAA',
    locked: false,
    modules: WORLD2_MODULES,
  },
  {
    id: 3,
    titleJp: 'れきしのせかい',
    titleEn: 'World of History',
    emoji: '⏳',
    tint: '#FFF8E1',
    border: '#E8963E',
    locked: false,
    modules: WORLD3_MODULES,
  },
  {
    id: 4,
    titleJp: 'アートのせかい',
    titleEn: 'World of Art',
    emoji: '🎨',
    tint: '#FCE4EC',
    border: '#D45B5B',
    locked: false,
    modules: WORLD4_MODULES,
  },
]

const SESSION_LENGTH = 10

// ─── Explorer rank ────────────────────────────────────────────────────────────

const RANKS = [
  { min: 36, jp: 'でんせつのたんけんか', en: 'Legendary Explorer', emoji: '🌟' },
  { min: 25, jp: 'マスタータンけんか', en: 'Master Explorer', emoji: '🏆' },
  { min: 14, jp: 'じゅくれんたんけんか', en: 'Senior Explorer', emoji: '🔭' },
  { min: 5, jp: 'たんけんか', en: 'Explorer', emoji: '🧭' },
  { min: 0, jp: 'みならいたんけんか', en: 'Apprentice Explorer', emoji: '🗺️' },
]

function getExplorerRank(totalStars) {
  return RANKS.find(r => totalStars >= r.min) ?? RANKS[RANKS.length - 1]
}

function totalStarsAllWorlds(progress) {
  return WORLDS.reduce((sum, world) =>
    sum + world.modules.reduce((s, mod) => {
      const rec = getModuleRecord(progress, world.id, mod.id)
      return s + (rec ? rec.stars : 0)
    }, 0)
  , 0)
}

// ─── Crown helper ─────────────────────────────────────────────────────────────

function getCrown(stars) {
  if (stars === 3) return '🥇'
  if (stars === 2) return '🥈'
  if (stars === 1) return '🥉'
  return null
}

function getStars(wrongCount) {
  if (wrongCount === 0) return 3
  if (wrongCount <= 3) return 2
  return 1
}

function isModuleUnlocked(progress, worldId, moduleId) {
  if (moduleId === 1) return true
  const wKey = `w${worldId}`
  const prevKey = `m${moduleId - 1}`
  return !!(progress[wKey] && progress[wKey][prevKey])
}

function getModuleRecord(progress, worldId, moduleId) {
  const wKey = `w${worldId}`
  const mKey = `m${moduleId}`
  return progress[wKey]?.[mKey] ?? null
}

function getCompletedModulesCount(progress) {
  return WORLDS.reduce((sum, world) =>
    sum + world.modules.filter(mod => !!getModuleRecord(progress, world.id, mod.id)).length
  , 0)
}

function getGoldModulesCount(progress) {
  return WORLDS.reduce((sum, world) =>
    sum + world.modules.filter(mod => getModuleRecord(progress, world.id, mod.id)?.stars === 3).length
  , 0)
}

function getUnlockedModules(progress) {
  return WORLDS.flatMap(world =>
    world.modules
      .filter(mod => isModuleUnlocked(progress, world.id, mod.id))
      .map(mod => ({ world, mod }))
  )
}

function getWorldCompletion(world, progress) {
  const completed = world.modules.filter(mod => !!getModuleRecord(progress, world.id, mod.id)).length
  const gold = world.modules.filter(mod => getModuleRecord(progress, world.id, mod.id)?.stars === 3).length
  return {
    completed,
    total: world.modules.length,
    gold,
    percent: Math.round((completed / world.modules.length) * 100),
  }
}

function hashString(text) {
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0
  }
  return hash
}

function orderWithSeed(items, seed, keyFn = item => item.key) {
  if (!seed) return shuffle(items)
  return [...items].sort((a, b) => {
    const aHash = hashString(`${seed}:${keyFn(a)}`)
    const bHash = hashString(`${seed}:${keyFn(b)}`)
    return aHash - bHash
  })
}

function getModuleQuestionEntries(world, mod) {
  const questions = [...mod.data.pool1, ...mod.data.pool2]
  return questions.map((question, index) => ({
    key: `w${world.id}-m${mod.id}-q${index}-${question.correctJp}`,
    world,
    mod,
    question,
  }))
}

function materialiseSession(entries, seed = null) {
  return entries.map((entry, index) => {
    const choices = seed
      ? orderWithSeed(entry.question.choices, `${seed}:${entry.key}:choices`, choice => choice.jp)
      : shuffle(entry.question.choices)

    return {
      ...entry.question,
      choices,
      correctJp: entry.question.correctJp,
      sourceWorldId: entry.world.id,
      sourceModuleId: entry.mod.id,
      sourceLabelJp: entry.mod.titleJp,
      sourceLabelEn: entry.mod.titleEn,
      sourceWorldLabelEn: entry.world.titleEn,
      sessionIndex: index,
    }
  })
}

function buildExplorerSession(progress, seed = null) {
  const unlockedModules = getUnlockedModules(progress)
  if (unlockedModules.length === 0) return []

  const orderedModules = orderWithSeed(
    unlockedModules.map(({ world, mod }) => ({
      key: `w${world.id}-m${mod.id}`,
      world,
      mod,
      entries: getModuleQuestionEntries(world, mod),
    })),
    seed ? `${seed}:modules` : null,
  )

  const selected = []
  const seen = new Set()

  for (const moduleBundle of orderedModules) {
    if (selected.length >= SESSION_LENGTH) break
    const orderedEntries = orderWithSeed(moduleBundle.entries, seed ? `${seed}:${moduleBundle.key}` : null)
    const firstFresh = orderedEntries.find(entry => !seen.has(entry.key))
    if (!firstFresh) continue
    selected.push(firstFresh)
    seen.add(firstFresh.key)
  }

  const remainingPool = orderedModules.flatMap(moduleBundle =>
    orderWithSeed(moduleBundle.entries, seed ? `${seed}:${moduleBundle.key}:rest` : null)
  )

  for (const entry of remainingPool) {
    if (selected.length >= SESSION_LENGTH) break
    if (seen.has(entry.key)) continue
    selected.push(entry)
    seen.add(entry.key)
  }

  return materialiseSession(selected.slice(0, SESSION_LENGTH), seed)
}

function buildDailySession(progress) {
  return buildExplorerSession(progress, `daily:${getTodayStr()}`)
}

function getDailyChallengeStatus(progress) {
  const today = getTodayStr()
  return {
    completedToday: progress.daily?.lastCompleted === today,
    streak: progress.daily?.streak || 0,
  }
}

function buildHomeQuests(progress) {
  const daily = getDailyChallengeStatus(progress)
  const quests = [
    {
      id: 'daily',
      emoji: daily.completedToday ? '✅' : '📅',
      jp: daily.completedToday ? 'きょうの はっけん クリア！' : 'きょうの はっけんを 1つ クリア',
      en: daily.completedToday ? 'Daily Discovery complete!' : 'Finish today’s Daily Discovery',
      done: daily.completedToday,
    },
  ]

  const firstNotGold = WORLDS.flatMap(world =>
    world.modules
      .map(mod => ({ world, mod, record: getModuleRecord(progress, world.id, mod.id) }))
      .filter(item => item.record && item.record.stars < 3)
  )[0]

  if (firstNotGold) {
    quests.push({
      id: 'gold',
      emoji: '🥇',
      jp: `${firstNotGold.mod.titleJp} を ゴールドに！`,
      en: `Earn Gold in ${firstNotGold.mod.titleEn}`,
      done: false,
    })
  } else {
    const nextLocked = WORLDS.flatMap(world =>
      world.modules
        .map(mod => ({ world, mod, unlocked: isModuleUnlocked(progress, world.id, mod.id) }))
        .filter(item => !item.unlocked)
    )[0]

    if (nextLocked) {
      quests.push({
        id: 'unlock',
        emoji: '🔓',
        jp: `${nextLocked.world.titleJp} の つぎを アンロック！`,
        en: `Unlock the next ${nextLocked.world.titleEn} lesson`,
        done: false,
      })
    } else {
      quests.push({
        id: 'mastery',
        emoji: '✨',
        jp: 'ぜんぶの せかいを マスターしよう！',
        en: 'Polish every world to mastery!',
        done: getGoldModulesCount(progress) === WORLDS.reduce((sum, world) => sum + world.modules.length, 0),
      })
    }
  }

  return quests.slice(0, 2)
}

function getPassportSummary(progress) {
  const lessonStamps = getCompletedModulesCount(progress)
  const goldStamps = getGoldModulesCount(progress)
  const dailyStreak = progress.daily?.streak || 0
  const perfectSessions = progress.stats?.perfectSessions || 0

  return {
    lessonStamps,
    goldStamps,
    dailyStreak,
    perfectSessions,
    badges: [
      {
        id: 'first-step',
        unlocked: lessonStamps >= 1,
        emoji: '🌱',
        jp: 'はじめての スタンプ',
        en: 'First stamp',
      },
      {
        id: 'gold-hunter',
        unlocked: goldStamps >= 3,
        emoji: '🥇',
        jp: 'ゴールド ハンター',
        en: 'Gold hunter',
      },
      {
        id: 'daily-friend',
        unlocked: dailyStreak >= 3,
        emoji: '📅',
        jp: 'まいにち はっけん',
        en: 'Daily discoverer',
      },
      {
        id: 'owl-ace',
        unlocked: perfectSessions >= 5,
        emoji: '🦉',
        jp: 'ふくろう エース',
        en: 'Owl ace',
      },
    ],
  }
}

function getNextUnlockInfo(world, mod, previousProgress) {
  const nextModule = world?.modules.find(candidate => candidate.id === mod.id + 1)
  if (!nextModule) return null

  const wasLocked = !isModuleUnlocked(previousProgress, world.id, nextModule.id)
  if (!wasLocked) return null

  return {
    emoji: nextModule.emoji,
    titleJp: nextModule.titleJp,
    titleEn: nextModule.titleEn,
    worldJp: world.titleJp,
    worldEn: world.titleEn,
  }
}

// ─── Background ───────────────────────────────────────────────────────────────

function ParchmentBg() {
  return <div className="parchment-bg" />
}

// ─── Owl mascot ───────────────────────────────────────────────────────────────

function Owl({ mood = 'neutral' }) {
  const cls = mood === 'happy' ? 'bounce-anim' : mood === 'sad' ? 'tilt-anim' : ''
  return (
    <div
      className={cls}
      style={{ fontSize: 56, lineHeight: 1, display: 'inline-block', userSelect: 'none' }}
    >
      🦉
    </div>
  )
}

// ─── Stars display ────────────────────────────────────────────────────────────

function Stars({ count, size = 28, animate = false }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
      {[1, 2, 3].map(i => (
        <span
          key={i}
          className={animate && i <= count ? 'star earned' : ''}
          style={{
            fontSize: size,
            opacity: i <= count ? 1 : 0.2,
            animationDelay: animate ? `${(i - 1) * 0.13}s` : '0s',
          }}
        >
          ⭐
        </span>
      ))}
    </div>
  )
}

// ─── Answer button ────────────────────────────────────────────────────────────

function AnswerBtn({ choice, state, onClick, disabled }) {
  return (
    <button
      className={`answer-btn${state === 'correct' ? ' correct' : state === 'wrong' ? ' wrong' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span style={{ fontFamily: 'var(--font-jp)', fontSize: 20, fontWeight: 700, color: 'var(--brown)' }}>
        {choice.jp}
      </span>
      <span className="en-label">{choice.en}</span>
    </button>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ progress, onSelectWorld, onParent, onPlayMix, onPlayDaily, onOpenPassport }) {
  const totalStars = totalStarsAllWorlds(progress)
  const rank = getExplorerRank(totalStars)
  const streak = progress.streak || 0
  const daily = getDailyChallengeStatus(progress)
  const completedLessons = getCompletedModulesCount(progress)
  const goldLessons = getGoldModulesCount(progress)
  const sessionsPlayed = progress.stats?.sessionsPlayed || 0
  const quests = buildHomeQuests(progress)
  const passport = getPassportSummary(progress)

  return (
    <div className="screen" style={{ paddingTop: 20 }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onParent}
            style={{
              background: 'white', border: '2.5px solid var(--sand)', borderRadius: 50,
              padding: '7px 16px', fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 700,
              color: 'var(--brown-mid)', cursor: 'pointer', boxShadow: '0 2px 0 var(--sand)',
            }}
          >
            ⚙ Parent
          </button>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 4 }}>🦉</div>
          <div style={{ fontFamily: 'var(--font-rounded)', fontSize: 26, fontWeight: 800, color: 'var(--brown)', letterSpacing: '0.02em' }}>
            わくわく
          </div>
          <div style={{ fontFamily: 'var(--font-en)', fontSize: 24, fontWeight: 900, color: 'var(--amber)', letterSpacing: '0.04em' }}>
            Discovery
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', border: '2px solid var(--sand)',
            borderRadius: 50, padding: '6px 14px',
            boxShadow: '0 2px 0 var(--sand)',
          }}>
            <span style={{ fontSize: 18 }}>{rank.emoji}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: 'var(--brown)', lineHeight: 1.2 }}>
                {rank.jp}
              </div>
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 10, color: 'var(--brown-mid)', opacity: 0.7, lineHeight: 1 }}>
                {rank.en}
              </div>
            </div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: streak > 0 ? '#FFF3E0' : 'white',
            border: `2px solid ${streak > 0 ? 'var(--amber)' : 'var(--sand)'}`,
            borderRadius: 50, padding: '6px 14px',
            boxShadow: '0 2px 0 var(--sand)',
          }}>
            <span style={{ fontSize: 18 }}>🔥</span>
            <div>
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 900, color: streak > 0 ? 'var(--amber)' : 'var(--sand)', lineHeight: 1 }}>
                {streak}
              </div>
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 9, color: 'var(--brown-mid)', opacity: 0.6, lineHeight: 1 }}>
                day streak
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%' }}>
          <div style={{ background: 'white', border: '2px solid var(--sand)', borderRadius: 18, padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 0 var(--sand)' }}>
            <div style={{ fontSize: 20 }}>⭐</div>
            <div style={{ fontFamily: 'var(--font-en)', fontSize: 18, fontWeight: 900, color: 'var(--amber)' }}>{totalStars}</div>
            <div className="en-label" style={{ fontSize: 10 }}>total stars</div>
          </div>
          <div style={{ background: 'white', border: '2px solid var(--sand)', borderRadius: 18, padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 0 var(--sand)' }}>
            <div style={{ fontSize: 20 }}>📘</div>
            <div style={{ fontFamily: 'var(--font-en)', fontSize: 18, fontWeight: 900, color: 'var(--teal)' }}>{completedLessons}</div>
            <div className="en-label" style={{ fontSize: 10 }}>lessons done</div>
          </div>
          <div style={{ background: 'white', border: '2px solid var(--sand)', borderRadius: 18, padding: '12px 10px', textAlign: 'center', boxShadow: '0 2px 0 var(--sand)' }}>
            <div style={{ fontSize: 20 }}>🥇</div>
            <div style={{ fontFamily: 'var(--font-en)', fontSize: 18, fontWeight: 900, color: 'var(--green)' }}>{goldLessons}</div>
            <div className="en-label" style={{ fontSize: 10 }}>gold crowns</div>
          </div>
        </div>

        <button
          onClick={onOpenPassport}
          className="passport-card"
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <div className="passport-seal">🛂</div>
              <div>
                <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)' }}>はっけん パスポート</div>
                <div className="en-label" style={{ fontSize: 11 }}>Discovery Passport</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 18, fontWeight: 900, color: 'var(--amber)' }}>{passport.lessonStamps}</div>
              <div className="en-label" style={{ fontSize: 10 }}>stamps</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, width: '100%', marginTop: 12 }}>
            <div className="passport-mini-stat">
              <span>🥇</span>
              <strong>{passport.goldStamps}</strong>
            </div>
            <div className="passport-mini-stat">
              <span>📅</span>
              <strong>{passport.dailyStreak}</strong>
            </div>
            <div className="passport-mini-stat">
              <span>✨</span>
              <strong>{passport.badges.filter(badge => badge.unlocked).length}</strong>
            </div>
            <div className="passport-mini-stat">
              <span>🦉</span>
              <strong>{passport.perfectSessions}</strong>
            </div>
          </div>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, width: '100%' }}>
          <button
            onClick={onPlayDaily}
            style={{
              background: daily.completedToday ? 'linear-gradient(135deg, #E8F5E9, #F3FAF4)' : 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
              border: `3px solid ${daily.completedToday ? 'var(--green)' : 'var(--amber)'}`,
              borderRadius: 22,
              padding: '16px 14px',
              textAlign: 'left',
              boxShadow: `0 4px 0 ${daily.completedToday ? '#4E8F4E' : '#BF6A1F'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 28 }}>{daily.completedToday ? '✅' : '📅'}</div>
              <div style={{
                background: 'rgba(255,255,255,0.85)', borderRadius: 999,
                padding: '5px 9px', fontFamily: 'var(--font-en)', fontSize: 11, fontWeight: 800,
                color: daily.completedToday ? 'var(--green)' : 'var(--amber)',
              }}>
                {daily.completedToday ? 'DONE TODAY' : 'NEW TODAY'}
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginTop: 8 }}>
              きょうの はっけん
            </div>
            <div className="en-label" style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>Daily Discovery</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: 'var(--brown-mid)', lineHeight: 1.4 }}>
              {daily.completedToday ? 'もういちど できるよ！' : 'まいにち かわる チャレンジ'}
            </div>
            <div className="en-label" style={{ fontSize: 10, marginTop: 6 }}>Daily streak: {daily.streak}</div>
          </button>

          <button
            onClick={onPlayMix}
            style={{
              background: 'linear-gradient(135deg, #EAF6FF, #F3FBFF)',
              border: '3px solid var(--teal)',
              borderRadius: 22,
              padding: '16px 14px',
              textAlign: 'left',
              boxShadow: '0 4px 0 #2A8B8B',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ fontSize: 28 }}>🧭</div>
              <div style={{
                background: 'rgba(255,255,255,0.85)', borderRadius: 999,
                padding: '5px 9px', fontFamily: 'var(--font-en)', fontSize: 11, fontWeight: 800,
                color: 'var(--teal)',
              }}>
                MIX MODE
              </div>
            </div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginTop: 8 }}>
              たんけん ミックス
            </div>
            <div className="en-label" style={{ fontSize: 11, marginTop: 2, opacity: 0.8 }}>Explorer Mix</div>
            <div style={{ marginTop: 8, fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: 'var(--brown-mid)', lineHeight: 1.4 }}>
              アンロックした レッスンから 10もん！
            </div>
            <div className="en-label" style={{ fontSize: 10, marginTop: 6 }}>mix plays: {progress.stats?.mixPlays || 0}</div>
          </button>
        </div>

        <div style={{ width: '100%', background: 'white', border: '2px solid var(--sand)', borderRadius: 22, padding: '14px 16px', boxShadow: '0 3px 0 var(--sand)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)' }}>きょうの クエスト</div>
              <div className="en-label" style={{ fontSize: 11 }}>Today’s quests</div>
            </div>
            <div style={{ fontFamily: 'var(--font-en)', fontSize: 11, fontWeight: 800, color: 'var(--brown-mid)' }}>{sessionsPlayed} plays</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
            {quests.map(quest => (
              <div key={quest.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: quest.done ? '#F3FAF4' : '#F9F5EE',
                border: `1.5px solid ${quest.done ? 'var(--green)' : 'var(--bg-alt)'}`,
                borderRadius: 16,
                padding: '10px 12px',
              }}>
                <span style={{ fontSize: 22 }}>{quest.emoji}</span>
                <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                  <div style={{ fontFamily: 'var(--font-jp)', fontSize: 13, fontWeight: 700, color: 'var(--brown)' }}>{quest.jp}</div>
                  <div className="en-label" style={{ fontSize: 10, marginTop: 2 }}>{quest.en}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: '100%' }}>
          {WORLDS.map(world => {
            const crowns = world.modules.map(mod => {
              const rec = getModuleRecord(progress, world.id, mod.id)
              return rec ? getCrown(rec.stars) : null
            })
            const completion = getWorldCompletion(world, progress)
            const goldCount = crowns.filter(c => c === '🥇').length

            return (
              <button
                key={world.id}
                className={`world-card${world.locked ? ' locked' : ''}`}
                style={{ background: world.tint, borderColor: world.locked ? 'var(--sand)' : world.border }}
                onClick={() => !world.locked && onSelectWorld(world)}
              >
                <div style={{ fontSize: 40 }}>{world.emoji}</div>
                <div style={{ fontFamily: 'var(--font-jp)', fontSize: 15, fontWeight: 700, color: 'var(--brown)', textAlign: 'center', lineHeight: 1.4 }}>
                  {world.titleJp}
                </div>
                <div className="en-label" style={{ fontSize: 10 }}>{world.titleEn}</div>

                {world.locked ? (
                  <div style={{ marginTop: 4, fontSize: 12, fontFamily: 'var(--font-jp)', color: 'var(--sand)', fontWeight: 700 }}>
                    🔒 もうすぐ！
                  </div>
                ) : (
                  <>
                    <div style={{ width: '100%', marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span className="en-label" style={{ fontSize: 10 }}>progress</span>
                        <span className="en-label" style={{ fontSize: 10 }}>{completion.completed}/{completion.total}</span>
                      </div>
                      <div className="progress-track" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${completion.percent}%` }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 6, display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {crowns.map((crown, i) => (
                        <span key={i} style={{ fontSize: 16, opacity: crown ? 1 : 0.25 }}>
                          {crown ?? '🥇'}
                        </span>
                      ))}
                      {goldCount === world.modules.length && world.modules.length > 0 && (
                        <span style={{ fontSize: 14, marginLeft: 2 }}>✨</span>
                      )}
                    </div>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function PassportScreen({ progress, onBack, onSelectWorld }) {
  const passport = getPassportSummary(progress)

  return (
    <div className="screen" style={{ paddingTop: 16 }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="back-btn" onClick={onBack}>← もどる</button>
        </div>

        <div className="passport-book">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-jp)', fontSize: 22, fontWeight: 900, color: 'var(--brown)' }}>はっけん パスポート</div>
              <div className="en-label" style={{ fontSize: 12 }}>Discovery Passport</div>
            </div>
            <div className="passport-seal" style={{ fontSize: 30 }}>🛂</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginTop: 14 }}>
            <div className="passport-stat-card"><span>📘</span><strong>{passport.lessonStamps}</strong><small>stamps</small></div>
            <div className="passport-stat-card"><span>🥇</span><strong>{passport.goldStamps}</strong><small>gold</small></div>
            <div className="passport-stat-card"><span>📅</span><strong>{passport.dailyStreak}</strong><small>daily</small></div>
            <div className="passport-stat-card"><span>🦉</span><strong>{passport.perfectSessions}</strong><small>perfect</small></div>
          </div>
        </div>

        <div style={{ background: 'white', border: '2px solid var(--sand)', borderRadius: 22, padding: '16px', boxShadow: '0 3px 0 var(--sand)' }}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)' }}>コレクション バッジ</div>
          <div className="en-label" style={{ fontSize: 11, marginTop: 2 }}>Collection badges</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginTop: 12 }}>
            {passport.badges.map(badge => (
              <div key={badge.id} className={`passport-badge${badge.unlocked ? ' unlocked' : ''}`}>
                <div style={{ fontSize: 28 }}>{badge.emoji}</div>
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 800, color: 'var(--brown)' }}>{badge.jp}</div>
                  <div className="en-label" style={{ fontSize: 10 }}>{badge.en}</div>
                </div>
                <div style={{ fontSize: 16 }}>{badge.unlocked ? '✨' : '🔒'}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {WORLDS.map(world => {
            const completion = getWorldCompletion(world, progress)
            return (
              <button key={world.id} className="passport-world-card" onClick={() => onSelectWorld(world)}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ fontSize: 28 }}>{world.emoji}</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontFamily: 'var(--font-jp)', fontSize: 15, fontWeight: 800, color: 'var(--brown)' }}>{world.titleJp}</div>
                      <div className="en-label" style={{ fontSize: 11 }}>{world.titleEn}</div>
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 900, color: 'var(--amber)' }}>{completion.completed}/{completion.total}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${world.modules.length}, 1fr)`, gap: 8, marginTop: 12 }}>
                  {world.modules.map(mod => {
                    const rec = getModuleRecord(progress, world.id, mod.id)
                    return (
                      <div key={mod.id} className={`passport-stamp${rec ? ' filled' : ''}`}>
                        <div style={{ fontSize: 24 }}>{rec ? mod.emoji : '⬜️'}</div>
                        <div style={{ fontFamily: 'var(--font-en)', fontSize: 10, fontWeight: 800, color: 'var(--brown-mid)' }}>{mod.id}</div>
                        <div style={{ fontSize: 13 }}>{rec ? getCrown(rec.stars) : '・'}</div>
                      </div>
                    )
                  })}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── World screen ─────────────────────────────────────────────────────────────

function WorldScreen({ world, progress, onBack, onSelectModule }) {
  const completion = getWorldCompletion(world, progress)

  return (
    <div className="screen" style={{ paddingTop: 16 }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="back-btn" onClick={onBack}>← もどる</button>
        </div>

        <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
          <div style={{ fontSize: 48 }}>{world.emoji}</div>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 20, fontWeight: 800, color: 'var(--brown)', marginTop: 4 }}>
            {world.titleJp}
          </div>
          <div className="en-label" style={{ fontSize: 13 }}>{world.titleEn}</div>
          <div style={{ marginTop: 10, background: 'white', border: '2px solid var(--sand)', borderRadius: 18, padding: '10px 12px', boxShadow: '0 2px 0 var(--sand)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="en-label" style={{ fontSize: 10 }}>world progress</span>
              <span className="en-label" style={{ fontSize: 10 }}>{completion.completed}/{completion.total} complete · {completion.gold} gold</span>
            </div>
            <div className="progress-track" style={{ height: 8 }}>
              <div className="progress-fill" style={{ width: `${completion.percent}%` }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {world.modules.map((mod, idx) => {
            const unlocked = isModuleUnlocked(progress, world.id, mod.id)
            const record = getModuleRecord(progress, world.id, mod.id)
            return (
              <button
                key={mod.id}
                className={`module-card${!unlocked ? ' locked' : ''}`}
                onClick={() => unlocked && onSelectModule(mod)}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: unlocked ? mod.color : 'var(--sand)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, flexShrink: 0,
                }}>
                  {unlocked ? mod.emoji : '🔒'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 700, color: unlocked ? 'var(--brown)' : 'var(--sand)', lineHeight: 1.3 }}>
                    {mod.titleJp}
                  </div>
                  <div className="en-label" style={{ fontSize: 12 }}>{mod.titleEn}</div>
                  {record && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <span style={{ fontSize: 22 }}>{getCrown(record.stars)}</span>
                      {record.stars < 3 && (
                        <span style={{ fontSize: 11, color: 'var(--amber)', fontFamily: 'var(--font-en)', fontWeight: 700 }}>
                          aim for 🥇
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-en)', fontSize: 22, color: unlocked ? mod.color : 'var(--sand)', fontWeight: 900 }}>
                  {idx + 1}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── Quiz screen ──────────────────────────────────────────────────────────────

function QuizScreen({ sessionMeta, session, qIndex, onAnswer, onBack }) {
  const [btnStates, setBtnStates] = useState({})
  const [locked, setLocked] = useState(false)
  const [owlMood, setOwlMood] = useState('neutral')
  const [showCorrect, setShowCorrect] = useState(false)

  const q = session[qIndex]
  const correctIdx = q.choices.findIndex(c => c.jp === q.correctJp)

  const handleTap = useCallback((idx) => {
    if (locked || btnStates[idx] === 'correct') return

    if (idx === correctIdx) {
      setBtnStates({ [idx]: 'correct' })
      setOwlMood('happy')
      setShowCorrect(true)
      setLocked(true)
      setTimeout(() => {
        setBtnStates({})
        setOwlMood('neutral')
        setShowCorrect(false)
        setLocked(false)
        onAnswer(true)
      }, 1300)
    } else {
      setBtnStates(prev => ({ ...prev, [idx]: 'wrong' }))
      setOwlMood('sad')
      onAnswer(false)
      setTimeout(() => {
        setBtnStates(prev => {
          const next = { ...prev }
          delete next[idx]
          return next
        })
        setOwlMood('neutral')
      }, 650)
    }
  }, [locked, btnStates, correctIdx, onAnswer])

  return (
    <div className="screen" style={{ paddingTop: 16 }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="back-btn" onClick={onBack}>← もどる</button>
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 700, color: 'var(--brown-mid)' }}>
            {qIndex + 1} / {session.length}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'white', border: '2px solid var(--sand)', borderRadius: 999,
            padding: '7px 12px', boxShadow: '0 2px 0 var(--sand)',
          }}>
            <span style={{ fontSize: 18 }}>{sessionMeta?.emoji || '🦉'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: 'var(--brown)' }}>{sessionMeta?.titleJp}</div>
              <div className="en-label" style={{ fontSize: 10 }}>{sessionMeta?.titleEn}</div>
            </div>
          </div>
          {(sessionMeta?.kind === 'mix' || sessionMeta?.kind === 'daily') && q?.sourceLabelEn && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-jp)', fontSize: 11, fontWeight: 700, color: 'var(--brown-mid)' }}>{q.sourceLabelJp}</div>
              <div className="en-label" style={{ fontSize: 10 }}>{q.sourceLabelEn}</div>
            </div>
          )}
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((qIndex + (locked ? 1 : 0)) / session.length) * 100}%` }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 8 }}>
          <div style={{ position: 'relative' }}>
            <Owl mood={owlMood} />
            {showCorrect && (
              <div className="feedback-toast">せいかい！ ✨</div>
            )}
          </div>
        </div>

        <div style={{
          background: 'white',
          border: '2.5px solid var(--sand)',
          borderRadius: 20,
          padding: '20px 16px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 12 }}>{q.visual}</div>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 20, fontWeight: 700, color: 'var(--brown)', lineHeight: 1.5 }}>
            {q.q}
          </div>
          <div className="en-label" style={{ marginTop: 4, fontSize: 13 }}>{q.qEn}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.choices.map((choice, i) => (
            <AnswerBtn
              key={`${qIndex}-${i}`}
              choice={choice}
              state={btnStates[i] || 'idle'}
              onClick={() => handleTap(i)}
              disabled={locked && btnStates[i] !== 'correct'}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Completion screen ────────────────────────────────────────────────────────

function CompletionScreen({ sessionMeta, stars, wrongCount, rankUp, newStreak, completionDetails, unlockInfo, onReplay, onBack }) {
  const crown = getCrown(stars)
  const kind = sessionMeta?.kind || 'module'
  const titleEn = sessionMeta?.titleEn || 'Lesson'
  const titleJp = sessionMeta?.titleJp || 'レッスン'

  return (
    <div className="screen slideup-anim" style={{ paddingTop: 24, justifyContent: 'center', minHeight: '100%' }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="bounce-anim" style={{ fontSize: 68, lineHeight: 1 }}>{sessionMeta?.emoji || '🦉'}</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 24, fontWeight: 900, color: 'var(--brown)' }}>
            おわった！
          </div>
          <div className="en-label" style={{ fontSize: 13, marginTop: 2 }}>
            {titleEn} complete
          </div>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 15, fontWeight: 700, color: 'var(--brown-mid)', marginTop: 6 }}>
            {titleJp}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <span className="bounce-anim" style={{ fontSize: 64, lineHeight: 1, animationDelay: '0.15s' }}>{crown}</span>
          <div style={{ fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 700, color: 'var(--brown-mid)' }}>
            {stars === 3 ? 'Gold Crown!' : stars === 2 ? 'Silver Crown!' : 'Bronze Crown!'}
          </div>
          <Stars count={stars} size={20} />
        </div>

        <div style={{
          background: 'white', border: '2.5px solid var(--sand)',
          borderRadius: 20, padding: '14px 24px', textAlign: 'center', width: '100%',
        }}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}>
            {stars === 3 && 'すごい！ かんぺき！'}
            {stars === 2 && 'よくできました！'}
            {stars === 1 && 'がんばったね！'}
          </div>
          <div className="en-label" style={{ marginTop: 3 }}>
            {stars === 3 && 'Perfect! No mistakes!'}
            {stars === 2 && 'Well done!'}
            {stars === 1 && 'Good effort!'}
          </div>
          {wrongCount > 0 && (
            <div style={{ marginTop: 8, fontFamily: 'var(--font-en)', fontSize: 12, color: 'var(--brown-mid)' }}>
              {wrongCount} wrong {wrongCount === 1 ? 'tap' : 'taps'}
            </div>
          )}
          {kind === 'module' && stars < 3 && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 12,
              background: '#FFF8E1', border: '1.5px solid var(--amber)',
              fontFamily: 'var(--font-jp)', fontSize: 13, color: 'var(--amber)', fontWeight: 700,
            }}>
              🥇 ゴールドに ちょうせん！
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 11, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>
                Play again with 0 mistakes for Gold!
              </div>
            </div>
          )}
          {kind !== 'module' && stars < 3 && (
            <div style={{
              marginTop: 10, padding: '8px 12px', borderRadius: 12,
              background: '#EAF6FF', border: '1.5px solid var(--teal)',
              fontFamily: 'var(--font-jp)', fontSize: 13, color: 'var(--teal)', fontWeight: 700,
            }}>
              🔄 もういちど ちょうせん！
              <div style={{ fontFamily: 'var(--font-en)', fontSize: 11, fontWeight: 600, opacity: 0.8, marginTop: 2 }}>
                Try again for a perfect 3-star run.
              </div>
            </div>
          )}
        </div>

        {completionDetails?.dailyAwarded && (
          <div className="rankup-banner" style={{
            width: '100%', borderRadius: 20, padding: '14px 20px', textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
            border: '2.5px solid var(--amber)',
            boxShadow: '0 4px 16px rgba(232,150,62,0.3)',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-en)', fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em', marginBottom: 4 }}>
              DAILY DISCOVERY
            </div>
            <div style={{ fontSize: 32 }}>📅</div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginTop: 4 }}>
              きょうの スタンプ げっと！
            </div>
            <div className="en-label" style={{ fontSize: 12, marginTop: 2 }}>
              Daily streak: {completionDetails.dailyStreak}
            </div>
          </div>
        )}

        {unlockInfo && (
          <div className="unlock-banner">
            <div style={{ fontSize: 11, fontFamily: 'var(--font-en)', fontWeight: 800, color: 'var(--teal)', letterSpacing: '0.08em' }}>
              NEW UNLOCK
            </div>
            <div style={{ fontSize: 34, marginTop: 4 }}>{unlockInfo.emoji}</div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginTop: 4 }}>
              {unlockInfo.titleJp}
            </div>
            <div className="en-label" style={{ fontSize: 12, marginTop: 2 }}>{unlockInfo.titleEn}</div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 12, fontWeight: 700, color: 'var(--brown-mid)', marginTop: 8 }}>
              つぎの レッスンが ひらいたよ！
            </div>
          </div>
        )}

        {kind === 'mix' && (
          <div style={{
            width: '100%', borderRadius: 20, padding: '12px 18px', textAlign: 'center',
            background: '#EAF6FF', border: '2px solid var(--teal)',
          }}>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 15, fontWeight: 800, color: 'var(--brown)' }}>
              いろんな せかいを たんけんしたね！
            </div>
            <div className="en-label" style={{ fontSize: 12, marginTop: 3 }}>
              Mixed questions from your unlocked lessons.
            </div>
          </div>
        )}

        {rankUp && (
          <div className="rankup-banner" style={{
            width: '100%', borderRadius: 20, padding: '14px 20px', textAlign: 'center',
            background: 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
            border: '2.5px solid var(--amber)',
            boxShadow: '0 4px 16px rgba(232,150,62,0.3)',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-en)', fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.08em', marginBottom: 4 }}>
              ★ RANK UP ★
            </div>
            <div style={{ fontSize: 32 }}>{rankUp.emoji}</div>
            <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 800, color: 'var(--brown)', marginTop: 4 }}>
              {rankUp.jp}
            </div>
            <div className="en-label" style={{ fontSize: 12, marginTop: 2 }}>{rankUp.en}</div>
          </div>
        )}

        {newStreak && (
          <div className="streak-pop" style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#FFF3E0', border: '2px solid var(--amber)',
            borderRadius: 50, padding: '8px 18px',
          }}>
            <span style={{ fontSize: 22 }}>🔥</span>
            <div>
              <span style={{ fontFamily: 'var(--font-en)', fontWeight: 900, fontSize: 18, color: 'var(--amber)' }}>{newStreak}</span>
              <span style={{ fontFamily: 'var(--font-en)', fontSize: 13, color: 'var(--brown-mid)', marginLeft: 5 }}>
                {newStreak === 1 ? 'day streak!' : 'days in a row!'}
              </span>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={onReplay}
            style={{
              background: 'var(--amber)', border: 'none', borderRadius: 18,
              padding: '15px', fontFamily: 'var(--font-jp)', fontSize: 19, fontWeight: 800,
              color: 'white', boxShadow: '0 4px 0 #BF6A1F', width: '100%',
            }}
          >
            {kind === 'daily' ? 'きょうの はっけんを もういちど 🔄' : kind === 'mix' ? 'ミックスを もういちど 🔄' : 'もういちど 🔄'}
          </button>
          <button
            onClick={onBack}
            className="back-btn"
            style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '13px' }}
          >
            もどる
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── App root ─────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState('home')
  const [activeWorld, setActiveWorld] = useState(null)
  const [activeModule, setActiveModule] = useState(null)
  const [activeSessionMeta, setActiveSessionMeta] = useState(null)
  const [session, setSession] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [completionStars, setCompletionStars] = useState(0)
  const [completionDetails, setCompletionDetails] = useState(null)
  const [unlockCelebration, setUnlockCelebration] = useState(null)
  const [progress, setProgress] = useState(loadProgress)
  const [showParent, setShowParent] = useState(false)
  const [rankUp, setRankUp] = useState(null)
  const [streakUpdated, setStreakUpdated] = useState(null)

  function beginSession({ sessionItems, meta, world = null, mod = null }) {
    if (!sessionItems.length) return
    setSession(sessionItems)
    setQIndex(0)
    setWrongCount(0)
    setCompletionDetails(null)
    setUnlockCelebration(null)
    setActiveWorld(world)
    setActiveModule(mod)
    setActiveSessionMeta(meta)
    setScreen('quiz')
  }

  function startModule(world, mod) {
    beginSession({
      sessionItems: buildSession(mod.data),
      meta: {
        kind: 'module',
        titleJp: mod.titleJp,
        titleEn: mod.titleEn,
        emoji: mod.emoji,
      },
      world,
      mod,
    })
  }

  function startExplorerMix() {
    beginSession({
      sessionItems: buildExplorerSession(progress),
      meta: {
        kind: 'mix',
        titleJp: 'たんけん ミックス',
        titleEn: 'Explorer Mix',
        emoji: '🧭',
      },
    })
  }

  function startDaily() {
    beginSession({
      sessionItems: buildDailySession(progress),
      meta: {
        kind: 'daily',
        titleJp: 'きょうの はっけん',
        titleEn: 'Daily Discovery',
        emoji: '📅',
      },
    })
  }

  function handleAnswer(correct) {
    if (!correct) {
      setWrongCount(c => c + 1)
      return
    }

    const nextIdx = qIndex + 1
    if (nextIdx < session.length) {
      setQIndex(nextIdx)
      return
    }

    const wc = wrongCount
    const stars = getStars(wc)
    setCompletionStars(stars)

    const withStreak = stampStreak(progress)
    const nextStats = {
      ...withStreak.stats,
      sessionsPlayed: (withStreak.stats?.sessionsPlayed || 0) + 1,
      perfectSessions: (withStreak.stats?.perfectSessions || 0) + (wc === 0 ? 1 : 0),
      mixPlays: (withStreak.stats?.mixPlays || 0) + (activeSessionMeta?.kind === 'mix' ? 1 : 0),
      dailyPlays: (withStreak.stats?.dailyPlays || 0) + (activeSessionMeta?.kind === 'daily' ? 1 : 0),
    }

    let next = {
      ...withStreak,
      stats: nextStats,
    }

    let sessionRankUp = null
    let dailyAwarded = false
    let unlockInfo = null

    if (activeSessionMeta?.kind === 'module' && activeWorld && activeModule) {
      const wKey = `w${activeWorld.id}`
      const mKey = `m${activeModule.id}`
      const existing = next[wKey]?.[mKey]
      const bestWrong = existing ? Math.min(existing.bestWrong, wc) : wc
      const bestStars = existing ? Math.max(existing.stars, stars) : stars
      next = {
        ...next,
        [wKey]: { ...next[wKey], [mKey]: { stars: bestStars, bestWrong } },
      }
      const prevRank = getExplorerRank(totalStarsAllWorlds(progress))
      const nextRank = getExplorerRank(totalStarsAllWorlds(next))
      sessionRankUp = prevRank.min !== nextRank.min ? nextRank : null
      unlockInfo = getNextUnlockInfo(activeWorld, activeModule, progress)
    }

    if (activeSessionMeta?.kind === 'daily') {
      const today = getTodayStr()
      dailyAwarded = next.daily?.lastCompleted !== today
      next = completeDaily(next)
    }

    saveProgress(next)
    setProgress(next)
    setRankUp(sessionRankUp)
    setUnlockCelebration(unlockInfo)
    setStreakUpdated(withStreak.streak !== (progress.streak || 0) ? withStreak.streak : null)
    setCompletionDetails({
      dailyAwarded,
      dailyStreak: next.daily?.streak || 0,
      sessionsPlayed: next.stats?.sessionsPlayed || 0,
      perfectSessions: next.stats?.perfectSessions || 0,
      unlockInfo,
    })

    setTimeout(() => setScreen('complete'), 400)
  }

  function handleReplay() {
    setRankUp(null)
    setStreakUpdated(null)
    setUnlockCelebration(null)
    if (activeSessionMeta?.kind === 'daily') {
      startDaily()
      return
    }
    if (activeSessionMeta?.kind === 'mix') {
      startExplorerMix()
      return
    }
    if (activeWorld && activeModule) {
      startModule(activeWorld, activeModule)
    }
  }

  function handleSessionBack() {
    if (activeSessionMeta?.kind === 'module' && activeWorld) {
      setScreen('world')
      return
    }
    setScreen('home')
  }

  function handleCompletionBack() {
    setRankUp(null)
    setStreakUpdated(null)
    setUnlockCelebration(null)
    setCompletionDetails(null)
    if (activeSessionMeta?.kind === 'module' && activeWorld) {
      setScreen('world')
      return
    }
    setScreen('home')
  }

  if (screen === 'home') {
    return (
      <>
        <HomeScreen
          progress={progress}
          onSelectWorld={world => {
            setActiveWorld(world)
            setScreen('world')
          }}
          onParent={() => setShowParent(true)}
          onPlayMix={startExplorerMix}
          onPlayDaily={startDaily}
          onOpenPassport={() => setScreen('passport')}
        />
        {showParent && (
          <ParentPanel
            progress={progress}
            onRestore={p => {
              setProgress(p)
              saveProgress(p)
            }}
            onReset={() => {
              const p = freshProgress()
              setProgress(p)
              saveProgress(p)
            }}
            onClose={() => setShowParent(false)}
          />
        )}
      </>
    )
  }

  if (screen === 'passport') {
    return (
      <PassportScreen
        progress={progress}
        onBack={() => setScreen('home')}
        onSelectWorld={world => {
          setActiveWorld(world)
          setScreen('world')
        }}
      />
    )
  }

  if (screen === 'world') {
    return (
      <WorldScreen
        world={activeWorld}
        progress={progress}
        onBack={() => setScreen('home')}
        onSelectModule={mod => startModule(activeWorld, mod)}
      />
    )
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        sessionMeta={activeSessionMeta}
        session={session}
        qIndex={qIndex}
        onAnswer={handleAnswer}
        onBack={handleSessionBack}
      />
    )
  }

  if (screen === 'complete') {
    return (
      <CompletionScreen
        sessionMeta={activeSessionMeta}
        stars={completionStars}
        wrongCount={wrongCount}
        rankUp={rankUp}
        newStreak={streakUpdated}
        completionDetails={completionDetails}
        unlockInfo={unlockCelebration}
        onReplay={handleReplay}
        onBack={handleCompletionBack}
      />
    )
  }

  return null
}
