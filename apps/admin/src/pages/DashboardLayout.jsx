import { useEffect } from 'react'
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuthStore } from '../store/adminAuthStore.js'
import { getToken } from '../api.js'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const status = useAdminAuthStore((s) => s.status)
  const admin = useAdminAuthStore((s) => s.admin)
  const fetchMe = useAdminAuthStore((s) => s.fetchMe)
  const logout = useAdminAuthStore((s) => s.logout)

  useEffect(() => {
    if (getToken() && !admin) fetchMe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!getToken()) {
    return <Navigate to="/login" replace />
  }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          background: 'var(--ink-950)',
          borderRight: '1px solid var(--border)',
          padding: '20px 14px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div style={{ padding: '0 8px', marginBottom: 28 }}>
          <p
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--accent-hover)',
              margin: '0 0 4px',
              textTransform: 'uppercase'
            }}
          >
            Platform Admin
          </p>
          <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>系統管理後台</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          <NavItem to="/staff">使用者管理</NavItem>
          <NavItem to="/businesses">店家管理</NavItem>
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
          {admin && (
            <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-secondary)', padding: '0 8px' }}>
              {admin.DisplayName}
              <br />
              <span style={{ color: 'var(--text-muted)' }}>{admin.Email}</span>
            </p>
          )}
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '8px 0',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 13
            }}
          >
            登出
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '28px 32px', maxWidth: 1200 }}>
        {status === 'error' ? null : <Outlet />}
      </main>
    </div>
  )
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        padding: '9px 10px',
        borderRadius: 8,
        fontSize: 14,
        textDecoration: 'none',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
        background: isActive ? 'var(--ink-800)' : 'transparent',
        fontWeight: isActive ? 600 : 400
      })}
    >
      {children}
    </NavLink>
  )
}
