import { useState } from 'react';
import BorrowFilter from '../components/BorrowFilter';
import BorrowForm from '../components/BorrowForm';
import BorrowTable from '../components/BorrowTable';
import Pagination from '../components/Pagination';
import StatusAlert from '../components/StatusAlert';
import { useBorrowings } from '../hooks/useBorrowings';
import { useEquipments } from '../hooks/useEquipments';
import { formatBorrowCode } from '../utils/formatters';

export default function BorrowingsPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [returningId, setReturningId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const {
    items,
    pagination,
    loading,
    error,
    reload,
    createBorrowing,
    returnBorrowing,
  } = useBorrowings({
    status: statusFilter,
    page,
    limit: 10,
  });

  const {
    items: equipments,
    reload: reloadEquipments,
  } = useEquipments({ page: 1, limit: 100 });

  const handleFilterChange = (nextStatus) => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const handleCreateBorrowing = async (payload) => {
    const created = await createBorrowing(payload);
    await reloadEquipments();
    setFeedback({
      type: 'success',
      message: `Đã tạo phiếu mượn ${formatBorrowCode(created.id)}.`,
    });
  };

  const handleReturn = async (item) => {
    setReturningId(item.id);
    setFeedback(null);
    try {
      await returnBorrowing(item.id);
      await reloadEquipments();
      setFeedback({
        type: 'success',
        message: `Đã ghi nhận trả thiết bị cho phiếu ${formatBorrowCode(item.id)}.`,
      });
    } catch (err) {
      setFeedback({
        type: 'danger',
        message: err.message || 'Không thể trả thiết bị. Vui lòng thử lại.',
      });
    } finally {
      setReturningId(null);
    }
  };

  return (
    <>
      <h1 className="h4 mb-3">Phiếu mượn thiết bị</h1>

      <StatusAlert
        type={feedback?.type}
        message={feedback?.message}
        onClose={() => setFeedback(null)}
      />

      <BorrowForm equipments={equipments} onSubmit={handleCreateBorrowing} />

      <BorrowFilter status={statusFilter} onChange={handleFilterChange} />

      <BorrowTable
        items={items}
        loading={loading}
        error={error}
        returningId={returningId}
        onRetry={reload}
        onReturn={handleReturn}
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        itemLabel="phiếu mượn"
        onPageChange={setPage}
      />
    </>
  );
}

