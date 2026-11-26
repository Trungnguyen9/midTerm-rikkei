const { z } = require('zod');
const { isValidCalendarDate, paginationQuerySchema } = require('./common.validator');

/**
 * Tính số tháng giữa hai chuỗi YYYY-MM-DD (kỳ bao gồm cả tháng đầu và cuối).
 */
function monthSpan(fromStr, toStr) {
  const [fy, fm] = fromStr.split('-').map(Number);
  const [ty, tm] = toStr.split('-').map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/**
 * Trả chuỗi YYYY-MM-DD mặc định cho `from`: mùng 1 cách tháng của `to` 11 tháng.
 * Ví dụ: to = 2026-11-26 → from mặc định = 2026-01-01 (12 tháng lịch kể cả tháng hiện tại).
 */
function defaultFrom(toStr) {
  const [y, m] = toStr.split('-').map(Number);
  let newM = m - 11;
  let newY = y;
  if (newM <= 0) {
    newM += 12;
    newY -= 1;
  }
  return `${String(newY).padStart(4, '0')}-${String(newM).padStart(2, '0')}-01`;
}

const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày phải có định dạng YYYY-MM-DD')
  .refine(isValidCalendarDate, 'Ngày không hợp lệ');

const reportQuerySchema = z
  .object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
  })
  .transform((val) => {
    // Mặc định: to = hôm nay sẽ được xử lý trong service (CURDATE())
    // Ở đây chỉ giữ nguyên hoặc bỏ trống
    return val;
  });

const topEquipmentsQuerySchema = z
  .object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
    limit: z
      .string()
      .optional()
      .transform((v) => (v === undefined || v === '' ? '10' : v))
      .pipe(z.string().regex(/^[1-9]\d*$/, 'Giới hạn phải là số nguyên dương'))
      .transform(Number)
      .pipe(z.number().int().min(1, 'Giới hạn tối thiểu là 1').max(50, 'Giới hạn tối đa là 50')),
  });

const idleEquipmentsQuerySchema = z
  .object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
    ...paginationQuerySchema,
  });

const monthlyTrendQuerySchema = z
  .object({
    from: dateStringSchema.optional(),
    to: dateStringSchema.optional(),
  });

module.exports = {
  reportQuerySchema,
  topEquipmentsQuerySchema,
  idleEquipmentsQuerySchema,
  monthlyTrendQuerySchema,
  defaultFrom,
  monthSpan,
};

