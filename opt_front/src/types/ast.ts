export interface Operation {
    type: string;
    tableName?: string;
    statistics: {
        cost: string;
        rows: string;
        width: string;
    };
    keys: string[];
    conditions: string[];
    metadata: Record<string, any>;
    additionalInfo: string[];
}

export interface QueryPlanResult {
    operations: Operation[];
    cost: number;
    planningTimeMs: number;
    executionTimeMs: number;
    totalCost: string;
    totalRows: string;
} 