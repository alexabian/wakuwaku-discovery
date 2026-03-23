import { useState, useCallback } from 'react'
import { buildSession, WORLD1_MODULES } from './questionData.js'
import { WORLD2_MODULES } from './questionData2.js'

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
    locked: true,
    modules: [],
  },
  {
    id: 4,
    titleJp: 'アートのせかい',
    titleEn: 'World of Art',
    emoji: '🎨',
    tint: '#FCE4EC',
    border: '#D45B5B',
    locked: true,
    modules: [],
  },
]

// ─── Progress helpers ─────────────────────────────────────────────────────────

const STORAGE_KEY = 'wakuwaku_progress'

function freshProgress() {
  return {
    w1: { m1: null, m2: null, m3: null, m4: null },
    w2: { m1: null, m2: null, m3: null, m4: null },
  }
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return freshProgress()
}

function saveProgress(p) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)) } catch (_) {}
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

// ─── Parent panel ─────────────────────────────────────────────────────────────

function ParentPanel({ progress, onRestore, onReset, onClose }) {
  const [importVal, setImportVal] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [copied, setCopied] = useState(false)
  const exportCode = btoa(JSON.stringify(progress))

  function handleCopy() {
    navigator.clipboard.writeText(exportCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(atob(importVal.trim()))
      if (typeof parsed !== 'object' || parsed === null || !('w1' in parsed) || !('w2' in parsed)) throw new Error('bad')
      onRestore(parsed)
      setImportStatus('ok')
      setTimeout(onClose, 800)
    } catch (_) {
      setImportStatus('err')
      setTimeout(() => setImportStatus(null), 2000)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(44,36,24,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="fadein-anim"
        style={{
          background: 'var(--bg)', borderRadius: 28, padding: 28,
          width: '100%', maxWidth: 400,
          border: '3px solid var(--sand)',
          boxShadow: '0 12px 40px rgba(44,36,24,0.2)',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-en)', fontWeight: 900, fontSize: 18, color: 'var(--brown)' }}>
              Parent / Save Progress
            </div>
            <div style={{ fontSize: 12, color: 'var(--brown-mid)', marginTop: 3, opacity: 0.7 }}>
              Copy the code to save. Paste it to restore on any device.
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-alt)', border: 'none', borderRadius: 10,
              width: 34, height: 34, fontSize: 16, cursor: 'pointer', color: 'var(--brown-mid)',
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 8, fontFamily: 'var(--font-en)' }}>
            Save code (copy this)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              readOnly
              value={exportCode}
              onFocus={e => e.target.select()}
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                border: '2px solid var(--sand)', background: 'var(--bg-alt)',
                fontFamily: 'monospace', fontSize: 11, color: 'var(--brown)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                background: copied ? 'var(--green)' : 'var(--amber)',
                border: 'none', borderRadius: 12, padding: '10px 16px',
                color: 'white', fontFamily: 'var(--font-en)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 8, fontFamily: 'var(--font-en)' }}>
            Restore from code
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={importVal}
              onChange={e => { setImportVal(e.target.value); setImportStatus(null) }}
              placeholder="Paste save code here"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                border: `2px solid ${importStatus === 'err' ? 'var(--red)' : importStatus === 'ok' ? 'var(--green)' : 'var(--sand)'}`,
                background: 'var(--bg-alt)', fontFamily: 'monospace', fontSize: 11, color: 'var(--brown)',
              }}
            />
            <button
              onClick={handleImport}
              disabled={!importVal.trim()}
              style={{
                background: importStatus === 'ok' ? 'var(--green)' : importStatus === 'err' ? 'var(--red)' : 'var(--teal)',
                border: 'none', borderRadius: 12, padding: '10px 16px',
                color: 'white', fontFamily: 'var(--font-en)', fontWeight: 700, fontSize: 13,
                cursor: importVal.trim() ? 'pointer' : 'default',
                opacity: importVal.trim() ? 1 : 0.5, transition: 'background 0.2s',
              }}
            >
              {importStatus === 'ok' ? 'Done!' : importStatus === 'err' ? 'Error' : 'Restore'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: '2px solid var(--bg-alt)', paddingTop: 16 }}>
          <div style={{ fontSize: 12, color: 'var(--brown-mid)', marginBottom: 8, opacity: 0.7 }}>
            Reset all progress (cannot be undone)
          </div>
          <button
            onClick={() => { if (window.confirm("Reset all of Lidia's progress?")) { onReset(); onClose() } }}
            style={{
              background: 'transparent', border: '2px solid var(--sand)',
              borderRadius: 12, padding: '8px 16px',
              fontFamily: 'var(--font-en)', fontWeight: 700, fontSize: 13,
              color: 'var(--red)', cursor: 'pointer',
            }}
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Home screen ──────────────────────────────────────────────────────────────

function HomeScreen({ progress, onSelectWorld, onParent }) {
  return (
    <div className="screen" style={{ paddingTop: 28 }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

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
          <div style={{ fontSize: 52, lineHeight: 1, marginBottom: 6 }}>🦉</div>
          <div style={{ fontFamily: 'var(--font-rounded)', fontSize: 28, fontWeight: 800, color: 'var(--brown)', letterSpacing: '0.02em' }}>
            わくわく
          </div>
          <div style={{ fontFamily: 'var(--font-en)', fontSize: 26, fontWeight: 900, color: 'var(--amber)', letterSpacing: '0.04em' }}>
            Discovery
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 14,
          width: '100%',
        }}>
          {WORLDS.map(world => {
            const totalStars = world.modules.reduce((sum, mod) => {
              const rec = getModuleRecord(progress, world.id, mod.id)
              return sum + (rec ? rec.stars : 0)
            }, 0)
            const maxStars = world.modules.length * 3

            return (
              <button
                key={world.id}
                className={`world-card${world.locked ? ' locked' : ''}`}
                style={{ background: world.tint, borderColor: world.locked ? 'var(--sand)' : world.border }}
                onClick={() => !world.locked && onSelectWorld(world)}
              >
                <div style={{ fontSize: 44 }}>{world.emoji}</div>
                <div style={{ fontFamily: 'var(--font-jp)', fontSize: 16, fontWeight: 700, color: 'var(--brown)', textAlign: 'center', lineHeight: 1.4 }}>
                  {world.titleJp}
                </div>
                <div className="en-label" style={{ fontSize: 11 }}>{world.titleEn}</div>

                {world.locked ? (
                  <div style={{ marginTop: 6, fontSize: 13, fontFamily: 'var(--font-jp)', color: 'var(--sand)', fontWeight: 700 }}>
                    🔒 もうすぐ！
                  </div>
                ) : (
                  <div style={{ marginTop: 6 }}>
                    <Stars count={Math.round((totalStars / Math.max(maxStars, 1)) * 3)} size={16} />
                  </div>
                )}
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
                    <div style={{ marginTop: 4 }}>
                      <Stars count={record.stars} size={16} />
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

function QuizScreen({ module, session, qIndex, wrongCount, onAnswer, onBack }) {
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
            {qIndex + 1} / 10
          </span>
        </div>

        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((qIndex + (locked ? 1 : 0)) / 10) * 100}%` }} />
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

function CompletionScreen({ module, stars, wrongCount, onReplay, onBack }) {
  return (
    <div className="screen slideup-anim" style={{ paddingTop: 28, justifyContent: 'center', minHeight: '100%' }}>
      <ParchmentBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        <div className="bounce-anim" style={{ fontSize: 72, lineHeight: 1 }}>🦉</div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 26, fontWeight: 900, color: 'var(--brown)' }}>
            おわった！
          </div>
          <div className="en-label" style={{ fontSize: 14, marginTop: 2 }}>
            {module.titleEn} complete
          </div>
        </div>

        <Stars count={stars} size={52} animate />

        <div style={{
          background: 'white',
          border: '2.5px solid var(--sand)',
          borderRadius: 20,
          padding: '16px 28px',
          textAlign: 'center',
          width: '100%',
        }}>
          <div style={{ fontFamily: 'var(--font-jp)', fontSize: 18, fontWeight: 700, color: 'var(--brown)' }}>
            {stars === 3 && 'すごい！ かんぺき！'}
            {stars === 2 && 'よくできました！'}
            {stars === 1 && 'がんばったね！'}
          </div>
          <div className="en-label" style={{ marginTop: 4 }}>
            {stars === 3 && 'Perfect! No mistakes!'}
            {stars === 2 && 'Well done!'}
            {stars === 1 && 'Good effort!'}
          </div>
          {wrongCount > 0 && (
            <div style={{ marginTop: 10, fontFamily: 'var(--font-en)', fontSize: 13, color: 'var(--brown-mid)' }}>
              {wrongCount} wrong {wrongCount === 1 ? 'tap' : 'taps'}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button
            onClick={onReplay}
            style={{
              background: 'var(--amber)', border: 'none', borderRadius: 18,
              padding: '16px', fontFamily: 'var(--font-jp)', fontSize: 20, fontWeight: 800,
              color: 'white', boxShadow: '0 4px 0 #BF6A1F', width: '100%',
            }}
          >
            もういちど 🔄
          </button>
          <button
            onClick={onBack}
            className="back-btn"
            style={{ width: '100%', justifyContent: 'center', fontSize: 17, padding: '14px' }}
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
  const [session, setSession] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [wrongCount, setWrongCount] = useState(0)
  const [completionStars, setCompletionStars] = useState(0)
  const [progress, setProgress] = useState(loadProgress)
  const [showParent, setShowParent] = useState(false)

  function startModule(world, mod) {
    const s = buildSession(mod.data)
    setSession(s)
    setQIndex(0)
    setWrongCount(0)
    setActiveWorld(world)
    setActiveModule(mod)
    setScreen('quiz')
  }

  function handleAnswer(correct) {
    if (!correct) {
      setWrongCount(c => c + 1)
      return
    }
    const nextIdx = qIndex + 1
    if (nextIdx >= session.length) {
      const wc = wrongCount
      const stars = getStars(wc)
      setCompletionStars(stars)

      setProgress(prev => {
        const wKey = `w${activeWorld.id}`
        const mKey = `m${activeModule.id}`
        const existing = prev[wKey]?.[mKey]
        const bestWrong = existing ? Math.min(existing.bestWrong, wc) : wc
        const bestStars = existing ? Math.max(existing.stars, stars) : stars
        const next = {
          ...prev,
          [wKey]: {
            ...prev[wKey],
            [mKey]: { stars: bestStars, bestWrong },
          },
        }
        saveProgress(next)
        return next
      })

      setTimeout(() => setScreen('complete'), 400)
    } else {
      setQIndex(nextIdx)
    }
  }

  function handleReplay() {
    startModule(activeWorld, activeModule)
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
        module={activeModule}
        session={session}
        qIndex={qIndex}
        wrongCount={wrongCount}
        onAnswer={handleAnswer}
        onBack={() => setScreen('world')}
      />
    )
  }

  if (screen === 'complete') {
    return (
      <CompletionScreen
        module={activeModule}
        stars={completionStars}
        wrongCount={wrongCount}
        onReplay={handleReplay}
        onBack={() => setScreen('world')}
      />
    )
  }

  return null
}
