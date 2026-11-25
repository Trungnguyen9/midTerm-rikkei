/**
 * Concurrency test: sends N simultaneous borrow requests for the same equipment
 * where total requested quantity exceeds available stock.
 *
 * Usage:
 *   1. Ensure MySQL is running with rikkei_lab schema & seed data.
 *   2. Start backend server: npm start (default http://localhost:3000/api)
 *   3. Run: node tests/concurrency.js
 */

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const CONCURRENT_REQUESTS = 10;
const QUANTITY_PER_REQUEST = 2;

function formatTodayOffset(days) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const d = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function main() {
  const uniqueCode = `CONC-${Date.now().toString().slice(-6)}`;
  const totalQuantity = 5; // Intentionally < CONCURRENT_REQUESTS * QUANTITY_PER_REQUEST (20)

  const createRes = await fetch(`${BASE_URL}/equipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: uniqueCode,
      name: 'Thiết bị test đồng thời',
      category: 'phu_kien',
      totalQuantity,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Không thể tạo thiết bị test: ${createRes.status} ${errText}`);
  }

  const { data: createdEq } = await createRes.json();
  const dueDate = formatTodayOffset(3);

  console.log(
    `Created test equipment id=${createdEq.id}, totalQuantity=${totalQuantity}. Firing ${CONCURRENT_REQUESTS} concurrent requests of qty=${QUANTITY_PER_REQUEST}...`
  );

  const requests = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) =>
    fetch(`${BASE_URL}/borrowings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        equipmentId: createdEq.id,
        borrowerName: `Tester ${idx + 1}`,
        quantity: QUANTITY_PER_REQUEST,
        dueDate,
      }),
    }).then(async (res) => ({
      index: idx + 1,
      status: res.status,
      body: await res.json(),
    }))
  );

  const results = await Promise.all(requests);
  const succeeded = results.filter((r) => r.status === 201);
  const rejectedInsufficient = results.filter(
    (r) => r.status === 409 && r.body?.error?.code === 'INSUFFICIENT_QUANTITY'
  );
  const otherFailures = results.filter(
    (r) => r.status !== 201 && !(r.status === 409 && r.body?.error?.code === 'INSUFFICIENT_QUANTITY')
  );

  const checkRes = await fetch(`${BASE_URL}/equipments/${createdEq.id}`);
  const { data: finalEq } = await checkRes.json();

  const totalBorrowed = totalQuantity - finalEq.availableQuantity;

  console.log('Summary:');
  console.log(`- 201 Created: ${succeeded.length}`);
  console.log(`- 409 INSUFFICIENT_QUANTITY: ${rejectedInsufficient.length}`);
  console.log(`- Other responses: ${otherFailures.length}`);
  console.log(
    `- Final equipment state: totalQuantity=${finalEq.totalQuantity}, availableQuantity=${finalEq.availableQuantity}, totalBorrowed=${totalBorrowed}`
  );

  if (totalBorrowed > totalQuantity || finalEq.availableQuantity < 0) {
    console.error('FAIL: Total borrowed exceeded total_quantity!');
    process.exit(1);
  }

  if (otherFailures.length > 0) {
    console.error('FAIL: Unexpected errors occurred:', otherFailures);
    process.exit(1);
  }

  console.log('PASS: Transaction + FOR UPDATE prevented over-borrowing.');
}

main().catch((err) => {
  console.error('Concurrency test error:', err.message);
  process.exit(1);
});

