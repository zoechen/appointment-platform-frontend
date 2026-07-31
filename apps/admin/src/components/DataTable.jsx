export function DataTable({ columns, rows, rowKey, onRowClick, emptyText = '沒有資料' }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 10 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  textAlign: 'left',
                  padding: '10px 14px',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--ink-800)'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                style={{ padding: '28px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}
              >
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={row[rowKey]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                borderBottom: '1px solid var(--border)'
              }}
              onMouseEnter={(e) => {
                if (onRowClick) e.currentTarget.style.background = 'var(--ink-800)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '11px 14px', fontSize: 13.5 }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
