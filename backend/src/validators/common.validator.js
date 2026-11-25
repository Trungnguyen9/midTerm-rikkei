const { z } = require('zod');

/**
 * Validate YYYY-MM-DD as a real calendar date (e.g., rejects 2026-02-31).
 * @param {string} dateStr
 * @returns {boolean}
 */
function isValidCalendarDate(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^[1-9]\d*$/, 'ID phải là số nguyên dương')
    .transform(Number),
});

const paginationQuerySchema = {
  page: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? '1' : v))
    .pipe(z.string().regex(/^[1-9]\d*$/, 'Trang phải là số nguyên dương'))
    .transform(Number),
  limit: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? '10' : v))
    .pipe(z.string().regex(/^[1-9]\d*$/, 'Giới hạn phải là số nguyên dương'))
    .transform(Number)
    .pipe(z.number().int().min(1, 'Giới hạn tối thiểu là 1').max(100, 'Giới hạn tối đa là 100')),
};

module.exports = {
  isValidCalendarDate,
  idParamSchema,
  paginationQuerySchema,
};

