import {
  BORROWING_STATUS_MAP,
  formatBorrowCode,
  formatDateDDMMYYYY,
} from '../utils/formatters';

export default function BorrowTable({
  items,
  loading,
  error,
  returningId,
  onRetry,
  onReturn,
}) {
  if (loading) {
    return (
      <div className="card">
        <div className="card-body text-center py-4">
          <div className="spinner-border text-primary" role="status" />
          <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div className="alert alert-danger d-flex justify-content-between align-items-center mb-0" role="alert">
            <span>{error}</span>
            <button type="button" className="btn btn-sm btn-outline-danger ms-3" onClick={onRetry}>
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center text-muted py-4">
          Chưa có phiếu mượn nào.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="table-light">
            <tr>
              <th>Mã phiếu</th>
              <th>Thiết bị</th>
              <th>Người mượn</th>
              <th className="text-end">SL</th>
              <th>Ngày mượn</th>
              <th>Hạn trả</th>
              <th>Ngày trả</th>
              <th>Trạng thái</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const statusInfo = BORROWING_STATUS_MAP[item.status] || {
                label: item.status,
                badgeClass: 'text-bg-secondary',
              };
              const isReturning = returningId === item.id;

              return (
                <tr key={item.id}>
                  <td className="text-nowrap">{formatBorrowCode(item.id)}</td>
                  <td>{item.equipmentName}</td>
                  <td>{item.borrowerName}</td>
                  <td className="text-end">{item.quantity}</td>
                  <td>{formatDateDDMMYYYY(item.borrowedAt)}</td>
                  <td>{formatDateDDMMYYYY(item.dueDate)}</td>
                  <td>{formatDateDDMMYYYY(item.returnedAt)}</td>
                  <td>
                    <span className={`badge ${statusInfo.badgeClass}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="text-end">
                    {item.status !== 'returned' && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        disabled={isReturning}
                        onClick={() => onReturn(item)}
                      >
                        {isReturning ? 'Đang xử lý...' : 'Trả'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

