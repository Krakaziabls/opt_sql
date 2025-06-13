import React, { createContext, useContext, useState, useCallback } from 'react';

interface MPPContextType {
    isMPPEnabled: boolean;
    setIsMPPEnabled: (enabled: boolean) => void;
    mppSettings: {
        maxWorkers: number;
        maxMemory: number;
    };
    setMPPSettings: (settings: { maxWorkers: number; maxMemory: number }) => void;
}

const MPPContext = createContext<MPPContextType | undefined>(undefined);

export const MPPProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isMPPEnabled, setIsMPPEnabled] = useState<boolean>(false);
    const [mppSettings, setMPPSettings] = useState({
        maxWorkers: 4,
        maxMemory: 1024
    });

    return (
        <MPPContext.Provider value={{ 
            isMPPEnabled, 
            setIsMPPEnabled,
            mppSettings,
            setMPPSettings
        }}>
            {children}
        </MPPContext.Provider>
    );
};

export const useMPP = () => {
    const context = useContext(MPPContext);
    if (context === undefined) {
        throw new Error('useMPP must be used within a MPPProvider');
    }
    return context;
}; 