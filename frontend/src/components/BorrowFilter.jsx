const FILTER_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'borrowing', label: 'Đang mượn' },
  { value: 'overdue', label: 'Quá hạn' },
  { value: 'returned', label: 'Đã trả' },
];

export default function BorrowFilter({ status, onChange }) {
  return (
    <div className="btn-group mb-3" role="group" aria-label="Lọc theo trạng thái">
      {FILTER_OPTIONS.map((opt) => {
        const isActive = status === opt.value;
        return (
          <button
            key={opt.value || 'all'}
            type="button"
            className={`btn btn-outline-secondary ${isActive ? 'active' : ''}`}
            aria-pressed={isActive}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

