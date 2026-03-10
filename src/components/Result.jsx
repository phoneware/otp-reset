export default function Result({ mac, model, error, onReset }) {
  return (
    <div>
      <div className="screen-title" style={{ marginBottom: 14 }}>Result</div>

      {error ? (
        <div className="banner banner-error">
          <div className="banner-title">&#10007; Failed to Enable OTP</div>
          {error}
        </div>
      ) : (
        <div className="banner banner-success">
          <div className="banner-title">&#10003; Global OTP Enabled</div>
          <strong>{mac}</strong> ({model}) now has global OTP enabled.
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <button className="btn btn-primary" onClick={onReset}>
          Reset Another Device
        </button>
      </div>
    </div>
  )
}
