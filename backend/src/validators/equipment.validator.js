const { z } = require('zod');
const { paginationQuerySchema } = require('./common.validator');

const EQUIPMENT_CATEGORIES = ['laptop', 'man_hinh', 'mach_dien_tu', 'phu_kien'];

const equipmentQuerySchema = z.object({
  search: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? '' : v.trim())),
  category: z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === '' ? undefined : v.trim()))
    .pipe(
      z
        .enum(EQUIPMENT_CATEGORIES, {
          errorMap: () => ({ message: 'Loại thiết bị không hợp lệ' }),
        })
        .optional()
    ),
  ...paginationQuerySchema,
});

const equipmentBodySchema = z
  .object({
    code: z
      .string({
        required_error: 'Mã thiết bị là bắt buộc',
        invalid_type_error: 'Mã thiết bị phải là chuỗi',
      })
      .transform((v) => v.trim().toUpperCase())
      .pipe(
        z
          .string()
          .regex(
            /^[A-Z0-9-]{1,20}$/,
            'Mã thiết bị chỉ gồm chữ cái in hoa, số, dấu gạch ngang và tối đa 20 ký tự'
          )
      ),
    name: z
      .string({
        required_error: 'Tên thiết bị là bắt buộc',
        invalid_type_error: 'Tên thiết bị phải là chuỗi',
      })
      .trim()
      .min(1, 'Tên thiết bị không được để trống')
      .max(150, 'Tên thiết bị tối đa 150 ký tự'),
    category: z.enum(EQUIPMENT_CATEGORIES, {
      errorMap: () => ({ message: 'Loại thiết bị không hợp lệ' }),
    }),
    totalQuantity: z
      .number({
        required_error: 'Tổng số lượng là bắt buộc',
        invalid_type_error: 'Tổng số lượng phải là số nguyên',
      })
      .int('Tổng số lượng phải là số nguyên')
      .min(0, 'Tổng số lượng không được âm'),
  })
  .strict('Dữ liệu chứa trường không hợp lệ');

module.exports = {
  EQUIPMENT_CATEGORIES,
  equipmentQuerySchema,
  equipmentBodySchema,
};
