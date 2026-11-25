const pool = require('../config/db');
const AppError = require('../utils/AppError');
const { escapeLike, withTransaction } = require('../utils/sqlHelpers');

function mapEquipmentRow(row) {
  return {
    id: Number(row.id),
    code: row.code,
    name: row.name,
    category: row.category,
    totalQuantity: Number(row.totalQuantity),
    availableQuantity: Number(row.availableQuantity),
    createdAt: row.createdAt,
  };
}

const EQUIPMENT_SELECT = `
  SELECT
    e.id,
    e.code,
    e.name,
    e.category,
    e.total_quantity AS totalQuantity,
    (e.total_quantity - COALESCE(SUM(CASE WHEN b.returned_at IS NULL THEN b.quantity ELSE 0 END), 0)) AS availableQuantity,
    e.created_at AS createdAt
  FROM equipments e
  LEFT JOIN borrowings b ON b.equipment_id = e.id
`;

async function listEquipments({ search = '', category, page = 1, limit = 10 }) {
  const conditions = [];
  const params = [];

  if (search) {
    const pattern = `%${escapeLike(search)}%`;
    conditions.push("(e.name LIKE ? ESCAPE '\\\\' OR e.code LIKE ? ESCAPE '\\\\')");
    params.push(pattern, pattern);
  }

  if (category) {
    conditions.push('e.category = ?');
    params.push(category);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM equipments e ${whereClause}`,
    params
  );
  const total = Number(countRows[0].total);
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const offset = (page - 1) * limit;

  const [rows] = await pool.query(
    `${EQUIPMENT_SELECT}
     ${whereClause}
     GROUP BY e.id, e.code, e.name, e.category, e.total_quantity, e.created_at
     ORDER BY e.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    data: rows.map(mapEquipmentRow),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

async function getEquipmentById(id, conn = pool) {
  const [rows] = await conn.query(
    `${EQUIPMENT_SELECT}
     WHERE e.id = ?
     GROUP BY e.id, e.code, e.name, e.category, e.total_quantity, e.created_at`,
    [id]
  );

  if (rows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy thiết bị');
  }

  return mapEquipmentRow(rows[0]);
}

async function createEquipment({ code, name, category, totalQuantity }) {
  const [existing] = await pool.query('SELECT id FROM equipments WHERE code = ?', [code]);
  if (existing.length > 0) {
    throw new AppError(409, 'DUPLICATE_CODE', 'Mã thiết bị đã tồn tại');
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO equipments (code, name, category, total_quantity) VALUES (?, ?, ?, ?)',
      [code, name, category, totalQuantity]
    );
    return await getEquipmentById(result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      throw new AppError(409, 'DUPLICATE_CODE', 'Mã thiết bị đã tồn tại');
    }
    throw err;
  }
}

async function updateEquipment(id, { code, name, category, totalQuantity }) {
  return withTransaction(async (conn) => {
    const [eqRows] = await conn.query(
      'SELECT id, total_quantity FROM equipments WHERE id = ? FOR UPDATE',
      [id]
    );

    if (eqRows.length === 0) {
      throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy thiết bị');
    }

    const [borrowingRows] = await conn.query(
      'SELECT COALESCE(SUM(quantity), 0) AS borrowingSum FROM borrowings WHERE equipment_id = ? AND returned_at IS NULL',
      [id]
    );
    const borrowingSum = Number(borrowingRows[0].borrowingSum);

    if (totalQuantity < borrowingSum) {
      throw new AppError(
        409,
        'INSUFFICIENT_QUANTITY',
        `Tổng số lượng mới (${totalQuantity}) không được nhỏ hơn số lượng đang được mượn (${borrowingSum})`
      );
    }

    const [dupRows] = await conn.query(
      'SELECT id FROM equipments WHERE code = ? AND id <> ?',
      [code, id]
    );
    if (dupRows.length > 0) {
      throw new AppError(409, 'DUPLICATE_CODE', 'Mã thiết bị đã tồn tại');
    }

    try {
      await conn.query(
        'UPDATE equipments SET code = ?, name = ?, category = ?, total_quantity = ? WHERE id = ?',
        [code, name, category, totalQuantity, id]
      );
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new AppError(409, 'DUPLICATE_CODE', 'Mã thiết bị đã tồn tại');
      }
      throw err;
    }

    return await getEquipmentById(id, conn);
  });
}

async function deleteEquipment(id) {
  const [eqRows] = await pool.query('SELECT id FROM equipments WHERE id = ?', [id]);
  if (eqRows.length === 0) {
    throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy thiết bị');
  }

  const [borrowingRows] = await pool.query(
    'SELECT id FROM borrowings WHERE equipment_id = ? LIMIT 1',
    [id]
  );
  if (borrowingRows.length > 0) {
    throw new AppError(
      409,
      'EQUIPMENT_HAS_BORROWINGS',
      'Không thể xóa thiết bị vì đã có phiếu mượn liên quan'
    );
  }

  try {
    await pool.query('DELETE FROM equipments WHERE id = ?', [id]);
  } catch (err) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
      throw new AppError(
        409,
        'EQUIPMENT_HAS_BORROWINGS',
        'Không thể xóa thiết bị vì đã có phiếu mượn liên quan'
      );
    }
    throw err;
  }
}

module.exports = {
  listEquipments,
  getEquipmentById,
  createEquipment,
  updateEquipment,
  deleteEquipment,
};

