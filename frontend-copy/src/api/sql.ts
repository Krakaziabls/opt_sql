import apiClient from './client';
import { Message } from './chat';
import { getPromptTemplate } from '../lib/llmResponseParser';

export interface SqlQueryRequest {
    chatId: string;
    query: string;
    databaseConnectionId?: string;
    llm: string;
    isMPP: boolean;
}

export interface SqlQueryResponse {
    id: string;
    originalQuery: string;
    optimizedQuery: string;
    executionTimeMs?: number;
    createdAt: string;
    message: Message;
}

export const sqlApi = {
    async optimizeQuery({ chatId, query, databaseConnectionId, llm, isMPP }: SqlQueryRequest) {
        const hasConnection = !!databaseConnectionId;
        
        const promptTemplate = getPromptTemplate(isMPP, hasConnection);
        
        const response = await apiClient.post('/sql/optimize', {
            chatId,
            query,
            databaseConnectionId,
            llm,
            promptTemplate,
            isMPP
        });

        return response.data;
    },

    getQueryHistory: async (chatId: string): Promise<SqlQueryResponse[]> => {
        const response = await apiClient.get(`/sql/history/${chatId}`);
        return response.data.map((item: any) => ({ ...item, id: String(item.id) }));
    },
};
