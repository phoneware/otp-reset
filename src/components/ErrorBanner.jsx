export default function ErrorBanner({ type, mac, territory, domain, onTryAnother }) {
  if (type === 'ACCESS_DENIED') {
    return (
      <div>
        <div className="banner banner-error">
          <div className="banner-title">&#10007; Access Denied</div>
          You do not have permission to access device <strong>{mac}</strong>.
        </div>
        <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={onTryAnother}>
          Try Another MAC
        </button>
      </div>
    )
  }

  if (type === 'NOT_FOUND') {
    return (
      <div>
        <div className="banner banner-warn">
          <div className="banner-title">&#10007; Device Not Found</div>
          No device with MAC <strong>{mac}</strong> found in domain <strong>{domain}</strong>.
        </div>
        <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={onTryAnother}>
          Try Another MAC
        </button>
      </div>
    )
  }

  if (type === 'SESSION_EXPIRED') {
    return (
      <div className="banner banner-error">
        <div className="banner-title">Session Expired</div>
        Your portal session has expired. Please refresh the Manager Portal page.
      </div>
    )
  }

  return (
    <div>
      <div className="banner banner-error">
        <div className="banner-title">&#10007; Network Error</div>
        An unexpected error occurred. Please try again.
      </div>
      <button className="btn btn-secondary" style={{ marginTop: 14 }} onClick={onTryAnother}>
        Try Another MAC
      </button>
    </div>
  )
}
