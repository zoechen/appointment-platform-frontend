export function PageHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h1 style={{ margin: '0 0 4px', fontSize: 20 }}>{title}</h1>
      {subtitle && <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  )
}

export function Field({ label, children, hint }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
        {label}
      </span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{hint}</span>}
    </label>
  )
}

export function ActionButton({ children, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px',
        borderRadius: 6,
        border: `1px solid ${danger ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
        background: 'transparent',
        color: danger ? 'var(--danger)' : 'var(--text-secondary)',
        fontSize: 12.5
      }}
    >
      {children}
    </button>
  )
}

export const inputStyle = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--ink-900)',
  color: 'var(--text-primary)',
  fontSize: 14
}

export const primaryButtonStyle = {
  padding: '8px 16px',
  borderRadius: 7,
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: 13.5,
  fontWeight: 600
}

export const secondaryButtonStyle = {
  padding: '8px 16px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 13.5
}

export function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: 'var(--ink-800)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px 16px',
        minWidth: 140
      }}
    >
      <p style={{ margin: '0 0 6px', fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{value}</p>
    </div>
  )
}
