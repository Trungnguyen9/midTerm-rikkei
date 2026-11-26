import { useState } from 'react';
import { useSummary, useTopEquipments, useIdleEquipments, useMonthlyTrend } from '../hooks/useReports';
import { formatDateDDMMYYYY, CATEGORY_LABELS } from '../utils/formatters';
import Pagination from '../components/Pagination';

// ─── helpers ────────────────────────────────────────────────────────────────────

function formatMonth(yyyymm) {
  if (!yyyymm || typeof yyyymm !== 'string') return '—';
  const [y, m] = yyyymm.split('-');
  return `${m}/${y}`;
}

function ErrorBlock({ error, onRetry }) {
  return (
    <div className="alert alert-danger d-flex align-items-center justify-content-between py-2 mb-0">
      <span>{error}</span>
      <button className="btn btn-sm btn-outline-danger ms-2" onClick={onRetry}>Thử lại</button>
    </div>
  );
}

function LoadingBlock() {
  return (
    <div className="d-flex justify-content-center py-4">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Đang tải...</span>
      </div>
    </div>
  );
}

function EmptyBlock({ message = 'Không có dữ liệu' }) {
  return <p className="text-muted text-center py-3 mb-0">{message}</p>;
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [appliedFrom, setAppliedFrom] = useState('');
  const [appliedTo, setAppliedTo] = useState('');
  const [filterError, setFilterError] = useState('');
  const [idlePage, setIdlePage] = useState(1);

  const params = {};
  if (appliedFrom) params.from = appliedFrom;
  if (appliedTo) params.to = appliedTo;

  const summary = useSummary(params);
  const top = useTopEquipments({ ...params, limit: 10 });
  const idle = useIdleEquipments({ ...params, page: idlePage, limit: 5 });
  const trend = useMonthlyTrend(params);

  function handleApply() {
    if (from && to && from > to) {
      setFilterError('Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc');
      return;
    }
    setFilterError('');
    setIdlePage(1);
    setAppliedFrom(from);
    setAppliedTo(to);
  }

  function handleReset() {
    setFrom('');
    setTo('');
    setFilterError('');
    setIdlePage(1);
    setAppliedFrom('');
    setAppliedTo('');
  }

  // Kỳ hiển thị: lấy từ range trả về (ưu tiên summary)
  const displayRange = summary.range || top.range || idle.range || trend.range;

  return (
    <>
      <h1 className="h4 mb-1">Thống kê và báo cáo</h1>
      <p className="text-muted mb-3">
        {displayRange
          ? `Kỳ: ${formatDateDDMMYYYY(displayRange.from)} – ${formatDateDDMMYYYY(displayRange.to)}`
          : 'Đang tải...'}
      </p>

      {/* ===== Bộ lọc kỳ ===== */}
      <div className="card mb-4">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-auto">
              <label className="form-label mb-0 small">Từ ngày</label>
              <input type="date" className="form-control form-control-sm" value={from}
                     onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="col-auto">
              <label className="form-label mb-0 small">Đến ngày</label>
              <input type="date" className="form-control form-control-sm" value={to}
                     onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="col-auto">
              <button className="btn btn-primary btn-sm" onClick={handleApply}>Áp dụng</button>
            </div>
            <div className="col-auto">
              <button className="btn btn-outline-secondary btn-sm" onClick={handleReset}>Đặt lại</button>
            </div>
          </div>
          {filterError && <div className="text-danger small mt-1">{filterError}</div>}
        </div>
      </div>

      {/* ===== Thẻ tổng quan ===== */}
      <div className="row g-3 mb-4">
        {summary.loading ? (
          <div className="col-12"><LoadingBlock /></div>
        ) : summary.error ? (
          <div className="col-12"><ErrorBlock error={summary.error} onRetry={summary.reload} /></div>
        ) : summary.data ? (
          <>
            <div className="col-6 col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="text-muted small">Tổng lượt mượn</div>
                  <div className="fs-3 fw-bold">{summary.data.totalBorrowings}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="text-muted small">Tổng SL thiết bị mượn</div>
                  <div className="fs-3 fw-bold text-primary">{summary.data.totalBorrowedQuantity}</div>
                </div>
              </div>
            </div>
            <div className="col-6 col-md-4">
              <div className="card">
                <div className="card-body">
                  <div className="text-muted small">Thiết bị nằm kho</div>
                  <div className="fs-3 fw-bold text-secondary">{summary.data.idleEquipmentCount}</div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="row g-3">
        {/* ===== Top thiết bị ===== */}
        <div className="col-lg-7">
          <div className="card h-100">
            <div className="card-header">Thiết bị được mượn nhiều nhất</div>
            {top.loading ? (
              <div className="card-body"><LoadingBlock /></div>
            ) : top.error ? (
              <div className="card-body"><ErrorBlock error={top.error} onRetry={top.reload} /></div>
            ) : !top.data || top.data.length === 0 ? (
              <div className="card-body"><EmptyBlock message="Không có thiết bị nào được mượn trong kỳ" /></div>
            ) : (
              <table className="table align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th>#</th>
                    <th>Thiết bị</th>
                    <th>Mức độ</th>
                    <th className="text-end">SL mượn</th>
                    <th className="text-end">Lượt</th>
                  </tr>
                </thead>
                <tbody>
                  {top.data.map((item) => {
                    const maxQty = top.data[0]?.totalBorrowedQuantity || 1;
                    const pct = Math.round((item.totalBorrowedQuantity / maxQty) * 100);
                    return (
                      <tr key={item.equipmentId}>
                        <td>{item.rank}</td>
                        <td>
                          <div>{item.name}</div>
                          <small className="text-muted">{item.code} · {CATEGORY_LABELS[item.category] || item.category}</small>
                        </td>
                        <td style={{ width: '30%' }}>
                          <div className="progress" role="progressbar">
                            <div className="progress-bar" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                        <td className="text-end">{item.totalBorrowedQuantity}</td>
                        <td className="text-end">{item.borrowingCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ===== Thiết bị nằm kho ===== */}
        <div className="col-lg-5">
          <div className="card h-100">
            <div className="card-header">Thiết bị nằm kho</div>
            {idle.loading ? (
              <div className="card-body"><LoadingBlock /></div>
            ) : idle.error ? (
              <div className="card-body"><ErrorBlock error={idle.error} onRetry={idle.reload} /></div>
            ) : !idle.data || idle.data.length === 0 ? (
              <div className="card-body"><EmptyBlock message="Tất cả thiết bị đều có lượt mượn trong kỳ" /></div>
            ) : (
              <>
                <ul className="list-group list-group-flush">
                  {idle.data.map((item) => (
                    <li key={item.equipmentId} className="list-group-item">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <div>{item.name}</div>
                          <small className="text-muted">
                            {item.code} · SL: {item.totalQuantity} · Còn: {item.availableQuantity}
                          </small>
                        </div>
                        <span className="badge text-bg-secondary">
                          {item.lastBorrowedAt
                            ? `Mượn lần cuối: ${formatDateDDMMYYYY(item.lastBorrowedAt)}`
                            : 'Chưa từng mượn'}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {idle.pagination && idle.pagination.totalPages > 0 && (
                  <div className="card-footer">
                    <Pagination
                      page={idle.pagination.page}
                      totalPages={idle.pagination.totalPages}
                      total={idle.pagination.total}
                      itemLabel="thiết bị"
                      onPageChange={setIdlePage}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ===== Xu hướng theo tháng ===== */}
      <div className="card mt-3">
        <div className="card-header">Số lượt mượn theo tháng</div>
        {trend.loading ? (
          <div className="card-body"><LoadingBlock /></div>
        ) : trend.error ? (
          <div className="card-body"><ErrorBlock error={trend.error} onRetry={trend.reload} /></div>
        ) : !trend.data || trend.data.length === 0 ? (
          <div className="card-body"><EmptyBlock message="Không có dữ liệu xu hướng" /></div>
        ) : (
          <div className="card-body">
            <MonthlyChart data={trend.data} />
          </div>
        )}
      </div>
    </>
  );
}

// ─── Biểu đồ cột CSS (giống giao diện mẫu, không dùng thư viện) ───────────────

function MonthlyChart({ data }) {
  const maxCount = Math.max(...data.map((d) => d.borrowingCount), 1);
  const chartHeight = 180;

  return (
    <div className="d-flex align-items-end" style={{ height: `${chartHeight + 40}px` }}>
      {data.map((item) => {
        const barH = maxCount > 0 ? Math.max((item.borrowingCount / maxCount) * chartHeight, item.borrowingCount > 0 ? 4 : 2) : 2;
        return (
          <div key={item.month} className="text-center flex-fill" style={{ minWidth: 0 }}>
            <div className="small text-muted">{item.borrowingCount}</div>
            <div
              className="bg-primary rounded-top mx-auto"
              style={{ width: '60%', height: `${barH}px` }}
              title={`${formatMonth(item.month)}: ${item.borrowingCount} lượt, ${item.totalQuantity} SL`}
            />
            <div className="small mt-1">{formatMonth(item.month)}</div>
          </div>
        );
      })}
    </div>
  );
}
