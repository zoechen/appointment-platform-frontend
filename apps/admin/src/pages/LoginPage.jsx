import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../store/adminAuthStore.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAdminAuthStore((s) => s.login)
  const status = useAdminAuthStore((s) => s.status)
  const error = useAdminAuthStore((s) => s.error)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      await login({ email, password })
      navigate('/staff', { replace: true })
    } catch {
      // error 已經存在 store 裡，畫面會顯示
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '100%',
          maxWidth: 380,
          background: 'var(--ink-800)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          padding: 32
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 12,
            letterSpacing: '0.08em',
            color: 'var(--accent-hover)',
            margin: '0 0 6px',
            textTransform: 'uppercase'
          }}
        >
          Platform Admin
        </p>
        <h1 style={{ margin: '0 0 26px', fontSize: 22 }}>系統管理後台</h1>

        <Field label="Email">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            style={inputStyle}
          />
        </Field>
        <Field label="密碼">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </Field>

        {error && (
          <p style={{ color: 'var(--danger)', fontSize: 13, margin: '4px 0 0' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          style={{
            width: '100%',
            marginTop: 20,
            padding: '11px 0',
            borderRadius: 8,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            opacity: status === 'loading' ? 0.6 : 1
          }}
        >
          {status === 'loading' ? '登入中…' : '登入'}
        </button>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'block', marginBottom: 14 }}>
      <span style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 5 }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle = {
  width: '100%',
  padding: '9px 11px',
  borderRadius: 7,
  border: '1px solid var(--border)',
  background: 'var(--ink-900)',
  color: 'var(--text-primary)',
  fontSize: 14
}
