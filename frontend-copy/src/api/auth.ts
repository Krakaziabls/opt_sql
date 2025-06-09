import apiClient from './client';

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    password: string;
    email?: string;
}

export interface AuthResponse {
    token: string;
    username: string;
    userId: number;
}

export const authApi = {
    login: async (data: LoginRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/login', data);
        return response.data;
    },

    register: async (data: RegisterRequest): Promise<AuthResponse> => {
        const response = await apiClient.post<AuthResponse>('/auth/register', data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.post('/auth/logout');
        localStorage.removeItem('token');
    },

    getCurrentUser: async (): Promise<AuthResponse> => {
        const response = await apiClient.get<AuthResponse>('/auth/me');
        return response.data;
    },
};
