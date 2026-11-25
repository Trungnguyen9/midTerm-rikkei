import axiosClient from './axiosClient';

export const equipmentApi = {
  list(params) {
    return axiosClient.get('/equipments', { params });
  },
  getById(id) {
    return axiosClient.get(`/equipments/${id}`);
  },
  create(payload) {
    return axiosClient.post('/equipments', payload);
  },
  update(id, payload) {
    return axiosClient.put(`/equipments/${id}`, payload);
  },
  remove(id) {
    return axiosClient.delete(`/equipments/${id}`);
  },
};

