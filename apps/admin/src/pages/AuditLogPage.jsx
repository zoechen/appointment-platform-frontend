import { useEffect, useState } from 'react'
import { request } from '../api.js'
import { DataTable } from '../components/DataTable.jsx'
import { Badge } from '../components/Badge.jsx'
import { PageHeader, Pagination } from '../components/ui.jsx'

const PAGE_LIMIT = 20

const ACTION_LABELS = {
  'staff.disable': { text: '停用員工', tone: 'danger' },
  'staff.enable': { text: '啟用員工', tone: 'ok' },
  'staff.update': { text: '編輯員工', tone: 'accent' },
  'business.disable': { text: '停用店家', tone: 'danger' },
  'business.enable': { text: '啟用店家', tone: 'ok' }
}

export default function AuditLogPage() {
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(targetPage = 1) {
    setLoading(true)
    setError('')
    try {
      const data = await request('/admin/audit-logs', {
        query: { page: targetPage, limit: PAGE_LIMIT }
      })
      setLogs(data.auditLogs || [])
      setTotal(data.total || 0)
      setPage(targetPage)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [])

  const columns = [
    {
      key: 'CreatedAt',
      header: '操作時間',
      render: (row) => (row.CreatedAt ? new Date(row.CreatedAt).toLocaleString('zh-TW') : '—')
    },
    {
      key: 'Admin',
      header: '管理員',
      render: (row) => row.AdminDisplayName || row.AdminEmail || row.AdminId
    },
    {
      key: 'Action',
      header: '動作',
      render: (row) => {
        const meta = ACTION_LABELS[row.Action] || { text: row.Action, tone: 'accent' }
        return <Badge tone={meta.tone}>{meta.text}</Badge>
      }
    },
    {
      key: 'Target',
      header: '目標類型 / ID',
      render: (row) => `${row.TargetType} (${row.TargetId || '—'})`
    },
    {
      key: 'Details',
      header: '變更內容',
      render: (row) => (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
          {row.Details || '—'}
        </span>
      )
    }
  ]

  return (
    <div>
      <PageHeader title="操作稽核紀錄" subtitle="超級管理員對店家與使用者的變更軌跡" />

      {error && <p style={{ color: 'var(--danger)' }}>{error}</p>}

      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>載入中…</p>
      ) : (
        <>
          <DataTable
            columns={columns}
            rows={logs}
            rowKey="AuditLogId"
            emptyText="目前尚無操作稽核紀錄"
          />
          <Pagination
            page={page}
            limit={PAGE_LIMIT}
            total={total}
            onPageChange={(nextPage) => load(nextPage)}
          />
        </>
      )}
    </div>
  )
}
