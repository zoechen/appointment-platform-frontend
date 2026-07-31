import { useEffect, useState } from 'react'
import { request } from '../api.js'
import { DataTable } from '../components/DataTable.jsx'
import { Badge, OnlineDot } from '../components/Badge.jsx'
import { Modal } from '../components/Modal.jsx'
import {
  PageHeader,
  Field,
  ActionButton,
  inputStyle,
  primaryButtonStyle,
  secondaryButtonStyle
} from '../components/ui.jsx'

export default function StaffListPage() {
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingStaff, setEditingStaff] = useState(null)
  const [error, setError] = useState('')

  async function load(searchTerm) {
    setLoading(true)
    try {
      const data = await request('/admin/staff', { query: { search: searchTerm } })
      setStaff(data.staff)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
  }, [])

  function handleSearchSubmit(e) {
    e.preventDefault()
    load(search)
  }

  async function handleToggleDisabled(row) {
    const confirmed = window.confirm(
      row.IsDisabled
        ? `確定要重新啟用「${row.DisplayName}」嗎？`
        : `確定要停用「${row.DisplayName}」嗎？停用後這個帳號將無法登入。`
    )
    if (!confirmed) return

    try {
      const data = await request(`/admin/staff/${row.StaffId}`, {
        method: 'PATCH',
        body: { isDisabled: !row.IsDisabled }
      })
      setStaff((prev) => prev.map((s) => (s.StaffId === row.StaffId ? { ...s, ...data.staff } : s)))
    } catch (err) {
      alert(err.message)
    }
  }

  const columns = [
    { key: 'online', header: '', render: (row) => <OnlineDot online={row.IsOnline} /> },
    { key: 'DisplayName', header: '姓名' },
    { key: 'Email', header: 'Email' },
    { key: 'BusinessName', header: '所屬店家' },
    {
      key: 'Role',
      header: '角色',
      render: (row) => <Badge tone="accent">{row.Role === 'owner' ? '負責人' : '員工'}</Badge>
    },
    {
      key: 'status',
      header: '狀態',
      render: (row) => (row.IsDisabled ? <Badge tone="danger">已停用</Badge> : <Badge tone="ok">正常</Badge>)
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <ActionButton onClick={() => setEditingStaff(row)}>編輯</ActionButton>
          <ActionButton danger={!row.IsDisabled} onClick={() => handleToggleDisabled(row)}>
            {row.IsDisabled ? '啟用' : '停用'}
          </ActionButton>
        </div>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="使用者管理" subtitle="所有店家的員工帳號，跨租戶檢視" />

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋姓名 / Email / 店家名稱"
          style={{ ...inputStyle, flex: 1, maxWidth: 320 }}
        />
        <button type="submit" style={secondaryButtonStyle}>
          搜尋
        </button>
      </form>

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>載入中…</p>
      ) : (
        <DataTable columns={columns} rows={staff} rowKey="StaffId" emptyText="沒有符合的使用者" />
      )}

      {editingStaff && (
        <EditStaffModal
          staff={editingStaff}
          onClose={() => setEditingStaff(null)}
          onSaved={(updated) => {
            setStaff((prev) => prev.map((s) => (s.StaffId === updated.StaffId ? { ...s, ...updated } : s)))
            setEditingStaff(null)
          }}
        />
      )}
    </div>
  )
}

function EditStaffModal({ staff, onClose, onSaved }) {
  const [displayName, setDisplayName] = useState(staff.DisplayName)
  const [role, setRole] = useState(staff.Role)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const data = await request(`/admin/staff/${staff.StaffId}`, {
        method: 'PATCH',
        body: { displayName, role }
      })
      onSaved(data.staff)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title="編輯使用者"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} style={secondaryButtonStyle}>
            取消
          </button>
          <button onClick={handleSave} disabled={saving} style={primaryButtonStyle}>
            {saving ? '儲存中…' : '儲存'}
          </button>
        </>
      }
    >
      <Field label="姓名">
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
      </Field>
      <Field label="角色">
        <select value={role} onChange={(e) => setRole(e.target.value)} style={inputStyle}>
          <option value="owner">負責人</option>
          <option value="staff">員工</option>
        </select>
      </Field>
      <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email：{staff.Email}（無法在此更改）</p>
      {error && <p style={{ color: 'var(--danger)', fontSize: 13 }}>{error}</p>}
    </Modal>
  )
}
