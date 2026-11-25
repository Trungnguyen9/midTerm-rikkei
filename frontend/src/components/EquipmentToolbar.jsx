import { CATEGORY_OPTIONS } from '../utils/formatters';

export default function EquipmentToolbar({
  search,
  category,
  onSearchChange,
  onCategoryChange,
  onAddClick,
}) {
  return (
    <div className="row g-2 mb-3">
      <div className="col-md-5">
        <input
          type="search"
          className="form-control"
          placeholder="Tìm theo tên hoặc mã"
          aria-label="Tìm thiết bị"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <div className="col-md-4">
        <select
          className="form-select"
          aria-label="Lọc theo loại"
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <option value="">Tất cả loại</option>
          {CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <div className="col-md-3 text-md-end">
        <button type="button" className="btn btn-primary" onClick={onAddClick}>
          Thêm thiết bị
        </button>
      </div>
    </div>
  );
}

