export function Text({ label, value, onChange, placeholder, maxLength }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <input
        type="text"
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
    </label>
  )
}

export function Area({ label, value, onChange, rows = 4, placeholder }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <textarea
        rows={rows}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}

export function Row({ children }) {
  return <div className="row">{children}</div>
}

export function Card({ title, onRemove, children }) {
  return (
    <div className="card">
      <div className="card-head">
        <strong>{title}</strong>
        {onRemove && <button className="link-btn danger" onClick={onRemove}>Премахни</button>}
      </div>
      {children}
    </div>
  )
}
