import { useState } from 'react'

const MAC_REGEX = /^[0-9A-F]{12}$/

function normalizeMac(raw) {
  return raw.replace(/[:\-\s]/g, '').toUpperCase()
}

export default function MacInput({ onLookup, loading }) {
  const [raw, setRaw] = useState('')
  const normalized = normalizeMac(raw)
  const isValid = MAC_REGEX.test(normalized)
  const showError = raw.length > 0 && !isValid && normalized.length >= 12

  return (
    <div>
      <div className="field-label">MAC Address</div>
      <input
        className={`field ${raw ? 'filled' : ''}`}
        type="text"
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        placeholder="00:A1:B2:C3:D4:E5"
      />
      <div className="field-hint">With or without colons/dashes. Auto-stripped.</div>
      {showError && (
        <div className="banner banner-error" style={{ marginBottom: 14 }}>
          Invalid MAC format. Enter 12 hex characters.
        </div>
      )}
      <button
        className={`btn ${isValid && !loading ? 'btn-primary' : 'btn-disabled'}`}
        disabled={!isValid || loading}
        onClick={() => onLookup(normalized)}
      >
        {loading ? 'Looking up...' : 'Look Up Device'}
      </button>
    </div>
  )
}
