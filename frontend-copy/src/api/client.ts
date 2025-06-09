import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
});

// Интерсептор запросов
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        console.log('Making request to:', config.url, {
            method: config.method,
            headers: config.headers,
            data: config.data,
            token: token ? 'present' : 'missing'
        });
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Added Authorization header:', config.headers.Authorization);
        } else {
            console.warn('No token found in localStorage for request to:', config.url);
        }
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Интерсептор ответов
apiClient.interceptors.response.use(
    (response) => {
        console.log('Response from:', response.config.url, {
            status: response.status,
            headers: response.headers,
            data: response.data
        });
        return response;
    },
    (error) => {
        console.error('Response error:', {
            url: error.config?.url,
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
        });
        const status = error.response?.status;

        if (status === 401) {
            // Токен недействителен — редирект на логин
            console.error('Authentication error, redirecting to login');
            localStorage.removeItem('token');
            delete apiClient.defaults.headers.common['Authorization'];
            window.location.href = '/login';
        } else if (status === 403) {
            // Нет прав — передаем ошибку в компонент
            console.error('Forbidden: You do not have permission to perform this action');
            return Promise.reject({
                ...error,
                message: 'У вас нет прав для выполнения этого действия'
            });
        } else if (status === 404) {
            console.error('Resource not found:', error.config?.url);
        } else if (status === 500) {
            console.error('Server error:', error.response?.data);
        }

        return Promise.reject(error);
    }
);

export default apiClient;
