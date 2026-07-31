import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../api.js'
import { DataTable } from '../components/DataTable.jsx'
import { Badge } from '../components/Badge.jsx'
import { PageHeader, inputStyle, secondaryButtonStyle } from '../components/ui.jsx'

export default function BusinessListPage() {
  const navigate = useNavigate()
  const [businesses, setBusinesses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  async function load(searchTerm) {
    setLoading(true)
    try {
      const data = await request('/admin/businesses', { query: { search: searchTerm } })
      setBusinesses(data.businesses)
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

  const columns = [
    { key: 'Name', header: '店家名稱' },
    { key: 'Email', header: 'Email' },
    { key: 'StaffCount', header: '員工數' },
    { key: 'ChannelCount', header: '已綁通路' },
    { key: 'ConversationCount', header: '對話數' },
    { key: 'AppointmentCount', header: '預約數' },
    {
      key: 'status',
      header: '狀態',
      render: (row) => (row.IsDisabled ? <Badge tone="danger">已停用</Badge> : <Badge tone="ok">正常</Badge>)
    }
  ]

  return (
    <div>
      <PageHeader title="店家管理" subtitle="所有租戶（Business）的使用狀況" />

      <form onSubmit={handleSearchSubmit} style={{ marginBottom: 18, display: 'flex', gap: 8 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋店家名稱 / Email"
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
        <DataTable
          columns={columns}
          rows={businesses}
          rowKey="BusinessId"
          emptyText="沒有符合的店家"
          onRowClick={(row) => navigate(`/businesses/${row.BusinessId}`)}
        />
      )}
    </div>
  )
}
