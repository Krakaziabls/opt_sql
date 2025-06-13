import React, { createContext, useContext, useState, useCallback } from 'react';

interface LLMContextType {
    selectedLLM: string;
    setSelectedLLM: (llm: string) => void;
}

const LLMContext = createContext<LLMContextType | undefined>(undefined);

export const LLMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedLLM, setSelectedLLM] = useState<string>('Local');

    return (
        <LLMContext.Provider value={{ selectedLLM, setSelectedLLM }}>
            {children}
        </LLMContext.Provider>
    );
};

export const useLLM = () => {
    const context = useContext(LLMContext);
    if (context === undefined) {
        throw new Error('useLLM must be used within a LLMProvider');
    }
    return context;
}; 