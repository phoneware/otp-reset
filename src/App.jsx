import { useState, useCallback } from 'react'
import { decodeJwt, isTokenExpired } from './utils/jwt.js'
import { getPhone, enableGlobalOtp, setParentOrigin } from './api/ns.js'
import { usePortalMessage } from './hooks/usePortalMessage.js'
import { useHeightReporter } from './hooks/useHeightReporter.js'
import UserInfoBar from './components/UserInfoBar.jsx'
import MacInput from './components/MacInput.jsx'
import DeviceConfirm from './components/DeviceConfirm.jsx'
import Result from './components/Result.jsx'
import ErrorBanner from './components/ErrorBanner.jsx'
import './App.css'

export default function App() {
  const [session, setSession] = useState(null)
  const [step, setStep] = useState('waiting')
  const [phone, setPhone] = useState(null)
  const [mac, setMac] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const containerRef = useHeightReporter(session?.origin)

  const handleInit = useCallback((data) => {
    const payload = decodeJwt(data.token)
    if (!payload) {
      setError({ type: 'SESSION_EXPIRED' })
      setStep('error')
      return
    }
    if (isTokenExpired(payload)) {
      setError({ type: 'SESSION_EXPIRED' })
      setStep('error')
      return
    }
    setParentOrigin(data.origin)
    setSession({
      token: data.token,
      domain: data.domain,
      origin: data.origin,
      user: payload.user,
      user_scope: payload.user_scope,
      territory: payload.territory,
    })
    setStep('mac-input')
  }, [])

  usePortalMessage(handleInit)

  function checkExpiration() {
    if (!session) return false
    const payload = decodeJwt(session.token)
    if (isTokenExpired(payload)) {
      setError({ type: 'SESSION_EXPIRED' })
      setStep('error')
      return false
    }
    return true
  }

  async function handleLookup(normalizedMac) {
    if (!checkExpiration()) return
    setLoading(true)
    setMac(normalizedMac)
    try {
      const result = await getPhone(session.domain, normalizedMac, session.token)
      if (checkAuthorization(result, normalizedMac)) {
        setPhone(result)
        setStep('confirm')
      }
    } catch (err) {
      setError({ type: err.message, mac: normalizedMac })
      setStep('error')
    } finally {
      setLoading(false)
    }
  }

  function checkAuthorization() {
    return true
  }

  async function handleEnable() {
    if (!checkExpiration()) return
    setLoading(true)
    try {
      await enableGlobalOtp(session.domain, phone, session.token)
      setStep('result')
    } catch (err) {
      setError({ type: err.message })
      if (err.message === 'SESSION_EXPIRED') {
        setStep('error')
      } else {
        setStep('result-error')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setPhone(null)
    setMac('')
    setError(null)
    setStep('mac-input')
  }

  if (step === 'waiting') {
    return (
      <div ref={containerRef} className="app">
        <div className="screen-body">
          <div className="screen-desc">Waiting for portal initialization...</div>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="app">
      <div className="screen-body">
        {step === 'mac-input' && (
          <>
            <div className="screen-title">Enable Global OTP</div>
            <div className="screen-desc">Look up a device to enable global OTP.</div>
            <UserInfoBar
              user={session.user}
              userScope={session.user_scope}
              territory={session.territory}
              domain={session.domain}
            />
            <MacInput onLookup={handleLookup} loading={loading} />
          </>
        )}

        {step === 'confirm' && (
          <DeviceConfirm
            phone={phone}
            mac={mac}
            onEnable={handleEnable}
            onBack={handleReset}
            loading={loading}
          />
        )}

        {step === 'result' && (
          <Result
            mac={mac}
            model={phone?.['device-models-brand-and-model'] || 'Unknown'}
            onReset={handleReset}
          />
        )}

        {step === 'result-error' && (
          <Result
            mac={mac}
            model={phone?.['device-models-brand-and-model'] || 'Unknown'}
            error={error?.type === 'NETWORK_ERROR'
              ? 'A network error occurred while enabling OTP. Please try again.'
              : 'An unexpected error occurred.'}
            onReset={handleReset}
          />
        )}

        {step === 'error' && (
          <ErrorBanner
            type={error?.type}
            mac={error?.mac || mac}
            territory={error?.territory}
            domain={session?.domain}
            onTryAnother={handleReset}
          />
        )}
      </div>
    </div>
  )
}
