import { useState } from 'react';

function getLocalDateOffset(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function BorrowForm({ equipments, onSubmit }) {
  const minDueDate = getLocalDateOffset(0);
  const maxDueDate = getLocalDateOffset(14);
  const [equipmentId, setEquipmentId] = useState('');
  const [borrowerName, setBorrowerName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const parsedEqId = Number(equipmentId);
    const parsedQty = Number(quantity);
    const trimmedName = borrowerName.trim();

    if (!Number.isInteger(parsedEqId) || parsedEqId <= 0) {
      setFormError('Vui lòng chọn thiết bị.');
      return;
    }
    if (!trimmedName) {
      setFormError('Vui lòng nhập tên người mượn.');
      return;
    }
    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
      setFormError('Số lượng mượn phải là số nguyên lớn hơn 0.');
      return;
    }
    if (!dueDate) {
      setFormError('Vui lòng chọn hạn trả.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        equipmentId: parsedEqId,
        borrowerName: trimmedName,
        quantity: parsedQty,
        dueDate,
        note: note.trim() || undefined,
      });
      setEquipmentId('');
      setBorrowerName('');
      setQuantity('1');
      setDueDate('');
      setNote('');
    } catch (err) {
      setFormError(err.message || 'Không thể tạo phiếu mượn. Vui lòng kiểm tra lại thông tin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header">Tạo phiếu mượn</div>
      <form className="card-body row g-3" onSubmit={handleSubmit}>
        {formError && (
          <div className="col-12">
            <div className="alert alert-danger mb-0 py-2" role="alert">
              {formError}
            </div>
          </div>
        )}
        <div className="col-md-4">
          <label className="form-label" htmlFor="bEq">
            Thiết bị
          </label>
          <select
            id="bEq"
            className="form-select"
            value={equipmentId}
            onChange={(e) => setEquipmentId(e.target.value)}
            disabled={submitting}
          >
            <option value="">Chọn thiết bị...</option>
            {equipments.map((eq) => (
              <option key={eq.id} value={eq.id} disabled={eq.availableQuantity <= 0}>
                {eq.name} (còn {eq.availableQuantity})
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="bName">
            Người mượn
          </label>
          <input
            id="bName"
            className="form-control"
            placeholder="Họ và tên"
            value={borrowerName}
            onChange={(e) => setBorrowerName(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="col-md-2">
          <label className="form-label" htmlFor="bQty">
            Số lượng
          </label>
          <input
            id="bQty"
            type="number"
            min="1"
            className="form-control"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor="bDue">
            Hạn trả
          </label>
          <input
            id="bDue"
            type="date"
            className="form-control"
            min={minDueDate}
            max={maxDueDate}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="col-md-9">
          <label className="form-label" htmlFor="bNote">
            Ghi chú
          </label>
          <input
            id="bNote"
            className="form-control"
            placeholder="Không bắt buộc"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="col-md-3 d-flex align-items-end">
          <button type="submit" className="btn btn-primary w-100" disabled={submitting}>
            {submitting ? 'Đang tạo...' : 'Tạo phiếu mượn'}
          </button>
        </div>
      </form>
    </div>
  );
}

