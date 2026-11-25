import { CATEGORY_LABELS } from '../utils/formatters';

export default function EquipmentTable({
  items,
  loading,
  error,
  onRetry,
  onViewDetail,
  onEdit,
  onDelete,
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
          Không tìm thấy thiết bị nào.
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
              <th>Mã</th>
              <th>Tên thiết bị</th>
              <th>Loại</th>
              <th className="text-end">Tổng</th>
              <th className="text-end">Còn lại</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td className="text-nowrap">{item.code}</td>
                <td>{item.name}</td>
                <td>{CATEGORY_LABELS[item.category] || item.category}</td>
                <td className="text-end">{item.totalQuantity}</td>
                <td className="text-end">
                  <span
                    className={`badge ${
                      item.availableQuantity > 0 ? 'text-bg-success' : 'text-bg-danger'
                    }`}
                  >
                    {item.availableQuantity}
                  </span>
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary me-1"
                    onClick={() => onViewDetail(item)}
                  >
                    Chi tiết
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary me-1"
                    onClick={() => onEdit(item)}
                  >
                    Sửa
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onDelete(item)}
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

