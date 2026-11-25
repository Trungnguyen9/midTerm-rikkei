const { z } = require('zod');
const { isValidCalendarDate, paginationQuerySchema } = require('./common.validator');

const BORROWING_STATUSES = ['borrowing', 'returned', 'overdue'];

const borrowingQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()))
    .pipe(
      z
        .enum(BORROWING_STATUSES, {
          errorMap: () => ({ message: 'Trạng thái phiếu mượn không hợp lệ' }),
        })
        .optional()
    ),
  ...paginationQuerySchema,
});

const createBorrowingBodySchema = z
  .object({
    equipmentId: z
      .number({
        required_error: 'Thiết bị là bắt buộc',
        invalid_type_error: 'ID thiết bị phải là số nguyên dương',
      })
      .int('ID thiết bị phải là số nguyên dương')
      .positive('ID thiết bị phải là số nguyên dương'),
    borrowerName: z
      .string({
        required_error: 'Tên người mượn là bắt buộc',
        invalid_type_error: 'Tên người mượn phải là chuỗi',
      })
      .trim()
      .min(1, 'Tên người mượn không được để trống')
      .max(120, 'Tên người mượn tối đa 120 ký tự'),
    quantity: z
      .number({
        required_error: 'Số lượng là bắt buộc',
        invalid_type_error: 'Số lượng phải là số nguyên dương',
      })
      .int('Số lượng phải là số nguyên dương')
      .positive('Số lượng mượn phải lớn hơn 0'),
    dueDate: z
      .string({
        required_error: 'Hạn trả là bắt buộc',
        invalid_type_error: 'Hạn trả phải là chuỗi YYYY-MM-DD',
      })
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Hạn trả phải có định dạng YYYY-MM-DD')
      .refine(isValidCalendarDate, 'Hạn trả không phải ngày hợp lệ'),
    note: z
      .string({ invalid_type_error: 'Ghi chú phải là chuỗi' })
      .trim()
      .max(255, 'Ghi chú tối đa 255 ký tự')
      .nullable()
      .optional()
      .transform((v) => (v === undefined || v === '' ? null : v)),
  })
  .strict('Dữ liệu chứa trường không hợp lệ');

module.exports = {
  BORROWING_STATUSES,
  borrowingQuerySchema,
  createBorrowingBodySchema,
};

