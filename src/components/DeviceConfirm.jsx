export default function DeviceConfirm({ phone, mac, onEnable, onBack, loading }) {
  const otpEnabled = phone['global-one-time-pass'] === 'yes'
  const line1 = phone.lines?.line?.[0]
  const line1Display = line1
    ? `${line1['display-name'] || line1.user || ''}@${line1.domain || ''}`
    : 'N/A'

  return (
    <div>
      <div className="screen-title">Confirm Device</div>
      <div className="screen-desc">Verify this is the correct device before enabling OTP.</div>

      <div className="device-card">
        <div className="row">
          <span className="label">MAC</span>
          <span className="value mono">{mac}</span>
        </div>
        <div className="row">
          <span className="label">Model</span>
          <span className="value">{phone['device-models-brand-and-model'] || 'Unknown'}</span>
        </div>
        <div className="row">
          <span className="label">Domain</span>
          <span className="value">{phone.domain || 'N/A'}</span>
        </div>
        <div className="row">
          <span className="label">Reseller</span>
          <span className="value">{phone.reseller || 'N/A'}</span>
        </div>
        <div className="row">
          <span className="label">Line 1</span>
          <span className="value">{line1Display}</span>
        </div>
        <div className="row">
          <span className="label">Global OTP</span>
          <span className={`value ${otpEnabled ? 'status-on' : 'status-off'}`}>
            {otpEnabled ? 'Enabled' : 'Not Enabled'}
          </span>
        </div>
      </div>

      <button
        className={`btn ${loading ? 'btn-disabled' : 'btn-primary'}`}
        disabled={loading}
        onClick={onEnable}
      >
        {loading ? 'Enabling...' : 'Enable Global OTP'}
      </button>
      <button className="btn btn-secondary" onClick={onBack} disabled={loading}>
        Back
      </button>
    </div>
  )
}
