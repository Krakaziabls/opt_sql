export interface DatabaseConnectionDto {
    id?: string;
    chatId: string;
    name: string;
    dbType: string;
    host: string;
    port: number;
    databaseName: string;
    username: string;
    password: string;
    active?: boolean;
    createdAt?: string;
    lastConnectedAt?: string;
}

export interface TableMetadata {
    columns: ColumnMetadata[];
    indexes: IndexMetadata[];
    statistics: TableStatistics;
}

export interface ColumnMetadata {
    name: string;
    type: string;
    nullable: boolean;
    default?: string;
}

export interface IndexMetadata {
    name: string;
    columns: string[];
    unique: boolean;
}

export interface TableStatistics {
    estimatedRows: number;
    totalSize: string;
    pages: number;
} 