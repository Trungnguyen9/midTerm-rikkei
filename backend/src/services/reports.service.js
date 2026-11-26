const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { defaultFrom, monthSpan } = require('../validators/reports.validator');

// ─── helpers ───────────────────────────────────────────────────────────────────

/**
 * Giải quyết kỳ [from, to]. "Hôm nay" lấy từ CURDATE() của MySQL.
 * Trả { from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' } đã validate.
 */
async function resolveRange(rawFrom, rawTo) {
  // Lấy CURDATE() từ MySQL
  const [[{ today }]] = await pool.query("SELECT CURDATE() AS today");

  const to = rawTo || today;
  const from = rawFrom || defaultFrom(to);

  if (from > to) {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
  }

  if (monthSpan(from, to) > 60) {
    throw new AppError(400, 'INVALID_DATE_RANGE', 'Khoảng thời gian tối đa là 60 tháng');
  }

  return { from, to };
}

/**
 * Sinh mảng tháng "YYYY-MM" từ tháng chứa `from` đến tháng chứa `to`, tăng dần.
 * Dùng phép cộng chuỗi, không dùng new Date().
 */
function generateMonths(from, to) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  const endKey = ty * 12 + tm;
  const months = [];
  let y = fy;
  let m = fm;
  while (y * 12 + m <= endKey) {
    months.push(`${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}

// ─── Subquery tính availableQuantity (giống Phần 1) ────────────────────────────

const AVAILABLE_QTY_SUBQUERY = `
  (e.total_quantity - COALESCE(
    (SELECT SUM(b2.quantity) FROM borrowings b2
     WHERE b2.equipment_id = e.id AND b2.returned_at IS NULL), 0
  ))
`;

// ─── Điều kiện idle: không có phiếu nào trong kỳ ──────────────────────────────

const IDLE_CONDITION = `
  e.total_quantity > 0
  AND NOT EXISTS (
    SELECT 1 FROM borrowings bi
    WHERE bi.equipment_id = e.id
      AND bi.borrowed_at BETWEEN ? AND ?
  )
`;

// ─── 1. Summary ────────────────────────────────────────────────────────────────

async function getSummary({ from, to }) {
  const range = await resolveRange(from, to);

  // totalBorrowings, totalBorrowedQuantity
  const [[aggRow]] = await pool.query(
    `SELECT
       COALESCE(COUNT(*), 0)        AS totalBorrowings,
       COALESCE(SUM(b.quantity), 0) AS totalBorrowedQuantity
     FROM borrowings b
     WHERE b.borrowed_at BETWEEN ? AND ?`,
    [range.from, range.to]
  );

  // idleEquipmentCount
  const [[idleRow]] = await pool.query(
    `SELECT COUNT(*) AS idleEquipmentCount
     FROM equipments e
     WHERE ${IDLE_CONDITION}`,
    [range.from, range.to]
  );

  return {
    data: {
      totalBorrowings: Number(aggRow.totalBorrowings),
      totalBorrowedQuantity: Number(aggRow.totalBorrowedQuantity),
      idleEquipmentCount: Number(idleRow.idleEquipmentCount),
    },
    range,
  };
}

// ─── 2. Top Equipments ─────────────────────────────────────────────────────────

async function getTopEquipments({ from, to, limit = 10 }) {
  const range = await resolveRange(from, to);

  const [rows] = await pool.query(
    `SELECT
       e.id                                  AS equipmentId,
       e.code,
       e.name,
       e.category,
       COALESCE(SUM(b.quantity), 0)          AS totalBorrowedQuantity,
       COUNT(b.id)                           AS borrowingCount,
       ${AVAILABLE_QTY_SUBQUERY}             AS availableQuantity
     FROM borrowings b
     INNER JOIN equipments e ON e.id = b.equipment_id
     WHERE b.borrowed_at BETWEEN ? AND ?
     GROUP BY e.id, e.code, e.name, e.category, e.total_quantity
     HAVING COUNT(b.id) >= 1
     ORDER BY totalBorrowedQuantity DESC, borrowingCount DESC, e.id ASC
     LIMIT ?`,
    [range.from, range.to, limit]
  );

  const data = rows.map((row, idx) => ({
    rank: idx + 1,
    equipmentId: Number(row.equipmentId),
    code: row.code,
    name: row.name,
    category: row.category,
    totalBorrowedQuantity: Number(row.totalBorrowedQuantity),
    borrowingCount: Number(row.borrowingCount),
    availableQuantity: Number(row.availableQuantity),
  }));

  return { data, range };
}

// ─── 3. Idle Equipments ─────────────────────────────────────────────────────────

async function getIdleEquipments({ from, to, page = 1, limit = 10 }) {
  const range = await resolveRange(from, to);

  // Count
  const [[{ total }]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM equipments e
     WHERE ${IDLE_CONDITION}`,
    [range.from, range.to]
  );

  const totalNum = Number(total);
  const totalPages = totalNum === 0 ? 0 : Math.ceil(totalNum / limit);
  const offset = (page - 1) * limit;

  // Data
  const [rows] = await pool.query(
    `SELECT
       e.id                              AS equipmentId,
       e.code,
       e.name,
       e.category,
       e.total_quantity                  AS totalQuantity,
       ${AVAILABLE_QTY_SUBQUERY}         AS availableQuantity,
       (SELECT MAX(b3.borrowed_at) FROM borrowings b3 WHERE b3.equipment_id = e.id) AS lastBorrowedAt
     FROM equipments e
     WHERE ${IDLE_CONDITION}
     ORDER BY lastBorrowedAt IS NOT NULL ASC, lastBorrowedAt ASC, e.id ASC
     LIMIT ? OFFSET ?`,
    [range.from, range.to, limit, offset]
  );

  const data = rows.map((row) => ({
    equipmentId: Number(row.equipmentId),
    code: row.code,
    name: row.name,
    category: row.category,
    totalQuantity: Number(row.totalQuantity),
    availableQuantity: Number(row.availableQuantity),
    lastBorrowedAt: row.lastBorrowedAt || null,
  }));

  return {
    data,
    pagination: { page, limit, total: totalNum, totalPages },
    range,
  };
}

// ─── 4. Monthly Trend ──────────────────────────────────────────────────────────

async function getMonthlyTrend({ from, to }) {
  const range = await resolveRange(from, to);

  const [rows] = await pool.query(
    `SELECT
       DATE_FORMAT(b.borrowed_at, '%Y-%m') AS month,
       COUNT(*)                            AS borrowingCount,
       COALESCE(SUM(b.quantity), 0)        AS totalQuantity
     FROM borrowings b
     WHERE b.borrowed_at BETWEEN ? AND ?
     GROUP BY month
     ORDER BY month ASC`,
    [range.from, range.to]
  );

  // Map kết quả DB vào object để tra nhanh
  const dbMap = {};
  for (const row of rows) {
    dbMap[row.month] = {
      borrowingCount: Number(row.borrowingCount),
      totalQuantity: Number(row.totalQuantity),
    };
  }

  // Đệm đủ mọi tháng
  const allMonths = generateMonths(range.from, range.to);
  const data = allMonths.map((m) => ({
    month: m,
    borrowingCount: dbMap[m] ? dbMap[m].borrowingCount : 0,
    totalQuantity: dbMap[m] ? dbMap[m].totalQuantity : 0,
  }));

  return { data, range };
}

module.exports = {
  getSummary,
  getTopEquipments,
  getIdleEquipments,
  getMonthlyTrend,
};

