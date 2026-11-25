import { useCallback, useEffect, useState } from 'react';
import { equipmentApi } from '../api/equipmentApi';

export function useEquipments({ search = '', category = '', page = 1, limit = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEquipments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (search) params.search = search;
      if (category) params.category = category;
      const res = await equipmentApi.list(params);
      setItems(res.data || []);
      setPagination(res.pagination || { page, limit, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || 'Không tải được danh sách thiết bị. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [search, category, page, limit]);

  useEffect(() => {
    fetchEquipments();
  }, [fetchEquipments]);

  const createEquipment = async (payload) => {
    const res = await equipmentApi.create(payload);
    await fetchEquipments();
    return res.data;
  };

  const updateEquipment = async (id, payload) => {
    const res = await equipmentApi.update(id, payload);
    await fetchEquipments();
    return res.data;
  };

  const deleteEquipment = async (id) => {
    await equipmentApi.remove(id);
    await fetchEquipments();
  };

  return {
    items,
    pagination,
    loading,
    error,
    reload: fetchEquipments,
    createEquipment,
    updateEquipment,
    deleteEquipment,
  };
}

