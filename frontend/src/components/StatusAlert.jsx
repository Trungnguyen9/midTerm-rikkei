export default function StatusAlert({ type = 'success', message, onClose, onRetry }) {
  if (!message) return null;

  const alertClass = type === 'danger' ? 'alert-danger' : 'alert-success';
  const role = type === 'danger' ? 'alert' : 'status';

  return (
    <div className={`alert ${alertClass} d-flex justify-content-between align-items-center mb-3`} role={role}>
      <span>{message}</span>
      <div className="d-flex align-items-center gap-2 ms-3">
        {onRetry && (
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={onRetry}>
            Thử lại
          </button>
        )}
        {onClose && (
          <button
            type="button"
            className="btn-close"
            aria-label="Đóng"
            onClick={onClose}
          />
        )}
      </div>
    </div>
  );
}

