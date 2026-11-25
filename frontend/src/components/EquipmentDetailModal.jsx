import { useEffect, useState } from 'react';
import { equipmentApi } from '../api/equipmentApi';
import { CATEGORY_LABELS } from '../utils/formatters';

export default function EquipmentDetailModal({ equipmentId, onClose }) {
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!equipmentId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setItem(null);

    equipmentApi
      .getById(equipmentId)
      .then((res) => {
        if (!cancelled) setItem(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || 'Không tải được chi tiết thiết bị.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [equipmentId]);

  if (!equipmentId) return null;

  return (
    <>
      <div className="modal-backdrop-custom" onClick={onClose} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Chi tiết thiết bị</h5>
              <button type="button" className="btn-close" aria-label="Đóng" onClick={onClose} />
            </div>
            <div className="modal-body">
              {loading && (
                <div className="text-center py-3">
                  <div className="spinner-border text-primary" role="status" />
                  <div className="mt-2 text-muted">Đang tải dữ liệu...</div>
                </div>
              )}
              {!loading && error && (
                <div className="alert alert-danger mb-0" role="alert">
                  {error}
                </div>
              )}
              {!loading && !error && item && (
                <dl className="row mb-0">
                  <dt className="col-sm-4">Mã thiết bị</dt>
                  <dd className="col-sm-8">{item.code}</dd>

                  <dt className="col-sm-4">Tên thiết bị</dt>
                  <dd className="col-sm-8">{item.name}</dd>

                  <dt className="col-sm-4">Loại</dt>
                  <dd className="col-sm-8">{CATEGORY_LABELS[item.category] || item.category}</dd>

                  <dt className="col-sm-4">Tổng số lượng</dt>
                  <dd className="col-sm-8">{item.totalQuantity}</dd>

                  <dt className="col-sm-4">Còn lại</dt>
                  <dd className="col-sm-8">
                    <span
                      className={`badge ${
                        item.availableQuantity > 0 ? 'text-bg-success' : 'text-bg-danger'
                      }`}
                    >
                      {item.availableQuantity}
                    </span>
                  </dd>

                  <dt className="col-sm-4">Ngày tạo</dt>
                  <dd className="col-sm-8 mb-0">{item.createdAt || '—'}</dd>
                </dl>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

