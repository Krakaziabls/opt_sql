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
import { connectionApi, DatabaseConnectionDto } from '../api/connection';
import { chatApi } from '../api/chat';
import { createWebSocketClient, disconnectWebSocket } from '../api/websocket';
import { OptimizedSQLResponse } from './OptimizedSQLResponse';
import { parseLLMResponse } from '../lib/llmResponseParser';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

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
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [connections, setConnections] = useState<DatabaseConnectionDto[]>([]);
    const [localMessages, setLocalMessages] = useState<Message[]>([]);
    const [pendingMessageIds, setPendingMessageIds] = useState<string[]>([]);
    const [isMPP, setIsMPP] = useState(false);
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

    useEffect(() => {
        if (!selectedChatId) return;

        const fetchConnections = async () => {
            try {
                const connections = await connectionApi.getConnectionsForChat(selectedChatId);
                setConnections(connections);
            } catch (err) {
                setError('Failed to load connections: ' + (err instanceof Error ? err.message : 'Unknown error'));
            }
        };

        fetchConnections();
    }, [selectedChatId]);

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

                    if (processedMessageIds.current.has(newMessage.id)) return;

                    processedMessageIds.current.add(newMessage.id);

                    if (isSQLQuery(newMessage.content) && pendingMessageIds.length > 0) {
                        const tempId = pendingMessageIds[0];
                        setPendingMessageIds(prev => prev.slice(1));
                        setLocalMessages(prev => prev.filter(m => m.id !== tempId));
                    }

                    setLocalMessages(prev => [...prev, newMessage]);
                    setTimeout(() => {
                        scrollToBottom();
                    }, 100);
                } catch (err) {
                    console.error('Error processing message:', err);
                }
            });

            wsClient.current = client as WebSocketClient;
            wsClient.current.subscription = subscription;
        };

        client.onStompError = (error) => {
            setError('WebSocket error: ' + error.headers.message);
        };

        client.onWebSocketError = () => {
            setError('WebSocket connection error');
        };

        client.activate();

        return () => {
            if (wsClient.current?.active) {
                wsClient.current.subscription?.unsubscribe();
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
                };
                setLocalMessages(prev => [...prev, tempMessage]);
                setPendingMessageIds(prev => [...prev, tempId]);

                await sqlApi.optimizeQuery({
                    chatId: selectedChatId,
                    query: currentMessage,
                    databaseConnectionId: connections.length > 0 ? connections[0].id : undefined,
                    llm: selectedLLM,
                    isMPP: isMPP
                });
            } else {
                await chatApi.sendMessage(selectedChatId, currentMessage, true);
                await chatApi.sendMessage(selectedChatId, "Please submit SQL query for optimization", false);
            }
        } catch (err) {
            setError('Failed to send message: ' + (err instanceof Error ? err.message : 'Unknown error'));
            setLocalMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
            setPendingMessageIds([]);
        } finally {
            setLoading(false);
        }
    }, [message, selectedChatId, connections, selectedLLM, isMPP]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    }, [handleSendMessage]);

    const renderMessage = (message: Message) => {
        if (message.fromUser) {
            return (
                <div className="whitespace-pre-wrap break-words text-white">
                    {message.content}
                </div>
            );
        }

        // Для сообщений от LLM используем Markdown
        return (
            <div className="prose prose-invert max-w-none
                prose-headings:text-text prose-headings:font-semibold prose-headings:mb-4
                prose-p:text-text prose-p:my-2
                prose-strong:text-text prose-strong:font-semibold
                prose-code:text-text prose-code:bg-gray-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-900 prose-pre:border prose-pre:border-gray-700 prose-pre:rounded-lg prose-pre:p-4
                prose-ul:text-text prose-ul:list-disc prose-ul:pl-6 prose-ul:my-2
                prose-ol:text-text prose-ol:list-decimal prose-ol:pl-6 prose-ol:my-2
                prose-li:text-text prose-li:my-1
                prose-blockquote:text-text prose-blockquote:border-l-4 prose-blockquote:border-gray-700 prose-blockquote:pl-4 prose-blockquote:italic
                prose-hr:border-gray-700 prose-hr:my-4">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                    components={{
                        code: ({ node, inline, className, children, ...props }: CodeProps) => {
                            const match = /language-(\w+)/.exec(className || '');
                            return !inline && match ? (
                                <SyntaxHighlighter
                                    style={vscDarkPlus}
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
                        }
                    }}
                >
                    {message.content}
                </ReactMarkdown>
            </div>
        );
    };

    const renderedMessages = useMemo(() => {
        return localMessages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.fromUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-3xl w-full ${msg.fromUser ? 'bg-[#4A4A4A]' : 'bg-gray-800'} rounded-lg p-4`}>
                    {renderMessage(msg)}
                </div>
            </div>
        ));
    }, [localMessages, renderMessage]);

    return (
        <div className="flex-1 flex flex-col h-screen bg-background text-text">
            <div className="p-4">
                <div className="mb-4 flex justify-center items-center space-x-4">
                    <LLMSelect value={selectedLLM} onValueChange={onSelectLLM} />
                    <Button
                        onClick={() => setIsMPP(!isMPP)}
                        className={cn(
                            "bg-secondary text-text px-4 py-2 rounded-lg",
                            isMPP && "bg-[#2563EB]"
                        )}
                        disabled={loading}
                    >
                        {isMPP ? "MPP: on" : "MPP: off"}
                    </Button>
                </div>
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
                <Button onClick={onConnectDB} className="mb-2" disabled={loading}>
                    Connect database
                </Button>
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

export default ChatArea;
