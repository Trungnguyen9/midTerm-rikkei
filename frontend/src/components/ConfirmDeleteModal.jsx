import { useState } from 'react';

export default function ConfirmDeleteModal({ item, onClose, onConfirm }) {
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm(item);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop-custom" onClick={!submitting ? onClose : undefined} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-sm">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Xóa thiết bị</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Đóng"
                disabled={submitting}
                onClick={onClose}
              />
            </div>
            <div className="modal-body">
              Bạn có chắc muốn xóa <strong>{item.name}</strong>?
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                disabled={submitting}
                onClick={onClose}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn btn-danger"
                disabled={submitting}
                onClick={handleConfirm}
              >
                {submitting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

