import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { request } from '../api.js'
import { DataTable } from '../components/DataTable.jsx'
import { Badge } from '../components/Badge.jsx'
import { PageHeader, StatCard, secondaryButtonStyle } from '../components/ui.jsx'

const PLATFORM_LABEL = { facebook: 'Facebook', instagram: 'Instagram', line: 'LINE' }

export default function BusinessDetailPage() {
  const { id } = useParams()
  const [business, setBusiness] = useState(null)
  const [stats, setStats] = useState(null)
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [detail, convData] = await Promise.all([
        request(`/admin/businesses/${id}`),
        request(`/admin/businesses/${id}/conversations`)
      ])
      setBusiness(detail.business)
      setStats(detail.stats)
      setConversations(convData.conversations)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleToggleDisabled() {
    const confirmed = window.confirm(
      business.IsDisabled
        ? `確定要重新啟用「${business.Name}」嗎？`
        : `確定要停用「${business.Name}」嗎？停用後這個店家底下所有員工都無法登入。`
    )
    if (!confirmed) return

    try {
      const data = await request(`/admin/businesses/${id}`, {
        method: 'PATCH',
        body: { isDisabled: !business.IsDisabled }
      })
      setBusiness(data.business)
    } catch (err) {
      alert(err.message)
    }
  }

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>載入中…</p>
  if (error) return <p style={{ color: 'var(--danger)' }}>{error}</p>
  if (!business) return null

  const conversationColumns = [
    { key: 'DisplayName', header: '客人', render: (row) => row.DisplayName || '未命名客人' },
    {
      key: 'Platform',
      header: '平台',
      render: (row) => <Badge tone="accent">{PLATFORM_LABEL[row.Platform] || row.Platform}</Badge>
    },
    {
      key: 'Mode',
      header: '回覆模式',
      render: (row) => (row.Mode === 'human' ? <Badge tone="warn">人工</Badge> : <Badge tone="ok">Chatbot</Badge>)
    },
    {
      key: 'LastMessageAt',
      header: '最後互動',
      render: (row) => (row.LastMessageAt ? new Date(row.LastMessageAt).toLocaleString('zh-TW') : '—')
    }
  ]

  return (
    <div>
      <Link to="/businesses" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>
        ← 返回店家列表
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 10 }}>
        <PageHeader title={business.Name} subtitle={business.Email} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {business.IsDisabled ? <Badge tone="danger">已停用</Badge> : <Badge tone="ok">正常</Badge>}
          <button onClick={handleToggleDisabled} style={secondaryButtonStyle}>
            {business.IsDisabled ? '重新啟用' : '停用這個店家'}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 30 }}>
        <StatCard label="對話數" value={stats.ConversationCount} />
        <StatCard label="訊息總數" value={stats.MessageCount} />
        <StatCard label="Chatbot 回覆次數" value={stats.ChatbotReplyCount} />
        <StatCard label="員工回覆次數" value={stats.StaffReplyCount} />
        <StatCard label="預約總數" value={stats.AppointmentCount} />
        <StatCard label="Chatbot 建立的預約" value={stats.ChatbotAppointmentCount} />
      </div>

      <h2 style={{ fontSize: 15, margin: '0 0 12px' }}>對話記錄</h2>
      <DataTable
        columns={conversationColumns}
        rows={conversations}
        rowKey="ConversationId"
        emptyText="這個店家還沒有任何對話"
      />
    </div>
  )
}
