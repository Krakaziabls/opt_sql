import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import { Client, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '../lib/utils';
import LLMSelect from './LLMSelect';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Message } from '../api/chat';
import { sqlApi } from '../api/sql';
import { connectionApi } from '../api/connection';
import { DatabaseConnectionDto } from '../types/database';
import { chatApi } from '../api/chat';
import { createWebSocketClient, disconnectWebSocket } from '../api/websocket';
import { OptimizedSQLResponse } from './OptimizedSQLResponse';
import { parseLLMResponse, parseQueryPlan } from '../lib/llmResponseParser';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { QueryPlanResult } from '../api/ast';
import { useChat } from '../context/ChatContext';
import { useDatabaseConnections } from '../context/DatabaseConnectionContext';
import { useLLM } from '../context/LLMContext';
import { useMPP } from '../context/MPPContext';

interface ChatAreaProps {
    selectedChatId: string;
    selectedLLM: string;
    onSelectLLM: (llm: string) => void;
    onConnectDB: () => void;
}

interface WebSocketClient extends Client {
    subscription?: StompSubscription;
}

interface CodeProps {
    node?: any;
    inline?: boolean;
    className?: string;
    children?: React.ReactNode;
    [key: string]: any;
}

const LoadingMessage = () => (
    <div className="flex flex-col items-center justify-center space-y-4">
        <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
            <div className="w-3 h-3 bg-gray-400 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
        </div>
        <p className="text-gray-400 text-sm animate-pulse">Loading...</p>
    </div>
);

const ChatArea: React.FC<ChatAreaProps> = memo(({
    selectedChatId,
    selectedLLM,
    onSelectLLM,
    onConnectDB,
}) => {
    const { messages, addMessage } = useChat();
    const { connections } = useDatabaseConnections();
    const { selectedLLM: currentSelectedLLM } = useLLM();
    const { isMPPEnabled, mppSettings, setIsMPPEnabled } = useMPP();
    
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [localMessages, setLocalMessages] = useState<Message[]>([]);
    const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);
    const processedMessageIds = React.useRef<Set<string>>(new Set());
    const wsClient = React.useRef<WebSocketClient | null>(null);
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: "smooth",
                block: "end"
            });
        }
    }, []);

    useEffect(() => {
        if (selectedChatId) {
            setLocalMessages([]);
            setPendingMessageIds([]);
            processedMessageIds.current.clear();
            scrollToBottom();
        }
    }, [selectedChatId, scrollToBottom]);

    useEffect(() => {
        if (!selectedChatId) {
            setLocalMessages([]);
            setPendingMessageIds([]);
            return;
        }

        const loadMessages = async () => {
            setLoading(true);
            try {
                const messages = await chatApi.getChatMessages(selectedChatId);
                setLocalMessages(messages || []);
                messages?.forEach(msg => processedMessageIds.current.add(msg.id));
                setPendingMessageIds([]);
                setTimeout(() => {
                    scrollToBottom();
                }, 100);
            } catch (err) {
                setError('Failed to load messages: ' + (err instanceof Error ? err.message : 'Unknown error'));
            } finally {
                setLoading(false);
            }
        };

        loadMessages();
    }, [selectedChatId, scrollToBottom]);

    useEffect(() => {
        if (localMessages.length > 0) {
            scrollToBottom();
        }
    }, [localMessages, scrollToBottom]);

    const isSQLQuery = useCallback((text: string) => {
        const upperText = text.toUpperCase();
        return upperText.includes('SELECT') && upperText.includes('FROM');
    }, []);

    useEffect(() => {
        if (!selectedChatId) return;

        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token found');
            return;
        }

        const client = createWebSocketClient(token);

        client.onConnect = () => {
            const subscription = client.subscribe(`/topic/chat/${selectedChatId}`, (message) => {
                try {
                    const newMessage: Message = JSON.parse(message.body);
                    console.log('Received WebSocket message:', newMessage);

                    if (processedMessageIds.current.has(newMessage.id)) {
                        console.log('Message already processed:', newMessage.id);
                        return;
                    }

                    processedMessageIds.current.add(newMessage.id);

                    if (isSQLQuery(newMessage.content) && pendingMessageIds.length > 0) {
                        const tempId = pendingMessageIds[0];
                        setPendingMessageIds(prev => prev.slice(1));
                        setLocalMessages(prev => prev.filter(m => m.id !== tempId));
                    }

                    setLocalMessages(prev => {
                        const updatedMessages = [...prev];
                        const existingIndex = updatedMessages.findIndex(m => m.id === newMessage.id);
                        
                        if (existingIndex !== -1) {
                            console.log('Updating existing message:', newMessage.id);
                            updatedMessages[existingIndex] = newMessage;
                        } else {
                            console.log('Adding new message:', newMessage.id);
                            updatedMessages.push(newMessage);
                        }
                        
                        return updatedMessages;
                    });

                    setTimeout(() => {
                        setLocalMessages(prev => [...prev]);
                        scrollToBottom();
                    }, 100);
                } catch (err) {
                    console.error('Error processing WebSocket message:', err);
                    setError('Error processing message: ' + (err instanceof Error ? err.message : 'Unknown error'));
                }
            });

            wsClient.current = client as WebSocketClient;
            wsClient.current.subscription = subscription;
        };

        client.onStompError = (error) => {
            console.error('STOMP error:', error);
            setError('WebSocket error: ' + error.headers.message);
        };

        client.onWebSocketError = (event) => {
            console.error('WebSocket error:', event);
            setError('WebSocket connection error');
        };

        client.activate();

        return () => {
            if (wsClient.current?.active) {
                wsClient.current.subscription?.unsubscribe();
                wsClient.current.deactivate();
            }
        };
    }, [selectedChatId, scrollToBottom, isSQLQuery]);

    const handleSendMessage = useCallback(async () => {
        if (!message.trim() || !selectedChatId) return;

        const currentMessage = message.trim();
        setMessage('');
        setLoading(true);
        setError('');

        try {
            if (isSQLQuery(currentMessage)) {
                const tempId = `temp_${Date.now()}`;
                const tempMessage: Message = {
                    id: tempId,
                    chatId: selectedChatId,
                    content: currentMessage,
                    fromUser: true,
                    createdAt: new Date().toISOString(),
                    llmProvider: currentSelectedLLM
                };
                
                setLocalMessages(prev => [...prev, tempMessage]);
                setPendingMessageIds(prev => [...prev, tempId]);

                setTimeout(() => {
                    setLocalMessages(prev => [...prev]);
                }, 0);

                await sqlApi.optimizeQuery({
                    chatId: selectedChatId,
                    query: currentMessage,
                    databaseConnectionId: connections.length > 0 ? connections[0].id : undefined,
                    llm: currentSelectedLLM,
                    isMPP: isMPPEnabled
                });
            } else {
                const userMessage = await chatApi.sendMessage(selectedChatId, currentMessage, true);
                setLocalMessages(prev => [...prev, userMessage]);
                
                setTimeout(() => {
                    setLocalMessages(prev => [...prev]);
                }, 0);

                await chatApi.sendMessage(selectedChatId, "Пожалуйста, отправьте SQL-запрос для оптимизации", false);
            }
        } catch (err) {
            console.error('Error sending message:', err);
            setError('Failed to send message: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setLocalMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
        } finally {
            setLoading(false);
        }
    }, [selectedChatId, message, isSQLQuery, currentSelectedLLM, connections, isMPPEnabled]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const renderMessage = (message: Message) => {
        if (message.fromUser) {
            return (
                <div className="bg-blue-600 text-white rounded-lg p-3 max-w-[80%] ml-auto">
                    <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
            );
        }

        // Проверяем, является ли сообщение ответом на SQL-запрос
        if (message.content.includes('## Оптимизированный SQL') || message.content.includes('## Информация о запросе')) {
            try {
                const parsedResponse = parseLLMResponse(message.content);
                
                // Используем информацию о подключении из контекста
                const hasDatabaseConnection = connections.length > 0;
                
                // Извлекаем метрики выполнения из планов
                let executionMetrics = {
                    originalTime: 0,
                    optimizedTime: 0,
                    improvement: 0
                };

                if (hasDatabaseConnection && parsedResponse.originalPlan && parsedResponse.optimizedPlan) {
                    const originalTime = extractExecutionTime(parsedResponse.originalPlan.toString());
                    const optimizedTime = extractExecutionTime(parsedResponse.optimizedPlan.toString());
                    
                    if (originalTime !== null && optimizedTime !== null) {
                        executionMetrics = {
                            originalTime,
                            optimizedTime,
                            improvement: ((originalTime - optimizedTime) / originalTime) * 100
                        };
                    }
                }

                // Проверяем, является ли ответ от LLM
                if (message.content.includes('## Оптимизированный SQL') || 
                    message.content.includes('## Пояснение') || 
                    message.content.includes('## Оценка улучшения') || 
                    message.content.includes('## Потенциальные риски')) {
                    return (
                        <div className="bg-gray-800 text-white rounded-lg p-3 max-w-[80%]">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                components={{
                                    code: ({node, inline, className, children, ...props}: CodeProps) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                style={vscDarkPlus as any}
                                                language={match[1]}
                                                PreTag="div"
                                                {...props}
                                            >
                                                {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...props}>
                                                {children}
                                            </code>
                                        );
                                    },
                                    h2: ({node, ...props}) => (
                                        <h2 className="text-xl font-bold mt-4 mb-2 text-blue-400" {...props} />
                                    ),
                                    p: ({node, ...props}) => (
                                        <p className="my-2" {...props} />
                                    ),
                                    ul: ({node, ...props}) => (
                                        <ul className="list-disc list-inside my-2" {...props} />
                                    ),
                                    li: ({node, ...props}) => (
                                        <li className="ml-4" {...props} />
                                    )
                                }}
                            >
                                {message.content}
                            </ReactMarkdown>
                        </div>
                    );
                }

                // Для локальной модели используем полный вывод
                return (
                    <OptimizedSQLResponse
                        originalQuery={parsedResponse.originalQuery}
                        optimizedQuery={parsedResponse.optimizedQuery}
                        optimizationRationale={parsedResponse.optimizationRationale}
                        performanceImpact={parsedResponse.performanceImpact}
                        potentialRisks={parsedResponse.potentialRisks}
                        originalPlan={parsedResponse.originalPlan ? parseQueryPlan(parsedResponse.originalPlan.toString()) : null}
                        optimizedPlan={parsedResponse.optimizedPlan ? parseQueryPlan(parsedResponse.optimizedPlan.toString()) : null}
                        executionMetrics={executionMetrics}
                        hasDatabaseConnection={hasDatabaseConnection}
                        tablesMetadata={parsedResponse.tablesMetadata}
                    />
                );
            } catch (error) {
                console.error('Error parsing LLM response:', error);
                return (
                    <div className="bg-gray-800 text-white rounded-lg p-3 max-w-[80%]">
                        <div className="whitespace-pre-wrap">{message.content}</div>
                    </div>
                );
            }
        }

        return (
            <div className="bg-gray-800 text-white rounded-lg p-3 max-w-[80%]">
                <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
        );
    };

    const renderedMessages = useMemo(() => {
        return localMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'}`}>
                {renderMessage(msg)}
            </div>
        ));
    }, [localMessages, renderMessage]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="flex items-center space-x-4">
                    <LLMSelect
                        selectedLLM={selectedLLM}
                        onSelectLLM={onSelectLLM}
                    />
                    <div className="flex items-center space-x-2">
                        <div 
                            className={cn(
                                "w-2 h-2 rounded-full",
                                connections.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-500',
                                loading && 'animate-spin'
                            )}
                        />
                        <span className="text-sm text-gray-400">
                            {loading ? 'Подключение...' : 
                             connections.length > 0 ? `Подключено к БД (${connections[0].name})` : 
                             'Нет подключения к БД'}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Button
                        onClick={() => setIsMPPEnabled(!isMPPEnabled)}
                        className={cn(
                            "bg-secondary text-text px-4 py-2 rounded-lg",
                            isMPPEnabled && "bg-[#2563EB]"
                        )}
                        disabled={loading}
                    >
                        {isMPPEnabled ? "MPP: on" : "MPP: off"}
                    </Button>
                    <Button
                        onClick={onConnectDB}
                        className={cn(
                            "px-4 py-2 rounded-lg",
                            connections.length > 0 
                                ? "bg-blue-600 hover:bg-blue-700 text-white" 
                                : "bg-green-600 hover:bg-green-700 text-white"
                        )}
                        disabled={loading}
                    >
                        {connections.length > 0 ? 'Изменить подключение' : 'Подключить БД'}
                    </Button>
                </div>
            </div>
            <div className="p-4">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800" style={{ height: 'calc(100vh - 260px)' }}>
                    {loading ? (
                        <div className="flex justify-center items-center h-full">
                            <LoadingMessage />
                        </div>
                    ) : localMessages.length === 0 ? (
                        <p className="text-gray-500">No messages yet. Start a conversation!</p>
                    ) : (
                        <div className="flex flex-col space-y-4 w-full">
                            {renderedMessages}
                            <div ref={messagesEndRef} />
                        </div>
                    )}
                </div>
            </div>
            <div className="p-4 mt-auto">
                {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                <div className="flex items-center space-x-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Ожидаю вашего SQL запроса..."
                        className="flex-1 bg-[#4A4A4A] text-text"
                        multiline
                        disabled={loading}
                    />
                    <Button onClick={handleSendMessage} className="p-2 rounded-full" disabled={loading}>
                        ➤
                    </Button>
                </div>
            </div>
        </div>
    );
});

// Функция для извлечения времени выполнения из плана
const extractExecutionTime = (plan: string): number | null => {
    const match = plan.match(/Execution Time: (\d+\.?\d*) ms/);
    return match ? parseFloat(match[1]) : null;
};

export default ChatArea;
