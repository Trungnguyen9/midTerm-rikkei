import { useCallback, useEffect, useState } from 'react';
import { reportApi } from '../api/reportApi';

/**
 * Hook tải 1 endpoint báo cáo. Trả { data, range, pagination?, loading, error, reload }.
 * @param {'summary'|'topEquipments'|'idleEquipments'|'monthlyTrend'} endpoint
 * @param {object} params  – { from, to, limit, page }
 */
function useReportEndpoint(endpoint, params = {}) {
  const [data, setData] = useState(null);
  const [range, setRange] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apiMap = {
    summary: reportApi.getSummary,
    topEquipments: reportApi.getTopEquipments,
    idleEquipments: reportApi.getIdleEquipments,
    monthlyTrend: reportApi.getMonthlyTrend,
  };

  // Serialise params cho dependency
  const paramKey = JSON.stringify(params);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Lọc bỏ params rỗng
      const cleanParams = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') cleanParams[k] = v;
      }
      const res = await apiMap[endpoint](cleanParams);
      setData(res.data ?? null);
      setRange(res.range ?? null);
      setPagination(res.pagination ?? null);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, paramKey]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, range, pagination, loading, error, reload: fetch };
}

export function useSummary(params) {
  return useReportEndpoint('summary', params);
}

export function useTopEquipments(params) {
  return useReportEndpoint('topEquipments', params);
}

export function useIdleEquipments(params) {
  return useReportEndpoint('idleEquipments', params);
}

export function useMonthlyTrend(params) {
  return useReportEndpoint('monthlyTrend', params);
}

