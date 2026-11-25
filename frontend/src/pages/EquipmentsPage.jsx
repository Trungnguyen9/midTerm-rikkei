import { useState } from 'react';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import EquipmentDetailModal from '../components/EquipmentDetailModal';
import EquipmentFormModal from '../components/EquipmentFormModal';
import EquipmentTable from '../components/EquipmentTable';
import EquipmentToolbar from '../components/EquipmentToolbar';
import Pagination from '../components/Pagination';
import StatusAlert from '../components/StatusAlert';
import { useDebounce } from '../hooks/useDebounce';
import { useEquipments } from '../hooks/useEquipments';

export default function EquipmentsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [detailEquipmentId, setDetailEquipmentId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const debouncedSearch = useDebounce(searchInput, 300);

  const {
    items,
    pagination,
    loading,
    error,
    reload,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  } = useEquipments({
    search: debouncedSearch,
    category,
    page,
    limit: 10,
  });

  const handleSearchChange = (value) => {
    setSearchInput(value);
    setPage(1);
  };

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleFormSubmit = async (payload) => {
    if (editingItem) {
      await updateEquipment(editingItem.id, payload);
      setFeedback({ type: 'success', message: `Đã cập nhật thiết bị ${payload.code}.` });
    } else {
      const created = await createEquipment(payload);
      setFeedback({ type: 'success', message: `Đã thêm thiết bị ${created.code}.` });
    }
  };

  const handleConfirmDelete = async (item) => {
    try {
      await deleteEquipment(item.id);
      setFeedback({ type: 'success', message: `Đã xóa thiết bị ${item.name}.` });
    } catch (err) {
      setFeedback({ type: 'danger', message: err.message || 'Không thể xóa thiết bị.' });
    }
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h4 mb-0">Quản lý thiết bị</h1>
      </div>

      <StatusAlert
        type={feedback?.type}
        message={feedback?.message}
        onClose={() => setFeedback(null)}
      />

      <EquipmentToolbar
        search={searchInput}
        category={category}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onAddClick={handleOpenAdd}
      />

      <EquipmentTable
        items={items}
        loading={loading}
        error={error}
        onRetry={reload}
        onViewDetail={(item) => setDetailEquipmentId(item.id)}
        onEdit={handleOpenEdit}
        onDelete={setDeletingItem}
      />

      <Pagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        itemLabel="thiết bị"
        onPageChange={setPage}
      />

      <EquipmentFormModal
        isOpen={modalOpen}
        editingItem={editingItem}
        onClose={() => setModalOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <EquipmentDetailModal
        equipmentId={detailEquipmentId}
        onClose={() => setDetailEquipmentId(null)}
      />

      <ConfirmDeleteModal
        item={deletingItem}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

