export function Badge({ tone = 'muted', children }) {
  const colors = {
    ok: { bg: 'rgba(34,197,94,0.14)', fg: '#4ade80', border: 'rgba(34,197,94,0.35)' },
    warn: { bg: 'rgba(245,158,11,0.14)', fg: '#fbbf24', border: 'rgba(245,158,11,0.35)' },
    danger: { bg: 'rgba(239,68,68,0.14)', fg: '#f87171', border: 'rgba(239,68,68,0.35)' },
    muted: { bg: 'rgba(148,163,184,0.12)', fg: '#94a3b8', border: 'rgba(148,163,184,0.3)' },
    accent: { bg: 'rgba(37,99,235,0.14)', fg: '#60a5fa', border: 'rgba(37,99,235,0.35)' }
  }
  const c = colors[tone] || colors.muted

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 999,
        fontSize: 12,
        fontFamily: 'var(--font-mono)',
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  )
}

export function OnlineDot({ online }) {
  return (
    <span
      title={online ? '在線' : '離線'}
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: online ? '#22c55e' : '#475569',
        boxShadow: online ? '0 0 0 3px rgba(34,197,94,0.18)' : 'none'
      }}
    />
  )
}
