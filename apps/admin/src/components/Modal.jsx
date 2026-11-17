import { primaryButtonStyle, secondaryButtonStyle } from './ui.jsx'

export function Modal({ title, onClose, children, footer }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(2,6,23,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: 20
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--ink-800)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 16 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1 }}
          >
            ✕
          </button>
        </div>
        {children}
        {footer && <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>{footer}</div>}
      </div>
    </div>
  )
}

/**
 * 客製化的確認對話框，取代瀏覽器原生的 window.confirm。
 */
export function ConfirmModal({
  title = '確認操作',
  message,
  confirmLabel = '確定',
  cancelLabel = '取消',
  danger = false,
  loading = false,
  onConfirm,
  onCancel
}) {
  const confirmStyle = danger
    ? { ...primaryButtonStyle, background: 'var(--danger)' }
    : primaryButtonStyle

  return (
    <Modal
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button onClick={onCancel} disabled={loading} style={secondaryButtonStyle}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} disabled={loading} style={confirmStyle}>
            {loading ? '處理中…' : confirmLabel}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        {message}
      </p>
    </Modal>
  )
}
