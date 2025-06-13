import apiClient from './client';
import { DatabaseConnectionDto } from '../types/database';

export const connectionApi = {
    getConnectionsForChat: async (chatId: string): Promise<DatabaseConnectionDto[]> => {
        const response = await apiClient.get<DatabaseConnectionDto[]>(`/connections/chat/${chatId}`);
        return response.data;
    },

    createConnection: async (data: DatabaseConnectionDto): Promise<DatabaseConnectionDto> => {
        const response = await apiClient.post<DatabaseConnectionDto>('/connections', data);
        return response.data;
    },

    testConnection: async (data: DatabaseConnectionDto): Promise<{ success: boolean }> => {
        const response = await apiClient.post<{ success: boolean }>('/connections/test', data);
        return response.data;
    },

    closeConnection: async (connectionId: string): Promise<void> => {
        await apiClient.post(`/connections/${connectionId}/close`);
    },
};
