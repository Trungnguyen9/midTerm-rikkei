const pool = require('../config/db');

/**
 * Escape wildcard characters (%, _, \) for SQL LIKE clauses using ESCAPE '\'.
 * @param {string} keyword
 * @returns {string}
 */
function escapeLike(keyword) {
  return keyword.replace(/[\\%_]/g, '\\$&');
}

/**
 * Run a callback inside a MySQL transaction and always release the connection.
 * @template T
 * @param {(conn: import('mysql2/promise').PoolConnection) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function withTransaction(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    try {
      await conn.rollback();
    } catch (_) {
      // Ignore rollback errors when connection is already closed
    }
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  escapeLike,
  withTransaction,
};

