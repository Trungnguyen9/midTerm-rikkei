import { useEffect, useState } from 'react';
import { CATEGORY_OPTIONS } from '../utils/formatters';

export default function EquipmentFormModal({
  isOpen,
  editingItem,
  onClose,
  onSubmit,
}) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('laptop');
  const [totalQuantity, setTotalQuantity] = useState('1');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setCode(editingItem.code);
        setName(editingItem.name);
        setCategory(editingItem.category);
        setTotalQuantity(String(editingItem.totalQuantity));
      } else {
        setCode('');
        setName('');
        setCategory('laptop');
        setTotalQuantity('1');
      }
      setErrorMsg('');
      setSubmitting(false);
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();
    const parsedQty = Number(totalQuantity);

    if (!/^[A-Z0-9-]{1,20}$/.test(trimmedCode)) {
      setErrorMsg('Mã thiết bị chỉ gồm chữ cái in hoa, số, dấu gạch ngang và tối đa 20 ký tự.');
      return;
    }
    if (!trimmedName) {
      setErrorMsg('Vui lòng nhập tên thiết bị.');
      return;
    }
    if (!Number.isInteger(parsedQty) || parsedQty < 0) {
      setErrorMsg('Tổng số lượng phải là số nguyên lớn hơn hoặc bằng 0.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    try {
      await onSubmit({
        code: trimmedCode,
        name: trimmedName,
        category,
        totalQuantity: parsedQty,
      });
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Không thể lưu thiết bị. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-backdrop-custom" onClick={!submitting ? onClose : undefined} />
      <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">
                {editingItem ? 'Cập nhật thiết bị' : 'Thêm thiết bị'}
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Đóng"
                disabled={submitting}
                onClick={onClose}
              />
            </div>
            <div className="modal-body">
              {errorMsg && (
                <div className="alert alert-danger py-2" role="alert">
                  {errorMsg}
                </div>
              )}
              <div className="mb-3">
                <label className="form-label" htmlFor="eqCode">
                  Mã thiết bị
                </label>
                <input
                  id="eqCode"
                  className="form-control"
                  placeholder="LAB-013"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="eqName">
                  Tên thiết bị
                </label>
                <input
                  id="eqName"
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="row">
                <div className="col-md-7 mb-3">
                  <label className="form-label" htmlFor="eqCat">
                    Loại
                  </label>
                  <select
                    id="eqCat"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={submitting}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-5 mb-3">
                  <label className="form-label" htmlFor="eqTotal">
                    Tổng số lượng
                  </label>
                  <input
                    id="eqTotal"
                    type="number"
                    min="0"
                    className="form-control"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
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
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? 'Đang lưu...' : 'Lưu'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

