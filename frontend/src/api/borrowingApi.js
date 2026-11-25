import axiosClient from './axiosClient';

export const borrowingApi = {
  list(params) {
    return axiosClient.get('/borrowings', { params });
  },
  create(payload) {
    return axiosClient.post('/borrowings', payload);
  },
  returnBorrowing(id) {
    return axiosClient.patch(`/borrowings/${id}/return`);
  },
};

