import axios from 'axios';
import { createRefreshQueue } from './refreshQueue';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

const { getRefreshPromise } = createRefreshQueue(() =>
  axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true })
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (status === 401 && originalRequest && !originalRequest._retried) {
      originalRequest._retried = true;
      await getRefreshPromise();
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);
