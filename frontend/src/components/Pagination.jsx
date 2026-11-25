export default function Pagination({ page, totalPages, total, itemLabel = 'mục', onPageChange }) {
  if (total === 0) return null;

  const safeTotalPages = Math.max(totalPages, 1);
  const pages = [];
  for (let i = 1; i <= safeTotalPages; i += 1) {
    pages.push(i);
  }

  return (
    <div className="d-flex justify-content-between align-items-center mt-3">
      <span className="text-muted small">
        Trang {page}/{safeTotalPages} · {total} {itemLabel}
      </span>
      <nav aria-label="Phân trang">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page <= 1 ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Trước
            </button>
          </li>
          {pages.map((p) => (
            <li key={p} className={`page-item ${p === page ? 'active' : ''}`}>
              <button
                type="button"
                className="page-link"
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            </li>
          ))}
          <li className={`page-item ${page >= safeTotalPages ? 'disabled' : ''}`}>
            <button
              type="button"
              className="page-link"
              disabled={page >= safeTotalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Sau
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

