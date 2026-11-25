const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');

const pool = require('../src/config/db');
const app = require('../src/app');
const { escapeLike } = require('../src/utils/sqlHelpers');

async function request(server, method, path, body) {
  const addr = server.address();
  const url = `http://127.0.0.1:${addr.port}${path}`;
  const res = await fetch(url, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return { status: res.status, json };
}

test('escapeLike escapes %, _, and \\', () => {
  assert.equal(escapeLike('100%_test\\a'), '100\\%\\_test\\\\a');
});

test('API validation, business errors, and routes', async (t) => {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => server.close());

  const originalQuery = pool.query.bind(pool);
  const originalGetConn = pool.getConnection.bind(pool);
  t.after(() => {
    pool.query = originalQuery;
    pool.getConnection = originalGetConn;
  });

  await t.test('200 OK for GET /api/health', async () => {
    const res = await request(server, 'GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'ok');
  });

  await t.test('404 NOT_FOUND for unknown route', async () => {
    const res = await request(server, 'GET', '/api/unknown');
    assert.equal(res.status, 404);
    assert.equal(res.json.error.code, 'NOT_FOUND');
  });

  await t.test('400 VALIDATION_ERROR for non-positive-int id', async () => {
    for (const badId of ['abc', '0', '-1', '1.5']) {
      const res = await request(server, 'GET', `/api/equipments/${badId}`);
      assert.equal(res.status, 400);
      assert.equal(res.json.error.code, 'VALIDATION_ERROR');
    }
  });

  await t.test('400 VALIDATION_ERROR for extra fields and wrong types', async () => {
    const resExtra = await request(server, 'POST', '/api/equipments', {
      code: 'lab-099',
      name: 'Test',
      category: 'laptop',
      totalQuantity: 5,
      extra: 123,
    });
    assert.equal(resExtra.status, 400);
    assert.equal(resExtra.json.error.code, 'VALIDATION_ERROR');

    const resWrongType = await request(server, 'POST', '/api/equipments', {
      code: 'LAB-099',
      name: 'Test',
      category: 'laptop',
      totalQuantity: '5',
    });
    assert.equal(resWrongType.status, 400);
    assert.equal(resWrongType.json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('400 VALIDATION_ERROR for invalid calendar date 2026-02-31', async () => {
    const res = await request(server, 'POST', '/api/borrowings', {
      equipmentId: 1,
      borrowerName: 'Nguyễn Văn A',
      quantity: 1,
      dueDate: '2026-02-31',
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error.code, 'VALIDATION_ERROR');
  });

  await t.test('POST /api/equipments trims and uppercases code, handles DUPLICATE_CODE', async () => {
    let insertedParams = null;
    pool.query = async (sql, params) => {
      if (sql.includes('SELECT id FROM equipments WHERE code = ?')) {
        return [[]];
      }
      if (sql.includes('INSERT INTO equipments')) {
        insertedParams = params;
        return [{ insertId: 13 }];
      }
      if (sql.includes('FROM equipments e')) {
        return [[{
          id: 13,
          code: 'LAB-013',
          name: 'Máy chiếu',
          category: 'phu_kien',
          totalQuantity: 3,
          availableQuantity: 3,
          createdAt: '2026-11-25 10:00:00',
        }]];
      }
      throw new Error(`Unexpected SQL: ${sql}`);
    };

    const res = await request(server, 'POST', '/api/equipments', {
      code: '  lab-013 ',
      name: '  Máy chiếu ',
      category: 'phu_kien',
      totalQuantity: 3,
    });
    assert.equal(res.status, 201);
    assert.equal(insertedParams[0], 'LAB-013');
    assert.equal(insertedParams[1], 'Máy chiếu');
    assert.equal(res.json.data.code, 'LAB-013');

    // Race condition ER_DUP_ENTRY
    pool.query = async (sql) => {
      if (sql.includes('SELECT id FROM equipments WHERE code = ?')) return [[]];
      if (sql.includes('INSERT INTO equipments')) {
        const err = new Error('Duplicate');
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      return [[]];
    };
    const dupRes = await request(server, 'POST', '/api/equipments', {
      code: 'LAB-013',
      name: 'Máy chiếu',
      category: 'phu_kien',
      totalQuantity: 3,
    });
    assert.equal(dupRes.status, 409);
    assert.equal(dupRes.json.error.code, 'DUPLICATE_CODE');
  });

  await t.test('DELETE /api/equipments/:id returns 409 EQUIPMENT_HAS_BORROWINGS', async () => {
    pool.query = async (sql) => {
      if (sql.includes('SELECT id FROM equipments')) return [[{ id: 1 }]];
      if (sql.includes('SELECT id FROM borrowings')) return [[{ id: 10 }]];
      return [[]];
    };
    const res = await request(server, 'DELETE', '/api/equipments/1');
    assert.equal(res.status, 409);
    assert.equal(res.json.error.code, 'EQUIPMENT_HAS_BORROWINGS');
  });

  await t.test('POST /api/borrowings validates dueDate against SQL CURDATE() and rolls back on error', async () => {
    let rolledBack = false;
    let released = false;
    pool.getConnection = async () => ({
      beginTransaction: async () => {},
      commit: async () => {},
      rollback: async () => { rolledBack = true; },
      release: () => { released = true; },
      query: async (sql) => {
        if (sql.includes('FOR UPDATE')) return [[{ id: 1, total_quantity: 10 }]];
        if (sql.includes('SUM(quantity)')) return [[{ borrowingSum: 2 }]];
        if (sql.includes('CURDATE() AS today')) {
          return [[{ today: '2026-11-25', maxDueDate: '2026-12-09' }]];
        }
        return [[]];
      },
    });

    const res = await request(server, 'POST', '/api/borrowings', {
      equipmentId: 1,
      borrowerName: 'Nguyễn Văn A',
      quantity: 2,
      dueDate: '2026-12-10',
    });
    assert.equal(res.status, 400);
    assert.equal(res.json.error.code, 'INVALID_DUE_DATE');
    assert.equal(rolledBack, true);
    assert.equal(released, true);
  });

  await t.test('PATCH /api/borrowings/:id/return distinguishes NOT_FOUND and ALREADY_RETURNED', async () => {
    pool.query = async (sql) => {
      if (sql.includes('UPDATE borrowings')) return [{ affectedRows: 0 }];
      if (sql.includes('SELECT id, returned_at')) return [[]];
      return [[]];
    };
    const notFound = await request(server, 'PATCH', '/api/borrowings/999/return');
    assert.equal(notFound.status, 404);
    assert.equal(notFound.json.error.code, 'NOT_FOUND');

    pool.query = async (sql) => {
      if (sql.includes('UPDATE borrowings')) return [{ affectedRows: 0 }];
      if (sql.includes('SELECT id, returned_at')) return [[{ id: 3, returned_at: '2026-11-20' }]];
      return [[]];
    };
    const already = await request(server, 'PATCH', '/api/borrowings/3/return');
    assert.equal(already.status, 409);
    assert.equal(already.json.error.code, 'ALREADY_RETURNED');
  });

  await t.test('500 INTERNAL_SERVER_ERROR never leaks SQL error', async () => {
    pool.query = async () => {
      throw new Error('ER_ACCESS_DENIED_ERROR: secret sql details');
    };
    const res = await request(server, 'GET', '/api/equipments');
    assert.equal(res.status, 500);
    assert.equal(res.json.error.code, 'INTERNAL_SERVER_ERROR');
    assert.ok(!JSON.stringify(res.json).includes('ER_ACCESS_DENIED_ERROR'));
  });
});

