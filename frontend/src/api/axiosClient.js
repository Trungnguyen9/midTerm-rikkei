import axios from 'axios';

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const apiError = error.response?.data?.error;
    const message =
      apiError?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.'
        : 'Không thể kết nối đến máy chủ. Vui lòng thử lại.');

    const normalized = new Error(message);
    normalized.code = apiError?.code || 'NETWORK_ERROR';
    normalized.status = error.response?.status || 0;
    return Promise.reject(normalized);
  }
);

export default axiosClient;

