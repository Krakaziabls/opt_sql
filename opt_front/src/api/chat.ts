import apiClient from './client';

export interface Message {
    id: string;
    chatId: string;
    content: string;
    fromUser: boolean;
    createdAt: string;
    llmProvider?: string;
}

export interface Chat {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
}

const handleApiError = (error: any): never => {
    console.error('API Error:', error);
    if (error.response) {
        throw new Error(error.response.data?.message || 'API request failed');
    }
    throw new Error('Network error occurred');
};

export const chatApi = {
    getChats: async (): Promise<Chat[]> => {
        try {
            const response = await apiClient.get('/chats');
            return response.data.map((chat: any) => ({
                ...chat,
                id: String(chat.id)
            }));
        } catch (error) {
            return handleApiError(error);
        }
    },

    getChat: async (chatId: string): Promise<Chat> => {
        try {
            const response = await apiClient.get(`/chats/${chatId}`);
            return { ...response.data, id: String(response.data.id) };
        } catch (error) {
            return handleApiError(error);
        }
    },

    createChat: async (title: string): Promise<Chat> => {
        try {
            const response = await apiClient.post('/chats', { title });
            return { ...response.data, id: String(response.data.id) };
        } catch (error) {
            return handleApiError(error);
        }
    },

    updateChat: async (chatId: string, title: string): Promise<Chat> => {
        try {
            const response = await apiClient.put(`/chats/${chatId}`, { title });
            return { ...response.data, id: String(response.data.id) };
        } catch (error) {
            return handleApiError(error);
        }
    },

    deleteChat: async (chatId: string): Promise<void> => {
        try {
            await apiClient.delete(`/chats/${chatId}`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    archiveChat: async (chatId: string): Promise<void> => {
        try {
            await apiClient.post(`/chats/${chatId}/archive`);
        } catch (error) {
            return handleApiError(error);
        }
    },

    getChatMessages: async (chatId: string): Promise<Message[]> => {
        try {
            const response = await apiClient.get(`/chats/${chatId}/messages`);
            return (response.data || []).map((msg: any) => ({
                ...msg,
                id: String(msg.id)
            }));
        } catch (error) {
            return handleApiError(error);
        }
    },

    sendMessage: async (chatId: string, content: string, fromUser: boolean): Promise<Message> => {
        try {
            const payload = { content, fromUser };
            console.log(`Sending message to /chats/${chatId}/messages:`, { chatId, payload });
            const response = await apiClient.post(`/chats/${chatId}/messages`, payload);
            return { ...response.data, id: String(response.data.id) };
        } catch (error) {
            return handleApiError(error);
        }
    },
};
