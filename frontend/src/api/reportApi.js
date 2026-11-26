import axiosClient from './axiosClient';

export const reportApi = {
  getSummary(params) {
    return axiosClient.get('/reports/summary', { params });
  },
  getTopEquipments(params) {
    return axiosClient.get('/reports/top-equipments', { params });
  },
  getIdleEquipments(params) {
    return axiosClient.get('/reports/idle-equipments', { params });
  },
  getMonthlyTrend(params) {
    return axiosClient.get('/reports/monthly-trend', { params });
  },
};

