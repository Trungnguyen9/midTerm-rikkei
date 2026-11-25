import { useCallback, useEffect, useState } from 'react';
import { borrowingApi } from '../api/borrowingApi';

export function useBorrowings({ status = '', page = 1, limit = 10 } = {}) {
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBorrowings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit };
      if (status) params.status = status;
      const res = await borrowingApi.list(params);
      setItems(res.data || []);
      setPagination(res.pagination || { page, limit, total: 0, totalPages: 0 });
    } catch (err) {
      setError(err.message || 'Không tải được danh sách phiếu mượn. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, [status, page, limit]);

  useEffect(() => {
    fetchBorrowings();
  }, [fetchBorrowings]);

  const createBorrowing = async (payload) => {
    const res = await borrowingApi.create(payload);
    await fetchBorrowings();
    return res.data;
  };

  const returnBorrowing = async (id) => {
    const res = await borrowingApi.returnBorrowing(id);
    await fetchBorrowings();
    return res.data;
  };

  return {
    items,
    pagination,
    loading,
    error,
    reload: fetchBorrowings,
    createBorrowing,
    returnBorrowing,
  };
}

