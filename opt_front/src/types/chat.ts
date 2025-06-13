export interface Message {
    id: string;
    content: string;
    type: 'user' | 'assistant' | 'error';
    timestamp: string;
    llmProvider?: string;
}

export interface Chat {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
} 