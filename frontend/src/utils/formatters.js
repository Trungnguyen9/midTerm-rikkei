export const CATEGORY_OPTIONS = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'man_hinh', label: 'Màn hình' },
  { value: 'mach_dien_tu', label: 'Bo mạch điện tử' },
  { value: 'phu_kien', label: 'Phụ kiện' },
];

export const CATEGORY_LABELS = Object.fromEntries(
  CATEGORY_OPTIONS.map((item) => [item.value, item.label])
);

export const BORROWING_STATUS_MAP = {
  borrowing: { label: 'Đang mượn', badgeClass: 'text-bg-primary' },
  returned: { label: 'Đã trả', badgeClass: 'text-bg-success' },
  overdue: { label: 'Quá hạn', badgeClass: 'text-bg-danger' },
};

/**
 * Format "YYYY-MM-DD" to "dd/mm/yyyy" by string splitting (no new Date).
 * @param {string | null | undefined} dateStr
 * @returns {string}
 */
export function formatDateDDMMYYYY(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

/**
 * Format borrowing id as PM-001, PM-002, ...
 * @param {number} id
 * @returns {string}
 */
export function formatBorrowCode(id) {
  return `PM-${String(id).padStart(3, '0')}`;
}

