const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../utils/sqlHelpers');

const STATUS_CASE_SQL = `
  CASE
    WHEN b.returned_at IS NOT NULL THEN 'returned'
    WHEN b.returned_at IS NULL AND b.due_date < CURDATE() THEN 'overdue'
    ELSE 'borrowing'
  END
`;

const BORROWING_SELECT = `
  SELECT
    b.id,
    b.equipment_id AS equipmentId,
    e.code AS equipmentCode,
    e.name AS equipmentName,
    b.borrower_name AS borrowerName,
    b.quantity,
    b.borrowed_at AS borrowedAt,
    b.due_date AS dueDate,
    b.returned_at AS returnedAt,
    b.note,
    (${STATUS_CASE_SQL}) AS status
  FROM borrowings b
  INNER JOIN equipments e ON e.id = b.equipment_id
`;

function mapBorrowingRow(row) {
  return {
    id: Number(row.id),
    equipmentId: Number(row.equipmentId),
    equipmentCode: row.equipmentCode,
    equipmentName: row.equipmentName,
    borrowerName: row.borrowerName,
    quantity: Number(row.quantity),
    borrowedAt: row.borrowedAt,
    dueDate: row.dueDate,
    returnedAt: row.returnedAt,
    note: row.note,
    status: row.status,
  };
}

const STATUS_WHERE_MAP = {
  returned: 'b.returned_at IS NOT NULL',
  overdue: 'b.returned_at IS NULL AND b.due_date < CURDATE()',
  borrowing: 'b.returned_at IS NULL AND b.due_date >= CURDATE()',
};

async function listBorrowings({ status, page = 1, limit = 10 }) {
  const whereClause = status && STATUS_WHERE_MAP[status] ? `WHERE ${STATUS_WHERE_MAP[status]}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM borrowings b ${whereClause}`
  );
  const total = Number(countRows[0].total);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${BORROWING_SELECT}
     ${whereClause}
     ORDER BY b.borrowed_at DESC, b.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  return {
    data: rows.map(mapBorrowingRow),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

async function getBorrowingById(id, conn = pool) {
  const [rows] = await conn.query(`${BORROWING_SELECT} WHERE b.id = ?`, [id]);
  if (rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy phiếu mượn');
  }
  return mapBorrowingRow(rows[0]);
}

async function createBorrowing({ equipmentId, borrowerName, quantity, dueDate, note }) {
  return withTransaction(async (conn) => {
    const [eqRows] = await conn.query(
      'SELECT id, total_quantity FROM equipments WHERE id = ? FOR UPDATE',
      [equipmentId]
    );
    if (eqRows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy thiết bị');
    }

    const [borrowingRows] = await conn.query(
      'SELECT COALESCE(SUM(quantity), 0) AS borrowingSum FROM borrowings WHERE equipment_id = ? AND returned_at IS NULL',
      [equipmentId]
    );
    const availableQuantity = Number(eqRows[0].total_quantity) - Number(borrowingRows[0].borrowingSum);

    if (quantity > availableQuantity) {
      throw new AppError(
        409,
        'INSUFFICIENT_QUANTITY',
        `Số lượng thiết bị còn lại không đủ (còn ${availableQuantity})`
      );
    }

    const [dateRows] = await conn.query(
      'SELECT CURDATE() AS today, DATE_ADD(CURDATE(), INTERVAL 14 DAY) AS maxDueDate'
    );
    const { today, maxDueDate } = dateRows[0];

    if (dueDate < today || dueDate > maxDueDate) {
      throw new AppError(
        400,
        'INVALID_DUE_DATE',
        'Hạn trả phải từ hôm nay đến tối đa 14 ngày sau ngày mượn'
      );
    }

    const [result] = await conn.query(
      'INSERT INTO borrowings (equipment_id, borrower_name, quantity, borrowed_at, due_date, note) VALUES (?, ?, ?, CURDATE(), ?, ?)',
      [equipmentId, borrowerName, quantity, dueDate, note]
    );

    return await getBorrowingById(result.insertId, conn);
  });
}

async function returnBorrowing(id) {
  const [result] = await pool.query(
    'UPDATE borrowings SET returned_at = CURDATE() WHERE id = ? AND returned_at IS NULL',
    [id]
  );

  if (result.affectedRows === 0) {
    const [rows] = await pool.query('SELECT id, returned_at FROM borrowings WHERE id = ?', [id]);
    if (rows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy phiếu mượn');
    }
    throw new AppError(409, 'ALREADY_RETURNED', 'Phiếu mượn này đã được trả trước đó');
  }

  return await getBorrowingById(id);
}

module.exports = {
  listBorrowings,
  getBorrowingById,
  createBorrowing,
  returnBorrowing,
};

