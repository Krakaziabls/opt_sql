import React, { createContext, useContext, useState, useCallback } from 'react';
import { DatabaseConnectionDto } from '../types/database';

interface DatabaseConnectionContextType {
    connections: DatabaseConnectionDto[];
    setConnections: (connections: DatabaseConnectionDto[]) => void;
    addConnection: (connection: DatabaseConnectionDto) => void;
    removeConnection: (id: string) => void;
}

const DatabaseConnectionContext = createContext<DatabaseConnectionContextType | undefined>(undefined);

export const DatabaseConnectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [connections, setConnections] = useState<DatabaseConnectionDto[]>([]);

    const addConnection = useCallback((connection: DatabaseConnectionDto) => {
        setConnections(prev => [...prev, connection]);
    }, []);

    const removeConnection = useCallback((id: string) => {
        setConnections(prev => prev.filter(conn => conn.id !== id));
    }, []);

    return (
        <DatabaseConnectionContext.Provider value={{ connections, setConnections, addConnection, removeConnection }}>
            {children}
        </DatabaseConnectionContext.Provider>
    );
};

export const useDatabaseConnections = () => {
    const context = useContext(DatabaseConnectionContext);
    if (context === undefined) {
        throw new Error('useDatabaseConnections must be used within a DatabaseConnectionProvider');
    }
    return context;
}; 