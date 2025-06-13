import apiClient from './client';

export interface Operation {
    type: string;
    table?: string;
    tableName?: string;
    metadata?: Record<string, string>;
    statistics?: Record<string, string>;
    keys?: string[];
    conditions?: string[];
    additionalInfo?: string[];
}

export interface QueryPlanResult {
    operations: Operation[];
    cost?: number;
    planningTimeMs?: number;
    executionTimeMs?: number;
    totalCost?: string;
    totalRows?: string;
    additionalInfo?: Record<string, any>;
}

export interface TableMetadata {
    name: string;
    columns: ColumnMetadata[];
    indexes: IndexMetadata[];
    statistics: TableStatistics;
}

export interface ColumnMetadata {
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
    description?: string;
}

export interface IndexMetadata {
    name: string;
    columns: string[];
    type: string;
    unique: boolean;
}

export interface TableStatistics {
    rowCount: number;
    size: string;
    lastAnalyzed?: string;
    cacheHitRatio?: number;
}

export const astApi = {
    analyzeQueryPlan: async (plan: string): Promise<QueryPlanResult> => {
        try {
            const response = await apiClient.post('/ast/analyze', null, {
                params: { plan }
            });
            return response.data;
        } catch (error) {
            console.error('Error analyzing query plan:', error);
            throw error;
        }
    },

    updateTableMetadata: async (tableName: string, metadata: Record<string, any>): Promise<void> => {
        try {
            await apiClient.post(`/ast/metadata/${tableName}`, metadata);
        } catch (error) {
            console.error('Error updating table metadata:', error);
            throw error;
        }
    },

    getTableMetadata: async (tableName: string): Promise<Record<string, any>> => {
        try {
            const response = await apiClient.get(`/ast/metadata/${tableName}`);
            return response.data;
        } catch (error) {
            console.error('Error getting table metadata:', error);
            throw error;
        }
    },

    clearTableMetadata: async (): Promise<void> => {
        try {
            await apiClient.delete('/ast/metadata');
        } catch (error) {
            console.error('Error clearing table metadata:', error);
            throw error;
        }
    }
}; 