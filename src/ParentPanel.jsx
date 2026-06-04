import { useRef, useState } from 'react'
import { normaliseProgress } from './progress.js'

export default function ParentPanel({ progress, onRestore, onReset, onClose }) {
  const [cloudName, setCloudName] = useState('')
  const [cloudPin, setCloudPin] = useState('')
  const [cloudStatus, setCloudStatus] = useState(null)
  const [importVal, setImportVal] = useState('')
  const [importStatus, setImportStatus] = useState(null)
  const [copyStatus, setCopyStatus] = useState('idle')
  const exportInputRef = useRef(null)

  const cloudReady = cloudName.trim().length > 0 && cloudPin.length === 4
  const exportCode = btoa(JSON.stringify(progress))

  function resetCloudStatus(delay = 3000) {
    setTimeout(() => setCloudStatus(null), delay)
  }

  async function handleCloudSave() {
    if (!cloudReady) return
    setCloudStatus('saving')
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloudName.trim(), pin: cloudPin, progress }),
      })

      if (response.status === 429) {
        setCloudStatus('err-rate')
        resetCloudStatus()
      } else if (response.status === 403) {
        setCloudStatus('err-auth')
        resetCloudStatus()
      } else if (!response.ok) {
        setCloudStatus('err')
        resetCloudStatus()
      } else {
        setCloudStatus('ok-save')
        resetCloudStatus()
      }
    } catch {
      setCloudStatus('err')
      resetCloudStatus()
    }
  }

  async function handleCloudLoad() {
    if (!cloudReady) return
    setCloudStatus('loading')
    try {
      const response = await fetch('/api/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloudName.trim(), pin: cloudPin }),
      })
      const data = response.ok ? await response.json() : null

      if (response.status === 429) {
        setCloudStatus('err-rate')
        resetCloudStatus()
      } else if (response.status === 403) {
        setCloudStatus('err-auth')
        resetCloudStatus()
      } else if (!response.ok) {
        setCloudStatus('err')
        resetCloudStatus()
      } else {
        const normalised = normaliseProgress(data?.progress)
        if (!normalised) {
          setCloudStatus('err')
          resetCloudStatus()
          return
        }
        onRestore(normalised)
        setCloudStatus('ok-load')
        setTimeout(onClose, 900)
      }
    } catch {
      setCloudStatus('err')
      resetCloudStatus()
    }
  }

  function flashCopyStatus(status, delay = 2000) {
    setCopyStatus(status)
    window.clearTimeout(flashCopyStatus.timeoutId)
    flashCopyStatus.timeoutId = window.setTimeout(() => setCopyStatus('idle'), delay)
  }

  function fallbackCopy() {
    const input = exportInputRef.current
    if (!input) return false
    input.focus()
    input.select()
    input.setSelectionRange(0, input.value.length)
    try {
      return document.execCommand('copy')
    } catch (_) {
      return false
    }
  }

  async function handleCopy() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(exportCode)
        flashCopyStatus('copied')
        return
      }
    } catch (_) {
      // Fall back to manual selection / execCommand below.
    }

    if (fallbackCopy()) {
      flashCopyStatus('copied')
    } else {
      fallbackCopy()
      flashCopyStatus('manual', 2600)
    }
  }

  function handleImport() {
    try {
      const parsed = JSON.parse(atob(importVal.trim()))
      const normalised = normaliseProgress(parsed)
      if (!normalised) throw new Error('bad')
      onRestore(normalised)
      setImportStatus('ok')
      setTimeout(onClose, 800)
    } catch (_) {
      setImportStatus('err')
      setTimeout(() => setImportStatus(null), 2000)
    }
  }

  const cloudMsg = {
    saving: { text: 'Saving…', color: 'var(--amber)' },
    loading: { text: 'Loading…', color: 'var(--teal)' },
    'ok-save': { text: '✅ Saved!', color: 'var(--green)' },
    'ok-load': { text: '✅ Loaded!', color: 'var(--green)' },
    'err-auth': { text: '❌ Invalid profile or PIN', color: 'var(--red)' },
    'err-rate': { text: '⏳ Too many tries — wait a bit', color: 'var(--red)' },
    err: { text: '❌ Error — try again', color: 'var(--red)' },
  }[cloudStatus] ?? null

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
        onClick={event => event.stopPropagation()}
        className="fadein-anim"
        style={{
          background: 'var(--bg)', borderRadius: 28, padding: 28,
          width: '100%', maxWidth: 400,
          border: '3px solid var(--sand)',
          boxShadow: '0 12px 40px rgba(44,36,24,0.2)',
          display: 'flex', flexDirection: 'column', gap: 20,
          overflowY: 'auto', maxHeight: '90vh',
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

        <div style={{
          background: 'white', borderRadius: 16, padding: 16,
          border: '2px solid var(--teal)', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ fontFamily: 'var(--font-en)', fontWeight: 800, fontSize: 14, color: 'var(--teal)' }}>
            ☁️ Cloud Save / Load
          </div>
          <div style={{ fontSize: 12, color: 'var(--brown-mid)', opacity: 0.8 }}>
            Pick a name + 4-digit PIN to sync across devices.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={cloudName}
              onChange={event => setCloudName(event.target.value)}
              placeholder="Name (e.g. Lidia)"
              maxLength={30}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10,
                border: '2px solid var(--sand)', background: 'var(--bg-alt)',
                fontFamily: 'var(--font-en)', fontSize: 13, color: 'var(--brown)',
              }}
            />
            <input
              value={cloudPin}
              onChange={event => setCloudPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="PIN"
              type="password"
              inputMode="numeric"
              maxLength={4}
              style={{
                width: 70, padding: '9px 12px', borderRadius: 10,
                border: '2px solid var(--sand)', background: 'var(--bg-alt)',
                fontFamily: 'var(--font-en)', fontSize: 13, color: 'var(--brown)',
                textAlign: 'center',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleCloudSave}
              disabled={!cloudReady || cloudStatus === 'saving' || cloudStatus === 'loading'}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10,
                background: 'var(--teal)', border: 'none',
                color: 'white', fontFamily: 'var(--font-en)', fontWeight: 700, fontSize: 13,
                cursor: cloudReady ? 'pointer' : 'default',
                opacity: cloudReady ? 1 : 0.45, transition: 'opacity 0.2s',
              }}
            >
              ⬆ Save
            </button>
            <button
              onClick={handleCloudLoad}
              disabled={!cloudReady || cloudStatus === 'saving' || cloudStatus === 'loading'}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 10,
                background: 'var(--amber)', border: 'none',
                color: 'white', fontFamily: 'var(--font-en)', fontWeight: 700, fontSize: 13,
                cursor: cloudReady ? 'pointer' : 'default',
                opacity: cloudReady ? 1 : 0.45, transition: 'opacity 0.2s',
              }}
            >
              ⬇ Load
            </button>
          </div>
          {cloudMsg && (
            <div style={{ fontFamily: 'var(--font-en)', fontSize: 13, fontWeight: 700, color: cloudMsg.color, textAlign: 'center' }}>
              {cloudMsg.text}
            </div>
          )}
        </div>

        <div style={{ borderTop: '2px solid var(--bg-alt)' }} />

        <div>
          <div style={{ fontSize: 12, color: 'var(--brown-mid)', marginBottom: 6, opacity: 0.6, fontFamily: 'var(--font-en)', fontWeight: 700 }}>
            Backup code (manual)
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brown)', marginBottom: 8, fontFamily: 'var(--font-en)' }}>
            Save code (copy this)
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={exportInputRef}
              readOnly
              value={exportCode}
              onFocus={event => event.target.select()}
              onClick={event => event.target.select()}
              aria-label="Save code"
              style={{
                flex: 1, padding: '10px 12px', borderRadius: 12,
                border: `2px solid ${copyStatus === 'manual' ? 'var(--amber)' : 'var(--sand)'}`,
                background: 'var(--bg-alt)',
                fontFamily: 'monospace', fontSize: 11, color: 'var(--brown)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            />
            <button
              onClick={handleCopy}
              style={{
                background: copyStatus === 'copied' ? 'var(--green)' : copyStatus === 'manual' ? 'var(--teal)' : 'var(--amber)',
                border: 'none', borderRadius: 12, padding: '10px 16px',
                color: 'white', fontFamily: 'var(--font-en)', fontWeight: 700, fontSize: 13,
                cursor: 'pointer', transition: 'background 0.2s', whiteSpace: 'nowrap',
              }}
            >
              {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'manual' ? 'Press Ctrl+C' : 'Copy'}
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
              onChange={event => { setImportVal(event.target.value); setImportStatus(null) }}
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
            onClick={() => {
              if (window.confirm("Reset all of Lidia's progress?")) {
                onReset()
                onClose()
              }
            }}
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
